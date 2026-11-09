#!/usr/bin/env bash
#
# Compooss Desktop: an interactive helper for building the desktop app.
#
#   bun desktop                    open the menu
#   bun desktop dev                desktop window on the Next.js dev server
#   bun desktop build              package the app for this Mac, for testing
#   bun desktop release [--yes]    build the current version for every platform this Mac can
#   bun desktop publish            attach the built installers to the version's GitHub release
#   bun desktop check              show which platforms this Mac can build
#
# It drives build.ts and release.ts next to it; see docs/DESKTOP.md.
# Written for the bash 3.2 that ships with macOS.

set -o pipefail

DESKTOP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$DESKTOP_DIR/../.." && pwd)"
RELEASE_DIR="$DESKTOP_DIR/release"
LOG_DIR="$RELEASE_DIR/logs"
MANIFEST_FILE=apps/docs/src/lib/constants/desktop-release.json
# rustup installs here, and it may not be on PATH yet.
export PATH="$HOME/.cargo/bin:$PATH"

TRIPLES=(aarch64-apple-darwin x86_64-apple-darwin x86_64-pc-windows-msvc x86_64-unknown-linux-gnu)
NAMES=("macOS (Apple Silicon)" "macOS (Intel)" "Windows (x64)" "Linux (x64)")

# ── Look ──────────────────────────────────────────────────────────────────────

ESC=$'\033'
if [[ -t 1 && -z "${NO_COLOR:-}" ]]; then
  RESET="$ESC[0m" BOLD="$ESC[1m" DIM="$ESC[2m"
  ACCENT="$ESC[38;5;42m" RED="$ESC[38;5;203m" YELLOW="$ESC[38;5;221m" GRAY="$ESC[38;5;245m"
else
  RESET="" BOLD="" DIM="" ACCENT="" RED="" YELLOW="" GRAY=""
fi
INTERACTIVE=0
[[ -t 0 && -t 1 ]] && INTERACTIVE=1
SPINNER=(⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏)

hide_cursor() { ((INTERACTIVE)) && printf '%s' "$ESC[?25l"; }
show_cursor() { ((INTERACTIVE)) && printf '%s' "$ESC[?25h"; }

# Keys are read one at a time; don't let typed-ahead keys print over the screen.
STTY_SAVED=""
if ((INTERACTIVE)); then
  STTY_SAVED=$(stty -g)
  stty -echo
fi
restore_terminal() {
  show_cursor
  [[ -n $STTY_SAVED ]] && stty "$STTY_SAVED"
}

CHILD_PID=""
on_interrupt() {
  [[ -n $CHILD_PID ]] && kill "$CHILD_PID" 2>/dev/null
  printf '\r%s\n  %sCancelled.%s\n\n' "$ESC[2K" "$YELLOW" "$RESET"
  exit 130
}
trap restore_terminal EXIT
trap on_interrupt INT TERM

duration() {
  if (($1 >= 60)); then printf '%dm %02ds' $(($1 / 60)) $(($1 % 60)); else printf '%ds' "$1"; fi
}

human_size() {
  awk -v b="$1" 'BEGIN {
    if (b >= 1048576) printf "%.0f MB", b / 1048576
    else if (b >= 1024) printf "%.0f KB", b / 1024
    else printf "%d B", b
  }'
}

relative() { printf '%s' "${1#"$REPO_ROOT"/}"; }

pause() {
  ((INTERACTIVE)) || return 0
  printf '\n  %sPress any key to continue%s' "$DIM" "$RESET"
  IFS= read -rsn1 _
}

# ── Facts about this machine and repo ────────────────────────────────────────

current_version() {
  sed -nE 's/^[[:space:]]*"version": "([^"]+)".*/\1/p' "$DESKTOP_DIR/package.json" | head -1
}

# Same as releaseTag() in release.ts.
release_tag() { echo "v$1"; }

# Warns when the working tree isn't the commit release-please tagged for
# VERSION, since that's what the installers are built from.
tag_warning() {
  local tag tagged
  tag=$(release_tag "$1")
  tagged=$(git -C "$REPO_ROOT" rev-parse -q --verify "refs/tags/$tag^{commit}" 2>/dev/null)
  if [[ -z $tagged ]]; then
    printf "  %s! There's no %s tag yet. Merge release-please's release PR, then git pull.%s\n" "$YELLOW" "$tag" "$RESET"
  elif [[ $tagged != $(git -C "$REPO_ROOT" rev-parse HEAD) ]]; then
    printf "  %s! This isn't %s, so the installers won't match that release's code.%s\n" "$YELLOW" "$tag" "$RESET"
  fi
}

uncommitted_changes() { git -C "$REPO_ROOT" status --porcelain 2>/dev/null | wc -l | tr -d ' '; }

host_triple() { [[ $(uname -m) == arm64 ]] && echo aarch64-apple-darwin || echo x86_64-apple-darwin; }

has() { command -v "$1" >/dev/null 2>&1; }

# Homebrew installs llvm and lld off PATH; build.ts finds them there.
has_keg_tool() {
  has "$2" || [[ -x /opt/homebrew/opt/$1/bin/$2 || -x /usr/local/opt/$1/bin/$2 ]]
}

# Why this Mac can't build platform INDEX, or nothing if it can.
platform_blocker() {
  [[ $(uname -s) == Darwin ]] || { echo "builds run on a Mac"; return; }
  has cargo || { echo "needs Rust (rustup.rs)"; return; }
  case ${TRIPLES[$1]} in
    *apple-darwin)
      xcode-select -p >/dev/null 2>&1 || echo "needs Xcode tools (xcode-select --install)" ;;
    *windows*)
      if ! has makensis; then echo "needs NSIS (brew install nsis)"
      elif ! has_keg_tool llvm clang-cl; then echo "needs LLVM (brew install llvm)"
      elif ! has_keg_tool lld lld-link; then echo "needs lld (brew install lld)"
      elif ! has cargo-xwin; then echo "needs cargo-xwin (cargo install --locked cargo-xwin)"
      fi ;;
    *linux*)
      if ! has docker; then echo "needs Docker Desktop"
      elif ! docker info >/dev/null 2>&1; then echo "Docker isn't running"
      fi ;;
  esac
}

# ── Screen pieces ─────────────────────────────────────────────────────────────

header() {
  ((INTERACTIVE)) && printf '%s' "$ESC[2J$ESC[H"
  local branch changes
  branch=$(git -C "$REPO_ROOT" branch --show-current 2>/dev/null)
  changes=$(uncommitted_changes)
  printf '\n  %s●%s %sCompooss Desktop%s  %sv%s%s\n' \
    "$ACCENT" "$RESET" "$BOLD" "$RESET" "$GRAY" "$(current_version)" "$RESET"
  printf '    %s%s' "$GRAY" "${branch:-no branch}"
  if ((changes > 0)); then
    printf ' · %s%s uncommitted %s%s' "$YELLOW" "$changes" "$([[ $changes == 1 ]] && echo change || echo changes)" "$GRAY"
  else
    printf ' · clean'
  fi
  printf '%s\n\n' "$RESET"
}

# choose "Title" "Label|Description" ...
# Arrow-key menu. Sets CHOICE to the picked index, or -1 when backed out.
choose() {
  local title=$1
  shift
  local options=("$@") count=$# selected=0 key rest i label desc
  printf '  %s%s%s\n\n' "$BOLD" "$title" "$RESET"
  hide_cursor
  while :; do
    for ((i = 0; i < count; i++)); do
      label=${options[i]%%|*}
      desc=${options[i]#*|}
      if ((i == selected)); then
        printf '%s  %s❯ %-14s%s %s\n' "$ESC[2K" "$ACCENT$BOLD" "$label" "$RESET" "$desc"
      else
        printf '%s    %-14s %s%s%s\n' "$ESC[2K" "$label" "$GRAY" "$desc" "$RESET"
      fi
    done
    printf '%s\n%s  %s↑↓ move · enter select · q back%s\n' "$ESC[2K" "$ESC[2K" "$DIM" "$RESET"
    IFS= read -rsn1 key
    case $key in
      "$ESC")
        IFS= read -rsn2 rest
        case $rest in
          '[A' | OA) selected=$(((selected + count - 1) % count)) ;;
          '[B' | OB) selected=$(((selected + 1) % count)) ;;
        esac ;;
      k) selected=$(((selected + count - 1) % count)) ;;
      j) selected=$(((selected + 1) % count)) ;;
      "") break ;;
      q | Q) selected=-1; break ;;
      [1-9]) if ((key <= count)); then selected=$((key - 1)); break; fi ;;
    esac
    printf '%s' "$ESC[$((count + 2))A"
  done
  show_cursor
  CHOICE=$selected
}

# Checkbox list of platforms; sets PICKED to the chosen indexes.
# Platforms this Mac can't build are shown with the reason and can't be ticked.
pick_platforms() {
  local count=${#TRIPLES[@]} selected=0 key rest i box message=""
  local on=() blockers=()
  printf '  %sChecking this Mac…%s' "$GRAY" "$RESET"
  for ((i = 0; i < count; i++)); do
    blockers[i]=$(platform_blocker "$i")
    if [[ -z ${blockers[i]} ]]; then on[i]=1; else on[i]=0; fi
  done
  printf '\r%s  %sWhich platforms?%s\n\n' "$ESC[2K" "$BOLD" "$RESET"
  hide_cursor
  while :; do
    for ((i = 0; i < count; i++)); do
      if [[ -n ${blockers[i]} ]]; then
        box="${DIM}[-]"
      elif ((on[i])); then
        box="${ACCENT}[✓]${RESET}"
      else
        box="[ ]"
      fi
      if ((i == selected)); then
        printf '%s  %s❯%s %s %s%-22s%s %s%s%s\n' "$ESC[2K" "$ACCENT" "$RESET" "$box" "$BOLD" "${NAMES[i]}" "$RESET" "$YELLOW" "${blockers[i]}" "$RESET"
      else
        printf '%s    %s %-22s%s %s%s%s\n' "$ESC[2K" "$box" "${NAMES[i]}" "$RESET" "$GRAY" "${blockers[i]}" "$RESET"
      fi
    done
    printf '%s  %s%s%s\n' "$ESC[2K" "$YELLOW" "$message" "$RESET"
    printf '%s  %s↑↓ move · space toggle · a all · enter confirm · q back%s\n' "$ESC[2K" "$DIM" "$RESET"
    message=""
    IFS= read -rsn1 key
    case $key in
      "$ESC")
        IFS= read -rsn2 rest
        case $rest in
          '[A' | OA) selected=$(((selected + count - 1) % count)) ;;
          '[B' | OB) selected=$(((selected + 1) % count)) ;;
        esac ;;
      k) selected=$(((selected + count - 1) % count)) ;;
      j) selected=$(((selected + 1) % count)) ;;
      " ")
        if [[ -n ${blockers[selected]} ]]; then message="This Mac can't build ${NAMES[selected]}: ${blockers[selected]}."
        else on[selected]=$((1 - on[selected])); fi ;;
      a | A)
        local all=1
        for ((i = 0; i < count; i++)); do [[ -z ${blockers[i]} ]] && ((on[i] == 0)) && all=0; done
        for ((i = 0; i < count; i++)); do [[ -z ${blockers[i]} ]] && on[i]=$((1 - all)); done ;;
      "")
        PICKED=()
        for ((i = 0; i < count; i++)); do ((on[i])) && PICKED+=("$i"); done
        if ((${#PICKED[@]} > 0)); then break; fi
        message="Pick at least one platform." ;;
      q | Q) show_cursor; return 1 ;;
    esac
    printf '%s' "$ESC[$((count + 2))A"
  done
  show_cursor
  return 0
}

confirm() {
  local key
  printf '  %s %s[y/N]%s ' "$1" "$GRAY" "$RESET"
  IFS= read -rsn1 key
  if [[ $key == y || $key == Y ]]; then echo yes; return 0; fi
  echo no
  return 1
}

# The newest line of a build log, cleaned up to fit after the spinner.
last_log_line() {
  local width=$(($(tput cols 2>/dev/null || echo 100) - 42))
  ((width < 12)) && return
  tail -c 4000 "$1" 2>/dev/null | tr '\r' '\n' | sed -e "s/$ESC\[[0-9;]*[A-Za-z]//g" -e 's/^[[:space:]]*//' |
    grep -v '^$' | tail -1 | cut -c "1-$width"
}

# run_step LABEL LOG COMMAND...
# Runs COMMAND with its output in LOG, showing a spinner, the elapsed time
# and the latest log line. Ends with ✓ or ✗ and the time taken.
run_step() {
  local label=$1 log=$2
  shift 2
  local start=$SECONDS frame=0 line="" status
  "$@" >>"$log" 2>&1 &
  CHILD_PID=$!
  if ((INTERACTIVE)); then
    hide_cursor
    while kill -0 "$CHILD_PID" 2>/dev/null; do
      ((frame % 5 == 0)) && line=$(last_log_line "$log")
      printf '\r%s    %s%s%s %-22s %s%8s%s  %s%s%s' "$ESC[2K" "$ACCENT" "${SPINNER[frame % 10]}" "$RESET" \
        "$label" "$GRAY" "$(duration $((SECONDS - start)))" "$RESET" "$DIM" "$line" "$RESET"
      frame=$((frame + 1))
      sleep 0.1
    done
  fi
  wait "$CHILD_PID"
  status=$?
  CHILD_PID=""
  if ((status == 0)); then
    printf '\r%s    %s✓%s %-22s %s%8s%s\n' "$ESC[2K" "$ACCENT" "$RESET" "$label" "$GRAY" "$(duration $((SECONDS - start)))" "$RESET"
  else
    printf '\r%s    %s✗%s %-22s %s%8s%s\n' "$ESC[2K" "$RED" "$RESET" "$label" "$GRAY" "$(duration $((SECONDS - start)))" "$RESET"
  fi
  show_cursor
  return "$status"
}

new_log() {
  mkdir -p "$LOG_DIR"
  echo "$LOG_DIR/$(date +%Y%m%d-%H%M%S)-$1.log"
}

# show_failure LOG [WHAT FAILED]
show_failure() {
  printf '\n  %s%s Last lines of the log:%s\n\n' "$RED" "${2:-The build failed.}" "$RESET"
  tr '\r' '\n' <"$1" | sed "s/$ESC\[[0-9;]*[A-Za-z]//g" | grep -v '^[[:space:]]*$' | tail -n 20 | sed 's/^/    /'
  printf '\n  Full log: %s\n' "$(relative "$1")"
}

# Lists what's in release/VERSION and what to do with it.
show_release() {
  local dir="$RELEASE_DIR/$1" file
  printf '  %s✓ Compooss %s is ready%s  %s%s%s\n\n' "$ACCENT$BOLD" "$1" "$RESET" "$GRAY" "$(relative "$dir")" "$RESET"
  for file in "$dir"/*; do
    [[ -f $file ]] || continue
    printf '    %-44s %s%7s%s\n' "$(basename "$file")" "$GRAY" "$(human_size "$(wc -c <"$file" | tr -d ' ')")" "$RESET"
  done
  printf '\n  %sNext%s\n' "$BOLD" "$RESET"
  printf '    1. Publish: attach them to the GitHub release %s%s%s\n' "$BOLD" "$(release_tag "$1")" "$RESET"
  printf '    2. Commit %s and get it into main\n' "$(basename "$MANIFEST_FILE")"
  printf '    3. Deploy the docs site\n\n'
}

# ── Commands ──────────────────────────────────────────────────────────────────

cmd_dev() {
  header
  printf '  %sDevelop%s\n\n' "$BOLD" "$RESET"
  printf '  Starting the Next.js dev server on port 29018 and the desktop window.\n'
  printf '  %sChanges reload live. Press Ctrl+C to stop.%s\n\n' "$GRAY" "$RESET"
  # Ctrl+C should stop the dev servers, not this menu.
  trap 'printf "\n"' INT
  (cd "$DESKTOP_DIR" && bun run desktop:dev)
  trap on_interrupt INT TERM
  pause
}

cmd_build() {
  local version log dmg
  version=$(current_version)
  header
  printf '  %sTest build%s  %sfor this Mac · version %s%s\n\n' "$BOLD" "$RESET" "$GRAY" "$version" "$RESET"
  log=$(new_log build)
  if ! run_step "Building" "$log" bun "$DESKTOP_DIR/scripts/build.ts"; then
    show_failure "$log"
    pause
    return 1
  fi
  dmg=$(ls -t "$DESKTOP_DIR/src-tauri/target/$(host_triple)/release/bundle/dmg/"*.dmg 2>/dev/null | head -1)
  printf '\n  %s✓%s %s\n\n' "$ACCENT" "$RESET" "$(relative "$dmg")"
  ((INTERACTIVE)) || return 0
  choose "Next" "Open it|Mount the .dmg to try the app" "Show|Show it in Finder" "Done|Back to the menu"
  case $CHOICE in
    0) open "$dmg" ;;
    1) open -R "$dmg" ;;
  esac
}

# Builds the installers for the current version, which release-please sets.
release_flow() {
  local version changes i names=""
  version=$(current_version)
  header
  pick_platforms || return
  for i in "${PICKED[@]}"; do names="${names:+$names, }${NAMES[i]}"; done
  changes=$(uncommitted_changes)

  printf '\n  %sSummary%s\n' "$BOLD" "$RESET"
  printf '    Version    %s\n' "$version"
  printf '    Platforms  %s\n' "$names"
  printf '    Output     %s\n\n' "$(relative "$RELEASE_DIR/$version")"
  tag_warning "$version"
  ((changes > 0)) && printf '  %s! %s uncommitted changes will be part of this build.%s\n' "$YELLOW" "$changes" "$RESET"
  [[ " ${PICKED[*]} " == *" 3 "* ]] && printf '  %s! Linux builds in Docker under emulation, which is the slow part.%s\n' "$YELLOW" "$RESET"
  printf '\n'
  confirm "Start the build?" || return
  run_release "$version" "${PICKED[@]}"
}

# run_release VERSION INDEX...
run_release() {
  local version=$1 log start=$SECONDS first=1 idx
  shift
  local args=()
  log=$(new_log "release-$version")
  printf '\n  %sBuilding Compooss %s%s\n\n' "$BOLD" "$version" "$RESET"
  for idx in "$@"; do
    args=(--targets "${TRIPLES[idx]}")
    # The server tree is the same for every platform, so build it once.
    ((first)) || args+=(--skip-server)
    if ! run_step "${NAMES[idx]}" "$log" bun "$DESKTOP_DIR/scripts/release.ts" "${args[@]}"; then
      show_failure "$log"
      printf '\n  Fix the problem, then build that platform again.\n'
      pause
      return 1
    fi
    first=0
  done
  printf '\n  %sAll done in %s · log: %s%s\n' "$GRAY" "$(duration $((SECONDS - start)))" "$(relative "$log")" "$RESET"
  ((INTERACTIVE)) && pause
  release_actions "$version"
}

commit_manifest() {
  local log message="chore(desktop): link the $1 installers on the landing page"
  if git -C "$REPO_ROOT" diff --quiet -- "$MANIFEST_FILE"; then
    MESSAGE="Nothing to commit: $(basename "$MANIFEST_FILE") hasn't changed."
    return
  fi
  log=$(new_log commit)
  printf '\n'
  if run_step "Committing $1" "$log" git -C "$REPO_ROOT" commit -m "$message" -- "$MANIFEST_FILE"; then
    MESSAGE="Committed \"$message\". Get it into main, then deploy the docs site."
  else
    show_failure "$log"
    pause
  fi
}

release_actions() {
  local version=$1 dir="$RELEASE_DIR/$1"
  MESSAGE=""
  ((INTERACTIVE)) || { show_release "$version"; return; }
  while :; do
    header
    show_release "$version"
    [[ -n $MESSAGE ]] && printf '  %s%s%s\n\n' "$ACCENT" "$MESSAGE" "$RESET"
    MESSAGE=""
    choose "What now?" \
      "Publish|Attach them to the GitHub release $(release_tag "$version")" \
      "Commit|Commit $(basename "$MANIFEST_FILE") for the landing page" \
      "Open folder|Show it in Finder" \
      "Copy path|Copy the folder path to the clipboard" \
      "Done|Back to the menu"
    case $CHOICE in
      0) publish_version "$version" ;;
      1) commit_manifest "$version" ;;
      2) open "$dir" ;;
      3) printf '%s' "$dir" | pbcopy && MESSAGE="Copied $dir" ;;
      *) return ;;
    esac
  done
}

# Uploads release/VERSION to its GitHub release. Sets MESSAGE when it worked.
publish_version() {
  local log url
  log=$(new_log "publish-$1")
  printf '\n'
  if run_step "Publishing $1" "$log" bun "$DESKTOP_DIR/scripts/release.ts" --publish; then
    url=$(grep -oE 'https://github\.com/[^[:space:]]+/releases/tag/[^[:space:]]+' "$log" | tail -1)
    MESSAGE="Published ${url:-$(release_tag "$1")}. Commit $(basename "$MANIFEST_FILE") next."
  else
    show_failure "$log" "Publishing failed."
    pause
    return 1
  fi
}

cmd_publish() {
  local version
  version=$(current_version)
  header
  printf '  %sPublish%s  %srelease/%s → GitHub release %s%s\n' "$BOLD" "$RESET" "$GRAY" "$version" "$(release_tag "$version")" "$RESET"
  MESSAGE=""
  publish_version "$version" || return 1
  printf '\n  %s%s%s\n\n' "$ACCENT" "$MESSAGE" "$RESET"
}

cmd_refresh() {
  local version log
  version=$(current_version)
  header
  if [[ ! -d $RELEASE_DIR/$version ]]; then
    printf '  Nothing to scan: %s doesn'"'"'t exist yet. Build a release first.\n' "$(relative "$RELEASE_DIR/$version")"
    pause
    return
  fi
  log=$(new_log refresh)
  if run_step "Rescanning $version" "$log" bun "$DESKTOP_DIR/scripts/release.ts" --manifest-only; then
    printf '\n'
    release_actions "$version"
  else
    show_failure "$log"
    pause
  fi
}

cmd_open() {
  local dir
  dir="$RELEASE_DIR/$(current_version)"
  if [[ -d $dir ]]; then
    open "$dir"
  else
    header
    printf '  %s doesn'"'"'t exist yet. Build a release first.\n' "$(relative "$dir")"
    pause
  fi
}

cmd_check() {
  local i blocker
  printf '  %sTools%s\n' "$BOLD" "$RESET"
  check_tool "Bun" "$(bun --version 2>/dev/null)"
  check_tool "Rust" "$(cargo --version 2>/dev/null | awk '{print $2}')"
  check_tool "Xcode tools" "$(xcode-select -p >/dev/null 2>&1 && echo installed)"
  check_tool "Docker" "$(docker info >/dev/null 2>&1 && echo running)"
  check_tool "cargo-xwin" "$(cargo-xwin --version 2>/dev/null | awk '{print $2}')"
  check_tool "GitHub CLI" "$(gh auth status >/dev/null 2>&1 && echo "logged in")" \
    "$(has gh && echo "not logged in (gh auth login)" || echo "not found (brew install gh)")"
  printf '\n  %sPlatforms this Mac can build%s\n' "$BOLD" "$RESET"
  for ((i = 0; i < ${#TRIPLES[@]}; i++)); do
    blocker=$(platform_blocker "$i")
    if [[ -z $blocker ]]; then
      printf '    %s✓%s %s\n' "$ACCENT" "$RESET" "${NAMES[i]}"
    else
      printf '    %s✗%s %-22s %s%s%s\n' "$RED" "$RESET" "${NAMES[i]}" "$GRAY" "$blocker" "$RESET"
    fi
  done
}

# check_tool NAME VERSION [WHY IT'S MISSING]
check_tool() {
  if [[ -n $2 ]]; then
    printf '    %s✓%s %-12s %s%s%s\n' "$ACCENT" "$RESET" "$1" "$GRAY" "$2" "$RESET"
  else
    printf '    %s○%s %-12s %s%s%s\n' "$YELLOW" "$RESET" "$1" "$GRAY" "${3:-not found}" "$RESET"
  fi
}

main_menu() {
  local v
  while :; do
    header
    v=$(current_version)
    choose "What do you want to do?" \
      "Develop|Desktop window on the dev server, with live reload" \
      "Test build|Package the app for this Mac" \
      "Release|Build the $v installers, e.g. after release-please's release" \
      "Refresh|Rescan release/$v for the checksums and landing page" \
      "Publish|Attach release/$v to the GitHub release $(release_tag "$v")" \
      "Open folder|Show release/$v in Finder" \
      "Check setup|See which platforms this Mac can build" \
      "Quit|"
    case $CHOICE in
      0) cmd_dev ;;
      1) cmd_build; pause ;;
      2) release_flow ;;
      3) cmd_refresh ;;
      4) cmd_publish; pause ;;
      5) cmd_open ;;
      6) header; cmd_check; pause ;;
      *) break ;;
    esac
  done
  printf '\n'
}

usage() {
  sed -n '3,12p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}

# Non-interactive release: every platform this Mac can build.
release_all() {
  local yes=0 i version
  for arg in "$@"; do
    case $arg in
      --yes | -y) yes=1 ;;
      *) printf 'Unknown option: %s\n\n' "$arg"; usage; exit 1 ;;
    esac
  done
  PICKED=()
  for ((i = 0; i < ${#TRIPLES[@]}; i++)); do
    [[ -z $(platform_blocker "$i") ]] && PICKED+=("$i")
  done
  ((${#PICKED[@]} > 0)) || { cmd_check; exit 1; }
  version=$(current_version)
  printf '\n  %sCompooss %s%s\n\n' "$BOLD" "$version" "$RESET"
  tag_warning "$version"
  if ((!yes && INTERACTIVE)); then
    printf '\n'
    confirm "Build ${#PICKED[@]} platform(s)?" || exit 1
  fi
  run_release "$version" "${PICKED[@]}" || exit 1
}

case ${1:-} in
  "")
    if ((INTERACTIVE)); then main_menu; else usage; fi ;;
  dev) cmd_dev ;;
  build) cmd_build || exit 1 ;;
  release) shift; release_all "$@" ;;
  publish) cmd_publish || exit 1 ;;
  check) printf '\n'; cmd_check; printf '\n' ;;
  help | -h | --help) usage ;;
  *) printf 'Unknown command: %s\n\n' "$1"; usage; exit 1 ;;
esac
