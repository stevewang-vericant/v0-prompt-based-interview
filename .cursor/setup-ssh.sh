#!/usr/bin/env bash
# Sets up SSH access for Cursor Cloud Agents to the Linode deployment servers.
#
# The SSH private keys are provided as base64-encoded Runtime Secrets in the
# Cursor Cloud Agents dashboard (env vars). This script decodes them into
# ~/.ssh at agent start and registers the host aliases used in the deploy docs
# (guided-staging / guided-prod). It is a no-op for any key that isn't set, so
# it is safe to run even when only some secrets are configured.
#
# Required secret (staging): STAGING_GUIDED_SSH_KEY_B64
# Optional secret (production): PROD_GUIDED_SSH_KEY_B64

set -euo pipefail

mkdir -p ~/.ssh
chmod 700 ~/.ssh
touch ~/.ssh/config
chmod 600 ~/.ssh/config

install_key() {
  # $1 = base64 private key value, $2 = key filename, $3 = host alias, $4 = host IP
  local key_b64="$1" key_file="$2" alias="$3" host_ip="$4"
  [ -z "$key_b64" ] && return 0

  echo "$key_b64" | base64 -d > "$HOME/.ssh/$key_file"
  chmod 600 "$HOME/.ssh/$key_file"

  if ! grep -q "^Host $alias\$" ~/.ssh/config 2>/dev/null; then
    cat >> ~/.ssh/config <<EOF
Host $alias
  HostName $host_ip
  User root
  IdentityFile ~/.ssh/$key_file
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new
EOF
  fi

  echo "Configured SSH host alias: $alias"
}

install_key "${STAGING_GUIDED_SSH_KEY_B64:-}" "guided_staging" "guided-staging" "139.162.49.54"
install_key "${PROD_GUIDED_SSH_KEY_B64:-}" "guided_prod" "guided-prod" "192.46.229.162"
