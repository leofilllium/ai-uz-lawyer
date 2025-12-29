#!/bin/bash
# SSL Setup Script for AI Lawyer
# Run this on your server to initialize SSL certificates

set -e

DOMAINS="safarworld.store api.safarworld.store"
EMAIL="your-email@example.com"  # Replace with your email
STAGING=0  # Set to 1 for testing (avoids rate limits)

# Create required directories
mkdir -p certbot/conf certbot/www nginx/ssl

echo "=== Step 1: Starting services with HTTP-only config ==="
# Use the init config first (no SSL)
cp nginx/nginx.init.conf nginx/nginx.conf.bak
cp nginx/nginx.init.conf nginx/nginx.conf

# Start containers
docker compose up -d db backend frontend nginx

echo "=== Step 2: Waiting for services to be ready ==="
sleep 10

echo "=== Step 3: Obtaining SSL certificates ==="
for domain in $DOMAINS; do
    echo "Getting certificate for: $domain"
    
    staging_arg=""
    if [ $STAGING -eq 1 ]; then
        staging_arg="--staging"
    fi
    
    docker compose run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        $staging_arg \
        -d $domain
done

echo "=== Step 4: Switching to full SSL config ==="
# Restore the full SSL nginx config
cp nginx/nginx.conf.bak nginx/nginx.conf.init
cat > nginx/nginx.conf << 'NGINX_CONF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent"';
    access_log /var/log/nginx/access.log main;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:80;
    }

    # HTTP - redirect to HTTPS
    server {
        listen 80;
        server_name safarworld.store api.safarworld.store;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS - API Backend
    server {
        listen 443 ssl http2;
        server_name api.safarworld.store;

        ssl_certificate /etc/letsencrypt/live/api.safarworld.store/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/api.safarworld.store/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;

        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;

        location / {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_read_timeout 120s;
        }
    }

    # HTTPS - Frontend
    server {
        listen 443 ssl http2;
        server_name safarworld.store;

        ssl_certificate /etc/letsencrypt/live/safarworld.store/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/safarworld.store/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;

        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;

        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api/ {
            rewrite ^/api(/.*)$ $1 break;
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_read_timeout 120s;
        }
    }
}
NGINX_CONF

echo "=== Step 5: Reloading nginx with SSL ==="
docker compose exec nginx nginx -s reload

echo ""
echo "=== SSL Setup Complete! ==="
echo "Your sites are now available at:"
echo "  - https://safarworld.store (frontend)"
echo "  - https://api.safarworld.store (backend API)"
echo ""
echo "Certificates will auto-renew via certbot container."
