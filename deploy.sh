#!/bin/bash
# Deployment script for SafarWorld AI Lawyer
# Run this on your VPS to deploy the latest changes

set -e

echo "🚀 SafarWorld Deployment"
echo "========================"

# 1. Pull latest changes
echo "📥 Pulling latest code..."
git pull

# 2. Check for .env
if [ ! -f .env ]; then
    echo "❌ Error: .env file missing!"
    echo "Please create .env with your secrets."
    exit 1
fi

# 3. Create directories
mkdir -p certbot/conf certbot/www nginx/ssl
mkdir -p data/chroma_db codes contracts

# 4. Rebuild and restart containers
echo "🔄 Rebuilding and restarting containers..."
docker compose down
docker compose up -d --build

# 5. Check status
echo "⏳ Waiting for services..."
sleep 5
docker compose ps

echo ""
echo "✅ Deployment complete!"
echo "Global sites:"
echo "  - https://safarworld.store"
echo "  - https://api.safarworld.store"
echo ""
