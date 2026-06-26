---
name: vps-deploy
description: "Deploy Digital Marketing tool lên VPS: Docker, Nginx, SSL, PostgreSQL. Trigger khi: deploy lên VPS, setup production server, cấu hình nginx, enable SSL, migrate từ local lên server, update production."
---

# VPS Deploy Skill

Skill cho `devops-agent` deploy hệ thống lên VPS production.

## Yêu cầu VPS

- Ubuntu 22.04 LTS
- Tối thiểu: 2 vCPU, 2GB RAM, 20GB SSD
- Mở port: 22 (SSH), 80 (HTTP), 443 (HTTPS)

## Cấu trúc Docker

### docker-compose.yml (Local Development)
```yaml
version: '3.8'
services:
  backend:
    build:
      context: .
      dockerfile: docker/Dockerfile.backend
    ports: ["8000:8000"]
    volumes:
      - ./backend:/app
      - sqlite_data:/data
    environment:
      - DATABASE_URL=sqlite:////data/dm.db
      - SECRET_KEY=${SECRET_KEY}
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: docker/Dockerfile.frontend
    ports: ["3000:80"]
    depends_on: [backend]
    restart: unless-stopped

volumes:
  sqlite_data:
```

### docker-compose.prod.yml (VPS)
```yaml
version: '3.8'
services:
  backend:
    image: dm-backend:latest
    expose: ["8000"]
    environment:
      - DATABASE_URL=postgresql://dm_user:${DB_PASSWORD}@db:5432/dm_prod
      - SECRET_KEY=${SECRET_KEY}
    depends_on: [db]

  frontend:
    image: dm-frontend:latest
    expose: ["80"]

  db:
    image: postgres:15-alpine
    volumes: [postgres_data:/var/lib/postgresql/data]
    environment:
      - POSTGRES_DB=dm_prod
      - POSTGRES_USER=dm_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}

  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf
      - certbot_certs:/etc/letsencrypt
    depends_on: [backend, frontend]

volumes:
  postgres_data:
  certbot_certs:
```

## Deploy Script (scripts/deploy.sh)

```bash
#!/bin/bash
set -e

VPS_HOST=${1:-"your-vps-ip"}
VPS_USER=${2:-"ubuntu"}

echo "Building images..."
docker build -t dm-backend:latest -f docker/Dockerfile.backend .
docker build -t dm-frontend:latest -f docker/Dockerfile.frontend .

echo "Saving images..."
docker save dm-backend:latest | gzip > /tmp/dm-backend.tar.gz
docker save dm-frontend:latest | gzip > /tmp/dm-frontend.tar.gz

echo "Copying to VPS..."
scp /tmp/dm-*.tar.gz $VPS_USER@$VPS_HOST:/tmp/
scp docker-compose.prod.yml $VPS_USER@$VPS_HOST:~/dm/
scp docker/nginx/ $VPS_USER@$VPS_HOST:~/dm/docker/nginx/ -r

echo "Deploying on VPS..."
ssh $VPS_USER@$VPS_HOST '
  cd ~/dm
  docker load < /tmp/dm-backend.tar.gz
  docker load < /tmp/dm-frontend.tar.gz
  docker-compose -f docker-compose.prod.yml up -d
  echo "Deploy complete!"
'
```

## SSL Setup (trên VPS)

```bash
# Cài certbot
apt install certbot python3-certbot-nginx -y

# Lấy cert (thay your-domain.com)
certbot --nginx -d your-domain.com

# Auto-renew
crontab -e
# Thêm: 0 0 * * * certbot renew --quiet
```

## Checklist Deploy

- [ ] .env.production đã điền đủ (SECRET_KEY, DB_PASSWORD, platform credentials)
- [ ] Port 80/443 đã mở trên VPS firewall
- [ ] Domain đã trỏ về IP VPS
- [ ] Chạy `docker-compose -f docker-compose.prod.yml up -d`
- [ ] Test: `curl https://your-domain.com/api/health`
- [ ] Setup SSL cert
- [ ] Test đăng nhập web dashboard
