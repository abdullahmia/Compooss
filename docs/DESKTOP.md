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
- **Offline.** Monaco and the fonts are served by the app itself, not a CDN, so everything works without internet access.

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
│   ├── shared.ts             # Node version, target triples, paths
│   ├── prepare-sidecar.ts    # builds .dist/server and downloads Node for a target
│   ├── build.ts              # builds installers for one target
│   └── release.ts            # bumps the version and builds every target into release/<version>/
├── docker/linux-builder.Dockerfile
└── src-tauri/
    ├── tauri.conf.json         # base config (enough for `tauri dev`)
    ├── tauri.bundle.conf.json  # merged for builds: sidecar binary + server resources
    ├── Entitlements.plist      # V8 JIT entitlements (for future notarization)
    ├── windows/hooks.nsh       # stops the server before installing over it
    └── src/
        ├── main.rs             # window, navigation guard, IPC capability
        ├── sidecar.rs          # starts and stops the server
        ├── commands.rs         # save_file
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
- macOS: Xcode Command Line Tools.
- Windows from a Mac: `brew install nsis llvm lld`, then `cargo install --locked cargo-xwin`. The build script finds Homebrew's llvm and lld itself. cargo-xwin downloads the MSVC CRT and Windows SDK, which means accepting Microsoft's license.
- Linux from a Mac: Docker. The first build runs under x86_64 emulation and is slow; later builds are cached.

---

## The `bun desktop` menu

```bash
bun desktop
```

An interactive menu for everything below: develop, make a test build, release a new version (choose patch/minor/major and the platforms), rebuild platforms, refresh the manifest, open the release folder and check which platforms this Mac can build. Releases show each platform's progress live; the full output goes to `apps/desktop/release/logs/`. After a release it can open the folder for uploading to R2 and commit the new version files.

It also works without the menu: `bun desktop dev`, `bun desktop build`, `bun desktop release [--minor | --major | --no-bump] [--yes]` and `bun desktop check`.

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

The desktop app has its own version, in `apps/desktop/package.json`. `tauri.conf.json` reads it from there, and `bun desktop:release` bumps it. It's separate from the Docker/web version, which release-please manages in the root `package.json`. `desktop:build` never changes the version.

---

## Releasing

Installers are built on your machine and uploaded by hand to a Cloudflare R2 bucket. The landing page links to them there.

```bash
bun desktop:release            # 1.20.0 → 1.20.1, then builds every platform
```

This bumps the version in `apps/desktop/package.json` and builds all four targets into `apps/desktop/release/<version>/`, which git ignores. The folder contains:

- `Compooss-<version>-macos-arm64.dmg`
- `Compooss-<version>-macos-x64.dmg`
- `Compooss-<version>-windows-x64-setup.exe`
- `Compooss-<version>-linux-amd64.deb`
- `SHA256SUMS.txt`

The script also writes `apps/docs/src/lib/constants/desktop-release.json`: the version and each installer's file name and size. Then:

1. **Upload** the `<version>` folder to the root of the R2 bucket, so each file is at `<R2 URL>/<version>/<file>`. Keep older version folders if you want old links to keep working.
2. **Commit** `apps/desktop/package.json` and `desktop-release.json`.
3. **Deploy** the docs site. Its download buttons, sizes and version label come from `desktop-release.json`, and its links from `DESKTOP_DOWNLOADS_BASE_URL` (the bucket's public URL) in `apps/docs/src/lib/constants/landing.constants.tsx`.

Options:

- `--minor` / `--major` bump that part instead of the patch number.
- `--no-bump` rebuilds the current version, for example after a failed build.
- `--targets aarch64-apple-darwin,x86_64-apple-darwin` builds a subset. Use it with `--no-bump` to redo one platform. A platform missing from the folder shows "Coming soon" on the landing page.
- `--manifest-only` builds nothing. It rewrites `SHA256SUMS.txt` and `desktop-release.json` from what's in `release/<version>/`, for example after you add an installer built on another machine. Name it like the others.

Builds are **not signed** yet:
- macOS builds are ad-hoc signed. Users allow the app once under System Settings → Privacy & Security → Open Anyway.
- On Windows, SmartScreen shows More info → Run anyway.

To sign and notarize later, set `bundle.macOS.signingIdentity` to a Developer ID, set `hardenedRuntime: true` (`Entitlements.plist` already grants V8 its JIT), and provide `APPLE_ID` / `APPLE_PASSWORD` / `APPLE_TEAM_ID` when building.

---

## Troubleshooting

- **"Port 29017 is already in use"**: another program, or a stuck old server, holds the port. On macOS/Linux, `lsof -i :29017` finds it.
- **The app shows "Open Compooss from the desktop app."**: the page was opened without the launch token, for example in a regular browser. That's the desktop lock working as intended.
- **Blank window on Linux with Nvidia + Wayland**: start it with `WEBKIT_DISABLE_DMABUF_RENDERER=1`.
