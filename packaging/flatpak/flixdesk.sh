#!/bin/bash
export TMPDIR="${XDG_RUNTIME_DIR}/app/${FLATPAK_ID:-io.github.Pak_Man926.FlixDesk}"
mkdir -p "${TMPDIR}"

# Check for Wayland
FLAGS=""
if [ "${XDG_SESSION_TYPE}" = "wayland" ]; then
    FLAGS="--ozone-platform-hint=auto --enable-features=WaylandWindowDecorations"
fi

# Execute Electron application
exec zypak-wrapper /app/lib/flixdesk/electron /app/lib/flixdesk/dist/main/index.js $FLAGS "$@"
