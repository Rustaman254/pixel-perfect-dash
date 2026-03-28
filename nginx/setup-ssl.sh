#!/bin/bash
# SSL Setup Script for Sokostack Ecosystem
# Run this ONCE on your server to set up Let's Encrypt SSL certificates
# Usage: sudo bash setup-ssl.sh

set -e

DOMAIN="sokostack.xyz"
EMAIL="admin@sokostack.xyz"  # Change to your email
WEBROOT="/var/www/certbot"

echo "============================================"
echo " Sokostack SSL Setup (Let's Encrypt)"
echo "============================================"

# 1. Install Certbot if not present
if ! command -v certbot &> /dev/null; then
    echo "[1/6] Installing Certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
else
    echo "[1/6] Certbot already installed"
fi

# 2. Create webroot directory
echo "[2/6] Creating webroot directory..."
mkdir -p "$WEBROOT/.well-known/acme-challenge"

# 3. Ensure Nginx config directory exists
echo "[3/6] Setting up Nginx configuration..."
mkdir -p /etc/nginx/sites-enabled

# Copy our config if not already in place
if [ ! -f /etc/nginx/sites-enabled/ecosystem.conf ]; then
    cp "$(dirname "$0")/ecosystem.conf" /etc/nginx/sites-enabled/ecosystem.conf
    echo "  Copied ecosystem.conf to sites-enabled"
fi

# 4. Test and reload Nginx
echo "[4/6] Testing Nginx configuration..."
nginx -t

echo "  Reloading Nginx..."
systemctl reload nginx

# 5. Obtain SSL certificate
echo "[5/6] Obtaining SSL certificate for *.${DOMAIN}..."
certbot certonly \
    --nginx \
    -d "${DOMAIN}" \
    -d "*.${DOMAIN}" \
    --email "${EMAIL}" \
    --agree-tos \
    --no-eff-email \
    --non-interactive \
    || echo "Certificate may already exist, continuing..."

# 6. Set up auto-renewal cron
echo "[6/6] Setting up auto-renewal..."
CRON_CMD="0 3 * * * certbot renew --quiet --deploy-hook 'systemctl reload nginx'"
(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_CMD") | crontab -

echo ""
echo "============================================"
echo " SSL Setup Complete!"
echo "============================================"
echo ""
echo "Certificates are stored in:"
echo "  /etc/letsencrypt/live/${DOMAIN}/"
echo ""
echo "Auto-renewal cron job installed (runs daily at 3 AM)"
echo ""
echo "Next steps:"
echo "  1. Verify Nginx config: nginx -t"
echo "  2. Reload Nginx: systemctl reload nginx"
echo "  3. Test HTTPS: curl -I https://ripplify.${DOMAIN}"
echo ""
