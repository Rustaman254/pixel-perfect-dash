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
node ./services/auth-service/index.js &
echo "  [1/5] Auth service      → port 3001"

node ./services/ripplify-service/index.js &
echo "  [2/5] Ripplify service  → port 3002"

node ./services/shopalize-service/index.js &
echo "  [3/5] Shopalize service → port 3003"

node ./services/watchtower-service/index.js &
echo "  [4/5] Watchtower service→ port 3004"

node ./services/admin-service/index.js &
echo "  [5/5] Admin service     → port 3005"

echo ""
echo "Waiting for services to initialize..."
sleep 8

echo ""
echo "Service Health:"
for svc in "3001:Auth" "3002:Ripplify" "3003:Shopalize" "3004:Watchtower" "3005:Admin"; do
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
echo "  Auth:      http://localhost:3001"
echo "  Ripplify:  http://localhost:3002"
echo "  Shopalize: http://localhost:3003"
echo "  Watchtower:http://localhost:3004"
echo "  Admin:     http://localhost:3005"
echo ""
echo "  Frontend:  http://localhost:8080 (Ripplify)"
echo "             http://localhost:8081 (Shopalize)"
echo ""
echo "  To stop: pkill -f 'node.*services'"
echo ""
