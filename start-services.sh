#!/bin/bash
# Start all Sokostack microservices
# Usage: bash start-services.sh

echo "==========================================="
echo "  Starting Sokostack Ecosystem"
echo "==========================================="

# Kill existing services
pkill -9 -f "node.*services" 2>/dev/null
sleep 1

# Start all services
PORT=3006 node /home/anwar/apps/pixel-perfect-dash/services/auth-service/index.js &
echo "  [1/5] Auth service      → port 3006"

PORT=3007 node /home/anwar/apps/pixel-perfect-dash/services/ripplify-service/index.js &
echo "  [2/5] Ripplify service  → port 3007"

PORT=3008 node /home/anwar/apps/pixel-perfect-dash/services/shopalize-service/index.js &
echo "  [3/5] Shopalize service → port 3008"

PORT=3009 node /home/anwar/apps/pixel-perfect-dash/services/watchtower-service/index.js &
echo "  [4/5] Watchtower service→ port 3009"

PORT=3010 node /home/anwar/apps/pixel-perfect-dash/services/admin-service/index.js &
echo "  [5/5] Admin service     → port 3010"

echo ""
echo "Waiting for services to initialize..."
sleep 8

echo ""
echo "Service Health:"
for svc in "3006:Auth" "3007:Ripplify" "3008:Shopalize" "3009:Watchtower" "3010:Admin"; do
  port=${svc%%:*}
  name=${svc##*:}
  resp=$(curl -s http://localhost:$port/health 2>/dev/null)
  if echo "$resp" | grep -q '"status"'; then
    echo "  ✓ $name (port $port)"
  else
    echo "  ✗ $name (port $port) - check logs"
  fi
done

echo ""
echo "==========================================="
echo "  Ecosystem ready!"
echo "==========================================="
echo ""
echo "  Auth:      http://localhost:3006"
echo "  Ripplify:  http://localhost:3007"
echo "  Shopalize: http://localhost:3008"
echo "  Watchtower:http://localhost:3009"
echo "  Admin:     http://localhost:3010"
echo ""
echo "  To stop: pkill -f 'node.*services'"
echo ""
