# Desktop App

Compooss also ships as a desktop app for macOS, Windows and Linux, built with [Tauri v2](https://v2.tauri.app). It is the same Next.js app as the Docker image. Only the packaging is different.

---

## How it works

The app can't be a static export: MongoDB access runs server-side through API routes, `src/proxy.ts` and the Node.js `mongodb` driver. So the desktop app bundles a Node.js runtime and runs the existing **Next.js standalone server as a sidecar**. The window loads that server.

```
Compooss.app / Compooss.exe (Rust, apps/desktop/src-tauri)
 ├─ shows splash/index.html while the server starts
 ├─ spawns compooss-node server/desktop-entry.cjs     (bundled Node.js 24 + standalone server)
 │    PORT=29017  HOSTNAME=127.0.0.1  COMPOOSS_DESKTOP_TOKEN=<random per launch>
 ├─ on "__COMPOOSS_READY__": opens http://127.0.0.1:29017/__desktop?token=…
 │    (the proxy stores the token in a cookie and redirects to /)
 └─ on quit: stops the server. The server also exits when its stdin closes,
     so it never outlives a crashed app.
```

- **Desktop lock.** The shell runs user code with full Node access, so the bundled server only answers its own window. It rejects any `Host` other than `127.0.0.1:29017`, which stops DNS rebinding, and requires the per-launch token cookie (`apps/compooss/src/lib/utils/desktop.util.ts`). Docker builds never set `COMPOOSS_DESKTOP_TOKEN`, so none of this applies there.
- **Fixed port.** Saved connections live in the webview's IndexedDB, which is tied to the page's origin. Port `29017` and the bundle identifier `com.abdullahmia.compooss` must never change. If they did, users would lose their saved connections.
- **Native bits.** Downloads (exports, `pipeline.json`) go through `saveFile()` in `apps/compooss/src/lib/platform/platform.ts`. That opens a native save dialog through the `save_file` command, because desktop webviews ignore `<a download>`. On macOS, File → Close Tab (⌘W) closes the active collection tab. On Windows and Linux, Ctrl+W does the same (`desktop-bridge.component.tsx`).
- **Offline.** Monaco and the fonts are served by the app itself, not a CDN, so everything works without internet access. Only the update check goes online (see [Updates](#updates)).

| | |
|---|---|
| Server log | macOS `~/Library/Logs/com.abdullahmia.compooss/server.log` · Windows `%LOCALAPPDATA%\com.abdullahmia.compooss\logs` · Linux `~/.local/share/com.abdullahmia.compooss/logs` (also Help → Open Logs Folder on macOS) |
| Webview data (saved connections) | macOS `~/Library/WebKit/com.abdullahmia.compooss` · Windows `%LOCALAPPDATA%\com.abdullahmia.compooss\EBWebView` · Linux `~/.local/share/com.abdullahmia.compooss` |

---

## Layout

```
apps/desktop/
├── package.json              # @compooss/desktop (no build/dev scripts, so turbo and the pre-commit hook skip it)
├── splash/index.html         # loading screen (Tauri's frontendDist)
├── sidecar/desktop-entry.cjs # starts server.js and reports READY / errors on stdout
├── scripts/
│   ├── shared.ts             # Node version, target triples, paths, update signing key
│   ├── prepare-sidecar.ts    # builds .dist/server and downloads Node for a target
│   ├── build.ts              # builds installers and update packages for one target
│   └── release.ts            # builds every target into release/<version>/, writes latest.json, publishes it
├── docker/linux-builder.Dockerfile
└── src-tauri/
    ├── tauri.conf.json         # base config (enough for `tauri dev`), updater endpoint + public key
    ├── tauri.bundle.conf.json  # merged for builds: sidecar binary, server resources, update packages
    ├── Entitlements.plist      # V8 JIT entitlements (for future notarization)
    ├── windows/hooks.nsh       # stops the server before installing over it
    └── src/
        ├── main.rs             # window, navigation guard, IPC capability
        ├── sidecar.rs          # starts and stops the server
        ├── commands.rs         # save_file
        ├── updater.rs          # check_for_update, install_update
        └── menu.rs             # macOS menu bar
```

`prepare-sidecar.ts` builds the server in a staging copy of the repo (`~/.cache/compooss-desktop/stage`) installed with `bun install --linker hoisted`. Bun's default isolated layout is made of symlinks, and Tauri's bundler drops symlinks. The script then:

- copies the standalone output with symlinks resolved;
- removes `sharp`, which is unused;
- checks the tree: no symlinks, no native binaries, short paths;
- downloads the official Node.js build for the target and verifies its SHA-256;
- on a build for this machine, smoke-tests a read-only copy, including the desktop lock (set `MONGO_URL` to also test a connection).

---

## Prerequisites

- Bun, as for the rest of the repo.
- Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`.
- For release builds, the update signing key at `~/.tauri/compooss.key` (see [Updates](#updates)). Test builds work without it but leave the update packages out.
- macOS: Xcode Command Line Tools.
- Windows from a Mac: `brew install nsis llvm lld`, then `cargo install --locked cargo-xwin`. The build script finds Homebrew's llvm and lld itself. cargo-xwin downloads the MSVC CRT and Windows SDK, which means accepting Microsoft's license.
- Linux from a Mac: Docker. The first build runs under x86_64 emulation and is slow; later builds are cached.

---

## The `bun desktop` menu

```bash
bun desktop
```

An interactive menu for everything below: develop, make a test build, build a release's installers (choose the platforms), refresh the manifest, publish to GitHub, open the release folder and check which platforms this Mac can build. Builds show each platform's progress live; the full output goes to `apps/desktop/release/logs/`. After a build it can publish the installers and commit the landing page manifest.

It also works without the menu: `bun desktop dev`, `bun desktop build`, `bun desktop release [--yes]`, `bun desktop publish` and `bun desktop check`.

---

## Development

```bash
bun desktop:dev
```

Starts the Next.js dev server on port 29018 (not 3000, so it can run next to `bun dev`) and opens it in a desktop window. Changes hot-reload as in the browser. No sidecar is involved, so the desktop lock is off.

To test the real packaged app quickly (unoptimized, `.app`/binary only):

```bash
cd apps/desktop
bun scripts/build.ts --debug
```

---

## Building installers

```bash
bun desktop:build                                       # this machine
bun desktop:build --target x86_64-apple-darwin          # Intel Mac (from Apple Silicon)
bun desktop:build --target x86_64-pc-windows-msvc       # Windows NSIS installer, via cargo-xwin
bun desktop:build --target x86_64-unknown-linux-gnu     # .deb, via Docker
bun desktop:build --skip-server                         # reuse the last server build
```

Installers end up in `apps/desktop/src-tauri/target/<triple>/release/bundle/`, or `target-linux/release/bundle/` for Linux.

The desktop app has the same version as the web app and the Docker image. release-please bumps it in `apps/desktop/package.json` along with the root `package.json` (`extra-files` in `release-please-config.json`), and `tauri.conf.json` reads it from there. The build scripts never change it.

---

## Releasing

The desktop app is released together with the web app and the Docker image, under the same version. Merging release-please's release PR creates the GitHub release `v<version>` and publishes the Docker image. The desktop installers are then built on your Mac and attached to that same release, and the landing page links to them there.

1. **Merge** release-please's release PR, then update your checkout: `git checkout main && git pull`. The installers are built from your working tree, so it should be the release's commit. If something else was merged since, `git checkout v<version>`. The `bun desktop` menu warns when you're not on it.
2. **Build** with `bun desktop:release` (or **Release** in the `bun desktop` menu). This builds all four targets into `apps/desktop/release/<version>/`, which git ignores:
   - `Compooss-<version>-macos-arm64.dmg`
   - `Compooss-<version>-macos-x64.dmg`
   - `Compooss-<version>-windows-x64-setup.exe`
   - `Compooss-<version>-linux-amd64.deb`
   - `SHA256SUMS.txt`
   - the update packages: `Compooss-<version>-macos-arm64.app.tar.gz` and `Compooss-<version>-macos-x64.app.tar.gz`, plus a `.sig` signature next to each update package (on Windows and Linux, the installer is the update package)
   - `latest.json`, which installed apps read to find the update

   It also writes `apps/docs/src/lib/constants/desktop-release.json`: the version, the release tag and each installer's file name and size.
3. **Publish** with `bun desktop publish` (or **Publish** in the menu). This needs the [GitHub CLI](https://cli.github.com), logged in with `gh auth login`. It uploads the installers, update packages and `SHA256SUMS.txt` to the release `v<version>`, then `latest.json` last, and adds a "Desktop app" section with download instructions to its notes, below release-please's changelog. Publishing again replaces the files and that section, for example after rebuilding one platform. Installed apps start offering the update as soon as `latest.json` is up.
4. **Commit** `desktop-release.json` and get it into `main` like any other change.
5. **Deploy** the docs site. Its download buttons, sizes and version label come from `desktop-release.json`, and its links from `DESKTOP_RELEASES_URL` in `apps/docs/src/lib/constants/landing.constants.tsx`.

Older releases keep their installers, so old download links keep working. 1.20.1 was released before the versions were shared, so its installers are on the release `desktop-v1.20.1`.

Options for `bun desktop:release`:

- `--targets aarch64-apple-darwin,x86_64-apple-darwin` builds a subset, for example to redo one platform after a failed build. A platform missing from the folder shows "Coming soon" on the landing page.
- `--manifest-only` builds nothing. It rewrites `SHA256SUMS.txt`, `latest.json` and `desktop-release.json` from what's in `release/<version>/`, for example after you add an installer built on another machine. Name it like the others, and copy its `.sig` too, or apps on that platform won't be offered the update.
- `--publish` builds nothing. It uploads `release/<version>/` to GitHub, which is what `bun desktop publish` runs.

Builds are **not signed** yet:
- macOS builds are ad-hoc signed. Users allow the app once under System Settings → Privacy & Security → Open Anyway.
- On Windows, SmartScreen shows More info → Run anyway.

To sign and notarize later, set `bundle.macOS.signingIdentity` to a Developer ID, set `hardenedRuntime: true` (`Entitlements.plist` already grants V8 its JIT), and provide `APPLE_ID` / `APPLE_PASSWORD` / `APPLE_TEAM_ID` when building.

---

## Updates

The desktop app updates itself from GitHub Releases.

**What users see**

- About five seconds after launch, and every six hours while it stays open, the app checks for a newer version. If there is one, a notification at the top right says "Compooss 1.25.0 is available", with **What's new** (the GitHub release), **Later** and **Update**.
- **Update** downloads the update and shows its progress (a bar, MB downloaded and %), then installs it and restarts the app. Saved connections are kept.
  - macOS replaces the app in place and restarts.
  - Windows runs the installer with only a progress window, which starts the app again when it's done.
  - Linux installs the new `.deb` after asking for the user's password, then restarts.
- **Later** hides it. Automatic checks don't offer that version again until the next launch, but a manual check does.
- If the download or install fails, the notification shows the error with **Try again**.
- **Check for Updates…** checks right away and says when the app is up to date: **Compooss → Check for Updates…** in the macOS menu bar, or **Check for updates** in the command palette (⌘K / Ctrl+K) on every platform.
- `bun desktop:dev` only checks when asked and can't install updates.

**How it works**

```
page (update-notification.component.tsx, mounted in Providers)
  → checkForUpdate() / installUpdate() in lib/platform/platform.ts
  → check_for_update / install_update  (src-tauri/src/updater.rs, tauri-plugin-updater)
  → https://github.com/abdullahmia/compooss/releases/latest/download/latest.json
```

- `latest.json` lists the version and, per platform, the update package's URL and signature. `release.ts` writes it and `bun desktop publish` uploads it last, so apps never see an update whose files aren't there yet. Until a release's desktop files are published, its GitHub release has no `latest.json`, and apps report that they're up to date.
- Only the page's own origin can call the two commands, through the same capability as `save_file` (`main.rs`). The page never gets the updater plugin's own JavaScript API.
- `install_update` streams progress to the page through a Tauri channel, then installs and calls `request_restart()`, which stops the server first like a normal quit. On Windows, the plugin runs the installer and exits; `updater.rs` stops the server before that. After a restart, the new server waits up to five seconds for port 29017 to free up (`desktop-entry.cjs`).

**Signing**

Every update package is signed, and the app only installs packages signed with the key whose public key is `plugins.updater.pubkey` in `tauri.conf.json`. `requireSignedVersion` also makes it check that the signature was made for the version `latest.json` announces, so an old package can't be passed off as a new one.

- The private key lives at `~/.tauri/compooss.key`, outside the repo. `TAURI_SIGNING_PRIVATE_KEY` (the key or a path to it) takes precedence. If the key has a password, set `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.
- **Back it up**, for example in a password manager. Without it, no installed app can be updated again; users would have to download a new version by hand.
- To create a new one (only before the first release with updates, or when you accept that users reinstall): `cd apps/desktop && bun run tauri signer generate -w ~/.tauri/compooss.key`, then put the contents of `compooss.key.pub` in `plugins.updater.pubkey`.
- `build.ts` passes the key to the Tauri CLI, also inside the Linux container. Release builds fail without it, and `release.ts` checks that every signature matches the public key in `tauri.conf.json`. `bun desktop check` shows whether the key is there.

---

## Troubleshooting

- **"Port 29017 is already in use"**: another program, or a stuck old server, holds the port. On macOS/Linux, `lsof -i :29017` finds it.
- **The app shows "Open Compooss from the desktop app."**: the page was opened without the launch token, for example in a regular browser. That's the desktop lock working as intended.
- **Blank window on Linux with Nvidia + Wayland**: start it with `WEBKIT_DISABLE_DMABUF_RENDERER=1`.
- **"No update signing key" when building a release**: put the key at `~/.tauri/compooss.key`, or set `TAURI_SIGNING_PRIVATE_KEY` to the key or its path. See [Updates](#updates).
- **"…wasn't signed with the key whose public key is in tauri.conf.json"**: the build used a different key than the one installed apps trust. Use the original key; never just replace the public key, since apps already installed would reject every later update.
- **"Couldn't update" on macOS**: the app has to be in a folder the user can write to, such as `/Applications`, and not run from the mounted `.dmg`.
