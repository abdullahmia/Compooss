# Releasing the Desktop App

Step-by-step commands for building the desktop installers of a release and attaching them to its GitHub release. For how the desktop app and its build work, see [DESKTOP.md](DESKTOP.md).

---

## How a release works

The web app, the Docker image and the desktop app share one version.

1. You merge release-please's release PR (for example "chore(main): release 1.24.0").
2. GitHub Actions creates the GitHub release `v1.24.0` and publishes the Docker image. Nothing else to do for those.
3. **You** build the desktop installers on a Mac and attach them to `v1.24.0`. That's this guide.

---

## What you need

- A **Mac** (Apple Silicon or Intel). macOS installers can only be built on macOS, and the scripts build the Windows and Linux installers from a Mac too.
- About **20 GB of free disk space**. Most of it is build tools and compiled files, which are reused for later releases.
- Push access to [abdullahmia/compooss](https://github.com/abdullahmia/compooss).

---

## Step 1: Install the tools (once per Mac)

Skip this step on a Mac you've already set up.

```bash
xcode-select --install                                              # skip if already installed
curl -fsSL https://bun.sh/install | bash                            # Bun
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y   # Rust
source "$HOME/.cargo/env"
brew install gh nsis llvm lld                                       # GitHub CLI + Windows build tools
brew install --cask docker                                          # Docker Desktop, for the Linux build
cargo install --locked cargo-xwin                                   # Windows build tool (takes a few minutes)
gh auth login                                                       # log in to GitHub
```

If the Mac doesn't have Homebrew, install it first from [brew.sh](https://brew.sh). Open a new terminal afterwards so `bun` and `cargo` are found.

---

## Step 2: Get the code at the release

Set the version you're releasing. Every later command uses it.

```bash
VERSION=1.24.0
```

**First time on this Mac**, clone the repo:

```bash
git clone https://github.com/abdullahmia/compooss.git
cd compooss
```

**Already cloned**, update it:

```bash
cd compooss
git switch main
git pull
```

Then switch to a new branch at the release's commit and install the dependencies:

```bash
git switch -c chore/desktop-$VERSION v$VERSION
bun install
```

The installers are built from the files in this folder. Being exactly on `v$VERSION` makes sure they match the released code.

---

## Step 3: Check the setup

```bash
open -a Docker        # wait until Docker Desktop says it's running
bun desktop check
```

All four platforms should show ✓. A platform that can't be built yet shows what it needs, for example "Docker isn't running" or "needs NSIS (brew install nsis)".

---

## Step 4: Build the installers

```bash
bun desktop release
```

Press `y` when it asks to build. It takes a while, and the Linux build is the slowest part. When it's done, `apps/desktop/release/$VERSION/` contains:

- `Compooss-$VERSION-macos-arm64.dmg`
- `Compooss-$VERSION-macos-x64.dmg`
- `Compooss-$VERSION-windows-x64-setup.exe`
- `Compooss-$VERSION-linux-amd64.deb`
- `SHA256SUMS.txt`

---

## Step 5: Attach them to the GitHub release

```bash
bun desktop publish
```

This uploads the five files to the release `v$VERSION` and adds a "Desktop app" section with download instructions below the changelog. Check it:

```bash
open "https://github.com/abdullahmia/compooss/releases/tag/v$VERSION"
```

---

## Step 6: Point the landing page at the new version

Step 4 updated `apps/docs/src/lib/constants/desktop-release.json`, which the landing page's download buttons read. Commit it and merge it into `main`:

```bash
git commit -m "chore(desktop): link the $VERSION installers on the landing page" -- apps/docs/src/lib/constants/desktop-release.json
git push -u origin chore/desktop-$VERSION
gh pr create --base main --fill
gh pr merge --merge
```

A `chore` commit doesn't make release-please start a new release.

---

## Step 7: Deploy the docs site

Deploy `apps/docs` the way you usually do. Once it's live, the download buttons on [compooss.dev](https://compooss.dev/#download) point to the new installers.

Then go back to `main`:

```bash
git switch main
git pull
```

---

## Next time

Skip Step 1. Set `VERSION` to the new version and run Steps 2 to 7.

---

## Troubleshooting

- **"There's no GitHub release v… yet"** when publishing: release-please hasn't created the release. Merge its release PR first, then run `git pull`.
- **"This isn't v…"** before building: you're not on the release's commit, so the installers would contain different code. Go back to Step 2.
- **One platform failed to build**: fix the problem shown in the log, then build only that platform again and publish:

  ```bash
  bun desktop:release --targets x86_64-unknown-linux-gnu   # or aarch64-apple-darwin, x86_64-apple-darwin, x86_64-pc-windows-msvc
  bun desktop publish
  ```

  Publishing again replaces the files on the release.
- **Low on disk space after a release**: the compiled files can be deleted. The next build recreates them, which just takes longer:

  ```bash
  rm -rf apps/desktop/src-tauri/target apps/desktop/src-tauri/target-linux ~/.cache/compooss-desktop
  ```

For anything else, see [DESKTOP.md — Troubleshooting](DESKTOP.md#troubleshooting). Full build logs are in `apps/desktop/release/logs/`.
