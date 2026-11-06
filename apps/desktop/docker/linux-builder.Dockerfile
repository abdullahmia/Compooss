# Builds the Linux desktop bundles (.deb, AppImage) on macOS or Windows.
# Run by scripts/build.ts --target x86_64-unknown-linux-gnu, which mounts the
# desktop app (with its prepared sidecar) at /work/apps/desktop.
#
# Ubuntu 22.04 keeps the glibc requirement low enough for current distros.
FROM ubuntu:22.04

ARG TAURI_CLI_VERSION
# Only runs the Tauri CLI; the app bundles its own Node.js.
ARG NODE_VERSION=24.22.2

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    build-essential ca-certificates curl wget file pkg-config xdg-utils \
    libwebkit2gtk-4.1-dev libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev \
  && rm -rf /var/lib/apt/lists/*

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
ENV PATH=/root/.cargo/bin:$PATH

RUN curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz" \
    | tar -xz -C /usr/local --strip-components=1 \
  && npm install -g "@tauri-apps/cli@${TAURI_CLI_VERSION}"

# The AppImage tools can't mount FUSE inside a container.
ENV APPIMAGE_EXTRACT_AND_RUN=1

# Docker's x86_64 emulation on Apple Silicon won't execute AppImages until the
# AppImage magic bytes (ELF offset 8) are zeroed. Tauri does this for
# linuxdeploy but not for its AppImage plugin, so cache a patched copy where
# Tauri looks for it.
RUN mkdir -p /root/.cache/tauri \
  && curl -fsSL -o /root/.cache/tauri/linuxdeploy-plugin-appimage.AppImage \
    https://github.com/linuxdeploy/linuxdeploy-plugin-appimage/releases/download/continuous/linuxdeploy-plugin-appimage-x86_64.AppImage \
  && chmod +x /root/.cache/tauri/linuxdeploy-plugin-appimage.AppImage \
  && dd if=/dev/zero bs=1 count=3 seek=8 conv=notrunc of=/root/.cache/tauri/linuxdeploy-plugin-appimage.AppImage

WORKDIR /work/apps/desktop
