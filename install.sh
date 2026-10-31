#!/usr/bin/env bash
set -e

# Display ASCII banner
echo -e "\033[1;36m"
cat << "EOF"
  ███████╗██╗  ██╗██╗██╗     ██╗     ███████╗
  ██╔════╝██║ ██╔╝██║██║     ██║     ╚══███╔╝
  ███████╗█████╔╝ ██║██║     ██║       ███╔╝ 
  ╚════██║██╔═██╗ ██║██║     ██║      ███╔╝  
  ███████║██║  ██╗██║███████╗███████╗███████╗
  ╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚══════╝
  ⚡ SKILLZ — UNIVERSAL AGENT SKILLS & RUNTIME HARNESS ⚡
  162 Production Skills • Multi-Agent Symlinking • Zero-Drift Pipeline
EOF
echo -e "\033[0m"

# 1. Resolve Script & Repository Directory (handles local execution and remote curl pipe)
if [ -z "$BASH_SOURCE" ] || [ ! -f "$(dirname "$BASH_SOURCE")/registry.json" ]; then
  INSTALL_DIR="$HOME/.skillz"
  echo -e "\033[33m[0/4] Remote execution detected. Setting up Skillz repository in $INSTALL_DIR...\033[0m"
  if [ -d "$INSTALL_DIR/.git" ]; then
    git -C "$INSTALL_DIR" pull --ff-only || true
  elif [ -d "$INSTALL_DIR" ]; then
    echo "  -> Using existing directory: $INSTALL_DIR"
  else
    echo "  -> Cloning latest Skillz repository..."
    git clone --depth 1 https://github.com/aktonay/skillz.git "$INSTALL_DIR"
  fi
  DIR="$INSTALL_DIR"
else
  DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
fi

echo -e "\033[33m[1/4] Registering 'skills' and 'skillz' globally via npm link...\033[0m"
cd "$DIR"
npm link || true

echo -e "\033[33m[2/4] Validating skill registry...\033[0m"
node "$DIR/scripts/build-registry.js"

TARGET="${1:-all}"
EXTRA_ARGS="${@:2}"

echo -e "\033[36m[3/4] Deploying skills to agents (Target: $TARGET)...\033[0m"
if [[ " $* " =~ " --profile " ]] || [[ " $* " =~ " -p " ]]; then
  node "$DIR/bin/skills.js" install --target "$TARGET" $EXTRA_ARGS
else
  node "$DIR/bin/skills.js" install --all --target "$TARGET" $EXTRA_ARGS
fi

echo -e "\033[1;32m"
cat << "EOF"
========================================================================
   SKILLZ SETUP COMPLETED! 162 Skills Active Across All Agents
========================================================================
Quick Commands:
  skills status                     # View detected agents and linked skills
  skills update                     # Sync & update all skills to latest
  skills search "animation"         # Search skills by keyword
  skills ui                         # Launch local browser dashboard

For AI Coding Agents:
  Prompt: "Install all skills across all agents by running: skills install"
========================================================================
EOF
echo -e "\033[0m"
