<!-- # 🚀 Deployment Guide for Server 10.3.41.102

## Server Details
- **IP Address:** 10.3.41.102
- **Deployment Path:** /var/www/html/TestManagementSystem/
- **Database Port:** 5566
- **Backend Port:** 8080
- **Frontend Port:** 80 (Nginx)

---

## 📦 Files to Transfer via ARCON SFTP

Transfer these files/folders to `/var/www/html/TestManagementSystem/`:

```
From: tmt_release_feature/test-management-tool/
To:   /var/www/html/TestManagementSystem/

├── backend/
│   ├── target/test-management-tool-1.0.0.jar   → /var/www/html/TestManagementSystem/backend/
│   └── .env.uat                                 → /var/www/html/TestManagementSystem/backend/.env
│
├── frontend/
│   └── dist/                                    → /var/www/html/TestManagementSystem/frontend/
│
├── nginx.production.conf                        → /etc/nginx/sites-available/testmanagement
├── testmanagement.service                       → /etc/systemd/system/testmanagement.service
└── deploy.sh                                    → /var/www/html/TestManagementSystem/
```

---

## 🔧 Step-by-Step Server Setup

### 1. Connect to Server
```bash
ssh user@10.3.41.102
```

### 2. Create Directory Structure
```bash
sudo mkdir -p /var/www/html/TestManagementSystem/backend
sudo mkdir -p /var/www/html/TestManagementSystem/frontend
sudo mkdir -p /var/www/html/TestManagementSystem/uploads
sudo chown -R $USER:$USER /var/www/html/TestManagementSystem
```

### 3. Create PostgreSQL Database
```bash
# Connect to PostgreSQL
sudo -u postgres psql -p 5566

# Create database
CREATE DATABASE tmt_uat;
\q
```

### 4. Copy Backend Files
After SFTP transfer:
```bash
cd /var/www/html/TestManagementSystem/backend

# Rename environment file
mv .env.uat .env
```

### 5. Setup Systemd Service
```bash
sudo cp /var/www/html/TestManagementSystem/testmanagement.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable testmanagement
sudo systemctl start testmanagement

# Check status
sudo systemctl status testmanagement
```

### 6. Setup Nginx
```bash
# Copy nginx config
sudo cp /var/www/html/TestManagementSystem/nginx.production.conf /etc/nginx/sites-available/testmanagement

# Create symlink
sudo ln -s /etc/nginx/sites-available/testmanagement /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

## ✅ Verify Deployment

### Check Backend
```bash
# Check service status
sudo systemctl status testmanagement

# Check logs
sudo journalctl -u testmanagement -f

# Test API directly
curl http://localhost:8080/api/v1/auth/login
```

### Check Frontend
```bash
# Open in browser
http://10.3.41.102
```

---

## 🔐 Default Login Credentials

| Role    | Email               | Password     |
|---------|---------------------|--------------|
| Admin   | admin@testmgmt.io   | Admin@1234   |
| Manager | manager@testmgmt.io | Manager@1234 |
| SME     | sme@testmgmt.io     | Sme@1234     |
| Tester  | tester@testmgmt.io  | Tester@1234  |

---

## 🔄 Update Deployment

When you need to update:

### Update Backend Only
```bash
# Stop service
sudo systemctl stop testmanagement

# Replace JAR file
cp new-test-management-tool-1.0.0.jar /var/www/html/TestManagementSystem/backend/test-management-tool-1.0.0.jar

# Start service
sudo systemctl start testmanagement
```

### Update Frontend Only
```bash
# Replace dist folder
rm -rf /var/www/html/TestManagementSystem/frontend/*
cp -r dist/* /var/www/html/TestManagementSystem/frontend/

# No nginx restart needed (static files)
```

---

## 🛠 Troubleshooting

### Backend won't start
```bash
# Check Java version (needs Java 17+)
java -version

# Check logs
sudo journalctl -u testmanagement -n 100

# Run manually to see errors
cd /var/www/html/TestManagementSystem/backend
java -jar test-management-tool-1.0.0.jar
```

### Database connection issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -p 5566 -U postgres -d tmt_uat
```

### Nginx 502 Bad Gateway
```bash
# Backend not running
sudo systemctl start testmanagement

# Check if backend is listening
netstat -tlnp | grep 8080
```

### Health Check Endpoints
```bash
# Basic health check
curl http://localhost:8080/api/v1/health

# Detailed health info
curl http://localhost:8080/api/v1/health/info
```

---

## 📊 Monitoring

### View Application Logs
```bash
# Real-time logs
sudo journalctl -u testmanagement -f

# Last 100 lines
sudo journalctl -u testmanagement -n 100 --no-pager

# Logs since boot
sudo journalctl -u testmanagement -b
```

### Nginx Access/Error Logs
```bash
tail -f /var/log/nginx/testmanagement_access.log
tail -f /var/log/nginx/testmanagement_error.log
```

---

## 🔒 Security Notes

1. **JWT Secret**: Updated to a strong production secret in systemd service
2. **Database Password**: Change `root@123` to a secure password in production
3. **File Permissions**: Uploads directory should only be accessible by the app user
4. **CORS**: Only allows requests from the configured frontend URL

---

## 📋 Quick Commands

| Action | Command |
|--------|---------|
| Start Backend | `sudo systemctl start testmanagement` |
| Stop Backend | `sudo systemctl stop testmanagement` |
| Restart Backend | `sudo systemctl restart testmanagement` |
| Check Status | `sudo systemctl status testmanagement` |
| View Logs | `sudo journalctl -u testmanagement -f` |
| Reload Nginx | `sudo systemctl reload nginx` |
| Test Nginx Config | `sudo nginx -t` | -->


==================================================
TEST MANAGEMENT SYSTEM - JAR UPDATE COMMANDS
Server: 10.3.41.102
Application: testmanagement
Deployment Path: /var/www/html/TestManagementSystem/backend
==================================================

1. Connect to Server
--------------------
ssh user@10.3.41.102

2. Check Current JAR
--------------------
cd /var/www/html/TestManagementSystem/backend

ls -lh

3. Check Service Status
-----------------------
sudo systemctl status testmanagement

4. Stop Application
-------------------
sudo systemctl stop testmanagement

Verify:
sudo systemctl status testmanagement

Expected Status:
inactive (dead)

5. Backup Existing JAR
----------------------
cd /var/www/html/TestManagementSystem/backend

mv test-management-tool-1.0.0.jar test-management-tool-1.0.0.jar.bak

6. Upload New JAR
-----------------
Upload new JAR file using ARCON SFTP to:

/var/www/html/TestManagementSystem/backend/

If uploaded with a different name:

mv new-file-name.jar test-management-tool-1.0.0.jar

Example:
mv test-management-tool-1.0.1.jar test-management-tool-1.0.0.jar

7. Set Permissions (Optional)
-----------------------------
chmod 644 test-management-tool-1.0.0.jar

8. Start Application
--------------------
sudo systemctl start testmanagement

9. Verify Service
-----------------
sudo systemctl status testmanagement

10. Check Application Logs
--------------------------
sudo journalctl -u testmanagement -f

Last 100 lines:

sudo journalctl -u testmanagement -n 100 --no-pager

11. Verify Port 8080
--------------------
netstat -tlnp | grep 8080

OR

ss -tlnp | grep 8080

12. Health Check
----------------
curl http://localhost:8080/api/v1/health

curl http://localhost:8080/api/v1/health/info

==================================================
QUICK JAR UPDATE COMMANDS
==================================================

sudo systemctl stop testmanagement

cd /var/www/html/TestManagementSystem/backend

mv test-management-tool-1.0.0.jar test-management-tool-1.0.0.jar.bak

# Upload new JAR via ARCON SFTP

sudo systemctl start testmanagement

sudo systemctl status testmanagement

sudo journalctl -u testmanagement -n 100 --no-pager

==================================================
ROLLBACK COMMANDS
==================================================

sudo systemctl stop testmanagement

cd /var/www/html/TestManagementSystem/backend

rm -f test-management-tool-1.0.0.jar

mv test-management-tool-1.0.0.jar.bak test-management-tool-1.0.0.jar

sudo systemctl start testmanagement

sudo systemctl status testmanagement

==================================================
USEFUL COMMANDS
==================================================

Start Service:
sudo systemctl start testmanagement

Stop Service:
sudo systemctl stop testmanagement

Restart Service:
sudo systemctl restart testmanagement

Status:
sudo systemctl status testmanagement

Logs:
sudo journalctl -u testmanagement -f

Check Service Configuration:
sudo cat /etc/systemd/system/testmanagement.service

Reload Systemd:
sudo systemctl daemon-reload
==================================================
