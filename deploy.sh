#!/bin/bash
# Deployment script for OpusLawyer on Hostinger VPS

set -e

echo "🚀 OpusLawyer Deployment Script"
echo "================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env from .env.production.example"
    exit 1
fi

# Create certbot directories
echo "📁 Creating SSL directories..."
mkdir -p certbot/conf certbot/www

# Build and start containers
echo "🐳 Building and starting Docker containers..."
docker compose -f docker-compose.prod.yml up -d --build

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo "📊 Service Status:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Ensure DNS is pointing to this server (ai.safarworld.store -> $(curl -s ifconfig.me))"
echo "2. Test HTTP: curl -I http://ai.safarworld.store"
echo "3. Get SSL certificate: docker compose -f docker-compose.prod.yml run --rm certbot certonly --webroot -w /var/www/certbot -d ai.safarworld.store"
echo "4. Update nginx.conf to enable HTTPS, then: docker compose -f docker-compose.prod.yml restart nginx"
