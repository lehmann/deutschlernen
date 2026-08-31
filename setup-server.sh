#!/usr/bin/env bash
# setup-server.sh — Deutschlernen server setup for Ubuntu
# Usage: sudo bash setup-server.sh
set -euo pipefail

# ─── Constants ────────────────────────────────────────────────────────────────
APP_NAME="deutschlernen"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="${APP_DIR}/data"
ENV_FILE="${APP_DIR}/.env"
SERVICE_FILE="/etc/systemd/system/${APP_NAME}.service"
NODE_REQUIRED=20

# ─── Colors ───────────────────────────────────────────────────────────────────
C_GREEN='\033[0;32m'
C_YELLOW='\033[1;33m'
C_RED='\033[0;31m'
C_CYAN='\033[0;36m'
C_BOLD='\033[1m'
C_RESET='\033[0m'

info()    { echo -e "${C_GREEN}[✓]${C_RESET} $*"; }
warn()    { echo -e "${C_YELLOW}[!]${C_RESET} $*"; }
error()   { echo -e "${C_RED}[✗]${C_RESET} $*" >&2; exit 1; }
section() { echo -e "\n${C_CYAN}${C_BOLD}━━━  $*  ━━━${C_RESET}"; }

ask() { read -rp "$(echo -e "  ${C_YELLOW}?${C_RESET} $1")" "$2"; }

# ─── Pre-flight ───────────────────────────────────────────────────────────────

check_root() {
  if [[ $EUID -ne 0 ]]; then
    # BASH_SOURCE[0] is the script file path even when piped/sourced; $0 can be "bash"
    local script="${BASH_SOURCE[0]:-setup-server.sh}"
    error "Run with sudo:  sudo bash ${script}"
  fi
}

detect_app_user() {
  # The non-root user who invoked sudo
  APP_USER="${SUDO_USER:-}"
  if [[ -z "$APP_USER" ]]; then
    error "Could not detect the invoking user. Run the script as a regular user with sudo:\n  sudo bash ${BASH_SOURCE[0]:-setup-server.sh}"
  fi
  [[ "$APP_USER" != "root" ]] || error "Do not run from the root account. Use a regular user with sudo."
  APP_HOME=$(eval echo "~${APP_USER}")
  info "App will run as: ${APP_USER} (home: ${APP_HOME})"
}

check_ubuntu() {
  grep -qi ubuntu /etc/os-release 2>/dev/null \
    || warn "This script targets Ubuntu; other distros may need adjustments."
}

# Run a command as APP_USER (not root)
run_as_user() { sudo -u "$APP_USER" -- "$@"; }

# ─── Node.js ──────────────────────────────────────────────────────────────────

install_node() {
  section "Node.js"

  if command -v node &>/dev/null; then
    local ver
    ver=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
    if [[ "$ver" -ge "$NODE_REQUIRED" ]]; then
      info "Node.js $(node --version) already installed — OK"
      return
    fi
    warn "Node.js $(node --version) is below required v${NODE_REQUIRED}. Upgrading..."
  else
    warn "Node.js not found. Installing Node.js ${NODE_REQUIRED} LTS..."
  fi

  apt-get update -qq
  apt-get install -y ca-certificates curl gnupg > /dev/null
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_REQUIRED}.x" | bash - > /dev/null
  apt-get install -y nodejs > /dev/null
  info "Node.js $(node --version) installed"
}

# ─── npm install ─────────────────────────────────────────────────────────────

install_deps() {
  section "npm install"
  run_as_user bash -c "cd '${APP_DIR}' && npm install 2>&1 | tail -4"
  info "Dependencies installed"
}

# ─── .env / VAPID keys ───────────────────────────────────────────────────────

setup_env() {
  section "Environment (.env)"

  if [[ -f "$ENV_FILE" ]]; then
    info ".env already exists — skipping key generation"
    return
  fi

  warn ".env not found — generating VAPID keys..."

  # Generate keys using the project script (requires web-push, installed above)
  local vapid_out
  vapid_out=$(run_as_user node "${APP_DIR}/scripts/generate-vapid.js" 2>/dev/null) \
    || error "Failed to generate VAPID keys. Check that 'npm install' completed successfully."

  local pub priv
  pub=$(echo "$vapid_out"  | grep VAPID_PUBLIC_KEY  | cut -d= -f2-)
  priv=$(echo "$vapid_out" | grep VAPID_PRIVATE_KEY | cut -d= -f2-)
  [[ -n "$pub" && -n "$priv" ]] || error "VAPID key generation produced empty output."

  local subj port
  ask "VAPID contact email [mailto:admin@example.com]: " subj
  subj="${subj:-mailto:admin@example.com}"
  ask "Server port [3000]: " port
  port="${port:-3000}"

  run_as_user tee "$ENV_FILE" > /dev/null <<EOF
VAPID_PUBLIC_KEY=${pub}
VAPID_PRIVATE_KEY=${priv}
VAPID_SUBJECT=${subj}
PORT=${port}
NODE_ENV=production
EOF

  chmod 600 "$ENV_FILE"
  chown "${APP_USER}:${APP_USER}" "$ENV_FILE"
  info ".env created with generated VAPID keys"
}

# ─── Build frontend ───────────────────────────────────────────────────────────

build_frontend() {
  section "Frontend build"
  mkdir -p "$DATA_DIR"
  chown "${APP_USER}:${APP_USER}" "$DATA_DIR"
  run_as_user bash -c "cd '${APP_DIR}' && npm run build 2>&1 | tail -6"
  info "Frontend built → dist/"
}

# ─── systemd service ──────────────────────────────────────────────────────────

create_service() {
  section "systemd service"

  local node_bin
  node_bin=$(which node)

  cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=Deutschlernen — German flashcard app
Documentation=file://${APP_DIR}/README.md
After=network.target
StartLimitIntervalSec=60
StartLimitBurst=5

[Service]
Type=simple
User=${APP_USER}
Group=${APP_USER}
WorkingDirectory=${APP_DIR}
ExecStart=${node_bin} server/index.js
Restart=on-failure
RestartSec=5

# Environment
Environment=HOME=${APP_HOME}
Environment=NODE_ENV=production

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${APP_NAME}

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=${DATA_DIR}

[Install]
WantedBy=multi-user.target
EOF

  systemctl daemon-reload
  systemctl enable "${APP_NAME}"
  systemctl restart "${APP_NAME}"

  sleep 2

  if systemctl is-active --quiet "${APP_NAME}"; then
    info "Service ${APP_NAME}.service is running and enabled on boot"
  else
    warn "Service may have failed. Check: journalctl -u ${APP_NAME} -n 50"
  fi
}

# ─── Firewall ────────────────────────────────────────────────────────────────

setup_firewall() {
  section "Firewall (ufw)"

  if ! command -v ufw &>/dev/null; then
    warn "ufw not found — skipping firewall setup"
    return
  fi

  local port
  port=$(grep '^PORT=' "$ENV_FILE" | cut -d= -f2-)
  port="${port:-3000}"

  # Allow SSH so we don't lock ourselves out
  ufw allow OpenSSH > /dev/null 2>&1 || true
  # Allow the Express app port
  ufw allow "${port}/tcp" > /dev/null 2>&1 || true
  # Enable non-interactively (only if not already active)
  if ! ufw status | grep -q "Status: active"; then
    ufw --force enable > /dev/null
  fi
  info "Firewall active: SSH + port ${port} allowed"
}

# ─── Deploy helper script ─────────────────────────────────────────────────────

create_deploy_script() {
  local deploy="${APP_DIR}/deploy.sh"
  cat > "$deploy" <<'EOF'
#!/usr/bin/env bash
# deploy.sh — pull latest code and restart the service
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
echo "→ Pulling latest code..."
git pull
echo "→ Installing dependencies..."
npm install
echo "→ Building frontend..."
npm run build
echo "→ Restarting service..."
sudo systemctl restart deutschlernen
echo "✓ Deploy complete"
sudo systemctl status deutschlernen --no-pager -l
EOF
  chmod +x "$deploy"
  chown "${APP_USER}:${APP_USER}" "$deploy"
  info "deploy.sh created — run it to redeploy after a git pull"
}

# ─── Summary ─────────────────────────────────────────────────────────────────

print_summary() {
  local port
  port=$(grep '^PORT=' "$ENV_FILE" | cut -d= -f2-)
  port="${port:-3000}"

  echo
  echo -e "${C_CYAN}${C_BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}"
  echo -e "${C_GREEN}${C_BOLD}  Setup complete! Viel Erfolg! 🇩🇪${C_RESET}"
  echo -e "${C_CYAN}${C_BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C_RESET}"
  echo
  echo -e "  ${C_BOLD}Service commands:${C_RESET}"
  echo "    systemctl status  ${APP_NAME}    # current status"
  echo "    systemctl restart ${APP_NAME}    # restart"
  echo "    journalctl -u ${APP_NAME} -f     # follow logs"
  echo
  echo -e "  ${C_BOLD}App URL:${C_RESET}  http://localhost:${port}"
  echo
  echo -e "  ${C_BOLD}To redeploy:${C_RESET}"
  echo "    bash ${APP_DIR}/deploy.sh"
  echo
  echo -e "  ${C_BOLD}Database:${C_RESET}  ${DATA_DIR}/app.db"
  echo -e "  ${C_BOLD}Logs:${C_RESET}     journalctl -u ${APP_NAME}"
  echo
}

# ─── Main ────────────────────────────────────────────────────────────────────

main() {
  echo -e "${C_CYAN}${C_BOLD}"
  echo "  ╔══════════════════════════════════════════╗"
  echo "  ║   Deutschlernen — Server Setup           ║"
  echo "  ╚══════════════════════════════════════════╝"
  echo -e "${C_RESET}"

  check_root
  check_ubuntu
  detect_app_user

  install_node
  install_deps
  setup_env
  build_frontend
  create_service
  setup_firewall
  create_deploy_script
  print_summary
}

main "$@"
