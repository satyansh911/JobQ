#!/usr/bin/env bash
#
# EC2 bootstrap for JobQ. Paste into the instance's "User data" field at launch,
# or run it over SSH on a fresh Amazon Linux 2023 box.
#
# It installs Docker, clones the repo and prepares the directory. It does NOT
# start the stack: the services need their .env files, which are deliberately
# not in git. Copy those up afterwards (see deploy/README.md), then run
# `docker compose up -d --build`.

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/satyansh911/JobQ.git}"
APP_DIR="${APP_DIR:-/opt/jobq}"
APP_USER="${APP_USER:-ec2-user}"

echo "==> Installing Docker"
dnf update -y
dnf install -y docker git
systemctl enable --now docker

# Lets the login user run docker without sudo. Takes effect on next login.
usermod -aG docker "$APP_USER"

echo "==> Installing the compose plugin"
COMPOSE_VERSION="v2.39.1"
PLUGIN_DIR="/usr/libexec/docker/cli-plugins"
mkdir -p "$PLUGIN_DIR"
curl -fsSL \
  "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-$(uname -m)" \
  -o "$PLUGIN_DIR/docker-compose"
chmod +x "$PLUGIN_DIR/docker-compose"

echo "==> Cloning $REPO_URL into $APP_DIR"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull --ff-only
else
  git clone "$REPO_URL" "$APP_DIR"
fi
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# PUBLIC_HOST must be what a browser types, because it is compiled into the
# frontend bundle. Default to this instance's public IPv4 via IMDSv2.
echo "==> Detecting public address"
TOKEN=$(curl -fsSL -X PUT "http://169.254.169.254/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 300" || true)
PUBLIC_IP=$(curl -fsSL -H "X-aws-ec2-metadata-token: $TOKEN" \
  "http://169.254.169.254/latest/meta-data/public-ipv4" || echo "")

if [ -n "$PUBLIC_IP" ]; then
  echo "PUBLIC_HOST=http://${PUBLIC_IP}" > "$APP_DIR/.env"
  chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
  echo "    PUBLIC_HOST=http://${PUBLIC_IP}"
else
  cp "$APP_DIR/.env.docker.example" "$APP_DIR/.env"
  echo "    Could not detect a public IP — edit $APP_DIR/.env by hand."
fi

cat <<EOF

==> Bootstrap complete.

Still to do, because secrets are not in git:

  1. Copy the six env files up from your machine:

       cd <local repo>
       for s in auth utils user job payment; do
         scp services/\$s/.env ec2-user@${PUBLIC_IP:-<ip>}:${APP_DIR}/services/\$s/.env
       done

  2. Start it:

       ssh ec2-user@${PUBLIC_IP:-<ip>}
       cd ${APP_DIR}
       docker compose up -d --build

  3. Open http://${PUBLIC_IP:-<ip>}:3000

Security group must allow inbound 3000, 5001-5004 and 5050 from your IP,
plus 22 for SSH. Note that a bare IP over plain HTTP is fine for a demo but
sends credentials in the clear — put it behind a proxy with TLS before
sharing it widely.
EOF
