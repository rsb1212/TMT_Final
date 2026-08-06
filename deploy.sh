#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
#                    TEST MANAGEMENT TOOL — DEPLOYMENT SCRIPT
#                    Target Server: 10.3.41.102
#                    SmartQA - Testing Lifecycle Management Platform
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# Configuration
SERVER_IP="10.3.41.102"
SERVER_USER="Rahul.Bhagat"
DEPLOY_DIR="/var/www/html/TestManagementSystem"
LOCAL_BACKEND_DIR="./backend"
LOCAL_FRONTEND_DIR="./frontend"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}                    SmartQA — PRODUCTION DEPLOYMENT${NC}"
echo -e "${GREEN}                    Target: $SERVER_IP${NC}"
echo -e "${GREEN}                    Time: $(date)${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════════${NC}"

# Step 1: Build Backend
echo ""
echo -e "${YELLOW}▶ Step 1: Building Backend...${NC}"
cd $LOCAL_BACKEND_DIR
mvn clean package -DskipTests -q
cd ..
echo -e "${GREEN}✓ Backend build complete${NC}"

# Step 2: Build Frontend (production mode)
echo ""
echo -e "${YELLOW}▶ Step 2: Building Frontend for Production...${NC}"
cd $LOCAL_FRONTEND_DIR
npm install --silent
npm run build -- --mode production
cd ..
echo -e "${GREEN}✓ Frontend build complete${NC}"

# Step 3: Create directories on server
echo ""
echo -e "${YELLOW}▶ Step 3: Creating directories on server...${NC}"
ssh $SERVER_USER@$SERVER_IP "sudo mkdir -p $DEPLOY_DIR/{backend,frontend,uploads,logs,backup}"
ssh $SERVER_USER@$SERVER_IP "sudo chown -R $SERVER_USER:$SERVER_USER $DEPLOY_DIR"
echo -e "${GREEN}✓ Directories created${NC}"

# Step 4: Backup existing deployment
echo ""
echo -e "${YELLOW}▶ Step 4: Backing up existing deployment...${NC}"
ssh $SERVER_USER@$SERVER_IP << ENDSSH
    if [ -f "$DEPLOY_DIR/backend/test-management-tool-1.0.0.jar" ]; then
        cp $DEPLOY_DIR/backend/test-management-tool-1.0.0.jar $DEPLOY_DIR/backup/backend_$TIMESTAMP.jar
        echo "Backend backed up"
    fi
    if [ -d "$DEPLOY_DIR/frontend" ] && [ "$(ls -A $DEPLOY_DIR/frontend)" ]; then
        tar -czf $DEPLOY_DIR/backup/frontend_$TIMESTAMP.tar.gz -C $DEPLOY_DIR/frontend .
        echo "Frontend backed up"
    fi
ENDSSH
echo -e "${GREEN}✓ Backup complete${NC}"

# Step 5: Transfer Backend JAR
echo ""
echo -e "${YELLOW}▶ Step 5: Transferring Backend JAR...${NC}"
scp $LOCAL_BACKEND_DIR/target/test-management-tool-1.0.0.jar $SERVER_USER@$SERVER_IP:$DEPLOY_DIR/backend/
echo -e "${GREEN}✓ Backend JAR transferred${NC}"

# Step 6: Transfer Frontend Build
echo ""
echo -e "${YELLOW}▶ Step 6: Transferring Frontend Build...${NC}"
ssh $SERVER_USER@$SERVER_IP "rm -rf $DEPLOY_DIR/frontend/*"
scp -r $LOCAL_FRONTEND_DIR/dist/* $SERVER_USER@$SERVER_IP:$DEPLOY_DIR/frontend/
echo -e "${GREEN}✓ Frontend files transferred${NC}"

# Step 7: Transfer Configuration Files
echo ""
echo -e "${YELLOW}▶ Step 7: Transferring Configuration Files...${NC}"
scp nginx.production.conf $SERVER_USER@$SERVER_IP:$DEPLOY_DIR/
scp testmanagement.service $SERVER_USER@$SERVER_IP:$DEPLOY_DIR/
echo -e "${GREEN}✓ Configuration files transferred${NC}"

# Step 8: Setup and restart services on server
echo ""
echo -e "${YELLOW}▶ Step 8: Setting up services on server...${NC}"
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
    # Stop existing service
    sudo systemctl stop testmanagement 2>/dev/null || true

    # Copy Nginx config
    sudo cp /var/www/html/TestManagementSystem/nginx.production.conf /etc/nginx/conf.d/testmanagement.conf
    
    # Test nginx config
    if sudo nginx -t; then
        sudo systemctl reload nginx
        echo "Nginx configured successfully"
    else
        echo "Nginx config error!"
        exit 1
    fi

    # Copy systemd service
    sudo cp /var/www/html/TestManagementSystem/testmanagement.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable testmanagement
    sudo systemctl start testmanagement

    # Wait for service to start
    sleep 5
    
    # Check service status
    if sudo systemctl is-active --quiet testmanagement; then
        echo "Backend service started successfully"
    else
        echo "Backend service failed to start!"
        sudo journalctl -u testmanagement --no-pager -n 20
        exit 1
    fi
ENDSSH
echo -e "${GREEN}✓ Services configured${NC}"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}                    DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${YELLOW}Frontend:${NC} http://$SERVER_IP"
echo -e "  ${YELLOW}Backend:${NC}  http://$SERVER_IP/api/v1"
echo -e "  ${YELLOW}Swagger:${NC}  http://$SERVER_IP:8080/swagger-ui.html"
echo ""
echo -e "${YELLOW}To check status:${NC}"
echo "  ssh $SERVER_USER@$SERVER_IP 'sudo systemctl status testmanagement'"
echo ""
echo -e "${YELLOW}To view logs:${NC}"
echo "  ssh $SERVER_USER@$SERVER_IP 'sudo journalctl -u testmanagement -f'"
echo ""