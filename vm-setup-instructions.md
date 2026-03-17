# Proxmox VM Deployment — review.dataslab.site

## Prerequisites
- Proxmox VM: Debian 12, 8GB RAM, 4 vCPU, 32GB disk
- SSH access to the VM
- Cloudflare account with `dataslab.site` configured

---

## Step 1 — Install dependencies

```bash
apt update && apt install -y git curl

# Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker $USER && newgrp docker

# cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
dpkg -i cloudflared.deb

# Step 2 — Deploy the app

git clone https://github.com/<your-repo>/ReviewProject.git
cd ReviewProject
cp .env.example .env
# Edit .env with production values (DB password, JWT secret, MeiliSearch key, etc.)
nano .env

docker compose -f docker-compose.prod.yml up -d --build
Run migrations & seed data

docker compose -f docker-compose.prod.yml exec api pnpm db:migrate:prod
docker compose -f docker-compose.prod.yml exec api pnpm db:seed
docker compose -f docker-compose.prod.yml exec api pnpm seed:launch
Step 3 — Cloudflare Tunnel

# Authenticate (opens browser link — paste in your local browser)
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create reviewbd
# ⚠️ Note the Tunnel ID shown in the output

# Create config file
mkdir -p /etc/cloudflared
cat > /etc/cloudflared/config.yml <<EOF
tunnel: <TUNNEL_ID>
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json
ingress:
  - hostname: review.dataslab.site
    service: http://localhost:3000
  - service: http_status:404
EOF

# Create DNS record (auto-adds CNAME in Cloudflare)
cloudflared tunnel route dns reviewbd review.dataslab.site

# Install & start as systemd service (auto-starts on reboot)
cloudflared service install
systemctl enable cloudflared
systemctl start cloudflared
Step 4 — Verify

# Check all containers are running
docker compose -f docker-compose.prod.yml ps

# Check tunnel is connected
systemctl status cloudflared

# Check logs
docker compose -f docker-compose.prod.yml logs -f
Then open https://review.dataslab.site — the site should load with HTTPS. ✓


