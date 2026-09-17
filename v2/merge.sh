#!/usr/bin/env bash
# ============================================================================
# TARGET_DESTINATION: v2/merge.sh
# PURPOSE: Bash script to automatically merge v2 files into root project
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=========================================================="
echo " Lobby AI v2 Merge Tool (Bash)"
echo " Merging files from: $SCRIPT_DIR"
echo " Into project root:  $PROJECT_ROOT"
echo "=========================================================="

MANIFEST_PATH="$SCRIPT_DIR/MANIFEST.json"
if [ ! -f "$MANIFEST_PATH" ]; then
    echo "Error: MANIFEST.json not found in $SCRIPT_DIR"
    exit 1
fi

if [ "$1" != "-y" ] && [ "$1" != "--yes" ]; then
    read -p "Proceed with copying files into the project? (y/n): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "Merge aborted by user."
        exit 0
    fi
fi

# Parse manifest using python/node or standard shell loop
node -e '
const fs = require("fs");
const path = require("path");

const scriptDir = process.argv[1];
const projectRoot = process.argv[2];
const manifest = JSON.parse(fs.readFileSync(path.join(scriptDir, "MANIFEST.json"), "utf8"));

let copied = 0;
for (const item of manifest.files) {
    const src = path.join(projectRoot, item.source);
    const dest = path.join(projectRoot, item.target);
    const destDir = path.dirname(dest);

    if (!fs.existsSync(src)) {
        console.warn(`[MISSING] ${src}`);
        continue;
    }

    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(src, dest);
    console.log(`[${item.action}] ${item.target}`);
    copied++;
}
console.log(`\nSuccessfully merged ${copied} files into project!`);
' "$SCRIPT_DIR" "$PROJECT_ROOT"

echo "=========================================================="
echo " Merge complete! Ready for build and tests."
echo "=========================================================="
