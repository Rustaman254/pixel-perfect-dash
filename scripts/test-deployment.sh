#!/bin/bash
# Sokostack Ecosystem - Deployment Test Script
# Tests all services, frontends, and SSL configuration
# Usage: bash scripts/test-deployment.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
PASS=0
FAIL=0

pass() { echo -e "${GREEN}[PASS]${NC} $1"; ((PASS++)); }
fail() { echo -e "${RED}[FAIL]${NC} $1"; ((FAIL++)); }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
info() { echo -e "  → $1"; }

echo "============================================"
echo " Sokostack Deployment Test"
echo " $(date)"
echo "============================================"
echo ""

# -----------------------------------------------------------
echo "--- 1. Backend Service Health Checks ---"
# -----------------------------------------------------------
services=("auth:3001" "ripplify:3002" "shopalize:3003" "watchtower:3004" "admin:3005")
for svc in "${services[@]}"; do
  name="${svc%%:*}"
  port="${svc##*:}"
  response=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${port}/health" 2>/dev/null || echo "000")
  if [ "$response" = "200" ]; then
    pass "${name}-service (port ${port}) is healthy"
  else
    fail "${name}-service (port ${port}) returned HTTP ${response}"
  fi
done

echo ""

# -----------------------------------------------------------
echo "--- 2. Frontend Port Checks ---"
# -----------------------------------------------------------
frontends=("ripplify:8080" "shopalize:8081" "watchtower:8082" "admin:8083")
for svc in "${frontends[@]}"; do
  name="${svc%%:*}"
  port="${svc##*:}"
  response=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${port}/" 2>/dev/null || echo "000")
  if [ "$response" = "200" ]; then
    pass "${name}-frontend (port ${port}) is serving"
  else
    fail "${name}-frontend (port ${port}) returned HTTP ${response}"
  fi
done

echo ""

# -----------------------------------------------------------
echo "--- 3. PM2 Process Status ---"
# -----------------------------------------------------------
if command -v pm2 &> /dev/null; then
  pm2_jlist=$(pm2 jlist 2>/dev/null || echo "[]")
  expected_processes=("auth-service" "ripplify-service" "shopalize-service" "watchtower-service" "admin-service" "ripplify-frontend" "admin-frontend")
  for proc in "${expected_processes[@]}"; do
    status=$(echo "$pm2_jlist" | python3 -c "import sys,json; apps=json.load(sys.stdin); match=[a for a in apps if a.get('name')=='${proc}']; print(match[0].get('pm2_env',{}).get('status','not found'))" 2>/dev/null || echo "not found")
    if [ "$status" = "online" ]; then
      pass "PM2: ${proc} is online"
    else
      fail "PM2: ${proc} status is '${status}'"
    fi
  done
else
  warn "PM2 not installed, skipping process checks"
fi

echo ""

# -----------------------------------------------------------
echo "--- 4. Nginx Configuration ---"
# -----------------------------------------------------------
if command -v nginx &> /dev/null; then
  if nginx -t 2>&1 | grep -q "successful"; then
    pass "Nginx configuration is valid"
  else
    fail "Nginx configuration test failed"
  fi

  if [ -f /etc/nginx/sites-enabled/ecosystem.conf ]; then
    pass "Nginx ecosystem.conf is enabled"
  else
    warn "Nginx ecosystem.conf not in sites-enabled"
  fi
else
  warn "Nginx not installed, skipping config checks"
fi

echo ""

# -----------------------------------------------------------
echo "--- 5. SSL Certificate Check ---"
# -----------------------------------------------------------
domains=("sokostack.xyz" "ripplify.sokostack.xyz" "admin.sokostack.xyz" "auth.sokostack.xyz" "shopalize.sokostack.xyz" "watchtower.sokostack.xyz")
for domain in "${domains[@]}"; do
  cert_info=$(echo | openssl s_client -servername "$domain" -connect "${domain}:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "")
  if [ -n "$cert_info" ]; then
    expiry=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
    pass "${domain} SSL cert valid (expires: ${expiry})"
  else
    warn "${domain} SSL cert not reachable (may need DNS setup)"
  fi
done

echo ""

# -----------------------------------------------------------
echo "--- 6. API Endpoint Tests ---"
# -----------------------------------------------------------
# Test auth service login endpoint exists
auth_resp=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://127.0.0.1:3001/api/auth/login" -H "Content-Type: application/json" -d '{}' 2>/dev/null || echo "000")
if [ "$auth_resp" = "400" ] || [ "$auth_resp" = "401" ]; then
  pass "Auth login endpoint responds (HTTP ${auth_resp} - expected)"
else
  warn "Auth login endpoint returned HTTP ${auth_resp}"
fi

# Test admin service
admin_resp=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3005/api/admin/stats" -H "Content-Type: application/json" 2>/dev/null || echo "000")
if [ "$admin_resp" = "401" ] || [ "$admin_resp" = "200" ]; then
  pass "Admin stats endpoint responds (HTTP ${admin_resp})"
else
  warn "Admin stats endpoint returned HTTP ${admin_resp}"
fi

echo ""

# -----------------------------------------------------------
echo "--- 7. File Build Checks ---"
# -----------------------------------------------------------
if [ -d "./ripplify/dist" ] && [ -f "./ripplify/dist/index.html" ]; then
  pass "Ripplify frontend is built (dist/ exists)"
else
  fail "Ripplify frontend build not found"
fi

if [ -d "./admin/dist" ] && [ -f "./admin/dist/index.html" ]; then
  pass "Admin frontend is built (dist/ exists)"
else
  fail "Admin frontend build not found"
fi

echo ""

# -----------------------------------------------------------
echo "--- 8. Environment Config ---"
# -----------------------------------------------------------
if [ -f "./.env" ]; then
  pass ".env file exists"
  if grep -q "JWT_SECRET" .env; then
    pass "JWT_SECRET is configured"
  else
    fail "JWT_SECRET not found in .env"
  fi
  if grep -q "INTERNAL_API_KEY" .env; then
    pass "INTERNAL_API_KEY is configured"
  else
    fail "INTERNAL_API_KEY not found in .env"
  fi
else
  warn ".env file not found (copy from .env.example)"
fi

echo ""

# -----------------------------------------------------------
echo "============================================"
echo -e " Results: ${GREEN}${PASS} passed${NC}, ${RED}${FAIL} failed${NC}"
echo "============================================"

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}Some checks failed. Review the output above.${NC}"
  exit 1
else
  echo -e "${GREEN}All checks passed! Deployment looks healthy.${NC}"
  exit 0
fi
