# Deployment Guide

This guide covers deploying the Intel Fusion Dashboard to various environments.

## 🏗️ Architecture Overview

The Intel Fusion Dashboard consists of:

- **Frontend**: React SPA served via Nginx
- **Backend**: NestJS API server  
- **Database**: PostgreSQL with PostGIS and pgvector extensions
- **Cache**: Redis for session storage and job queues
- **Storage**: MinIO (S3-compatible) for file storage
- **Search**: OpenSearch for advanced text search (optional)
- **Message Queue**: Redis Bull for background jobs

## 🐳 Docker Deployment

### Development Environment

```bash
# Start all services
make docker-dev

# Or manually
docker-compose -f docker/docker-compose.dev.yml up --build
```

### Production Environment

```bash
# Build and start production environment
make docker-prod

# Or manually  
docker-compose -f docker/docker-compose.prod.yml up --build -d
```

## ☁️ Cloud Deployment Options

### Option 1: AWS ECS with Fargate

1. **Containerize the application**
   ```bash
   # Build production images
   docker build -f docker/Dockerfile.backend -t intel-fusion-backend .
   docker build -f docker/Dockerfile.frontend -t intel-fusion-frontend .
   ```

2. **Push to ECR**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
   docker tag intel-fusion-backend:latest <account>.dkr.ecr.us-east-1.amazonaws.com/intel-fusion-backend:latest
   docker push <account>.dkr.ecr.us-east-1.amazonaws.com/intel-fusion-backend:latest
   ```

3. **Deploy with ECS Task Definition**
   - Use RDS PostgreSQL for database
   - Use ElastiCache Redis for caching
   - Use S3 for file storage
   - Use Application Load Balancer

### Option 2: Google Cloud Run

1. **Deploy Backend**
   ```bash
   gcloud run deploy intel-fusion-backend \
     --source backend/ \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

2. **Deploy Frontend**
   ```bash
   # Build frontend
   cd frontend && npm run build
   
   # Deploy to Cloud Storage + CDN
   gsutil -m cp -r dist/* gs://your-bucket/
   ```

3. **Use Cloud SQL PostgreSQL and Memorystore Redis**

### Option 3: Kubernetes

```yaml
# kubernetes/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: intel-fusion
---
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: intel-fusion-backend
  namespace: intel-fusion
spec:
  replicas: 3
  selector:
    matchLabels:
      app: intel-fusion-backend
  template:
    metadata:
      labels:
        app: intel-fusion-backend
    spec:
      containers:
      - name: backend
        image: intel-fusion-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_HOST
          value: "postgresql-service"
        - name: REDIS_HOST
          value: "redis-service"
```

Deploy with:
```bash
kubectl apply -f kubernetes/
```

## 🗄️ Database Setup

### PostgreSQL with Extensions

```sql
-- Connect as superuser and run:
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

-- Create application database and user
CREATE DATABASE intel_fusion;
CREATE USER fusion_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE intel_fusion TO fusion_user;
```

### Migration Strategy

```bash
# Run database migrations
cd backend
npm run migration:run

# For production, use:
NODE_ENV=production npm run migration:run
```

## 🔐 Security Configuration

### Environment Variables

**Required Environment Variables:**

```bash
# Database
DATABASE_HOST=your-postgres-host
DATABASE_PORT=5432
DATABASE_USERNAME=fusion_user
DATABASE_PASSWORD=secure_password
DATABASE_NAME=intel_fusion

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=secure_password

# Application
NODE_ENV=production
PORT=3001
JWT_SECRET=your-jwt-secret-minimum-32-characters
FRONTEND_URL=https://your-domain.com

# External APIs
MAPBOX_ACCESS_TOKEN=your-mapbox-token
UK_POLICE_API_KEY=optional-api-key
TFL_API_KEY=optional-api-key

# File Storage
MINIO_ENDPOINT=your-minio-endpoint
MINIO_ACCESS_KEY=access-key
MINIO_SECRET_KEY=secret-key

# Optional: Search
OPENSEARCH_URL=your-opensearch-endpoint
OPENSEARCH_USERNAME=username
OPENSEARCH_PASSWORD=password
```

### SSL/TLS Configuration

For production, ensure:
- Use HTTPS for all endpoints
- Configure proper SSL certificates
- Enable HSTS headers
- Use secure cookie settings

## 📊 Monitoring Setup

### Application Metrics

The application exposes Prometheus metrics at `/metrics`:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'intel-fusion-backend'
    static_configs:
      - targets: ['backend:3001']
    metrics_path: '/api/v1/metrics'
```

### Logging

Configure structured logging:

```bash
# Environment variables for logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE=/var/log/intel-fusion/app.log
```

### Health Checks

Health check endpoints:
- `GET /api/v1/health` - Application health
- `GET /api/v1/health/db` - Database connectivity
- `GET /api/v1/health/redis` - Redis connectivity

## 🚀 CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Build application
      run: npm run build
      
    - name: Deploy to production
      run: |
        # Your deployment script here
        echo "Deploying to production..."
```

## 🔄 Backup Strategy

### Database Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="intel_fusion_backup_$DATE.sql"

pg_dump -h $DATABASE_HOST -U $DATABASE_USERNAME -d intel_fusion > $BACKUP_FILE
aws s3 cp $BACKUP_FILE s3://your-backup-bucket/database/

# Cleanup local file
rm $BACKUP_FILE
```

### File Storage Backups

```bash
# Backup MinIO data
mc mirror minio/intel-fusion s3://backup-bucket/minio-backup/
```

## 📈 Scaling Considerations

### Horizontal Scaling

- **Backend**: Run multiple API server instances behind a load balancer
- **Database**: Use read replicas for read-heavy workloads
- **Redis**: Use Redis Cluster for high availability
- **Frontend**: Serve from CDN (CloudFront, CloudFlare)

### Performance Optimization

- Enable database connection pooling
- Implement Redis caching for expensive queries
- Use database indexes for geospatial queries
- Enable gzip compression
- Implement rate limiting

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check database connectivity
   psql -h $DATABASE_HOST -U $DATABASE_USERNAME -d intel_fusion
   ```

2. **Redis Connection Errors**
   ```bash
   # Check Redis connectivity
   redis-cli -h $REDIS_HOST ping
   ```

3. **PostGIS Extension Issues**
   ```sql
   -- Verify PostGIS installation
   SELECT postgis_version();
   ```

4. **Vector Extension Issues**
   ```sql
   -- Verify pgvector installation  
   SELECT * FROM pg_extension WHERE extname = 'vector';
   ```

### Logs Location

- Application logs: `/var/log/intel-fusion/`
- Database logs: Check PostgreSQL configuration
- Nginx logs: `/var/log/nginx/`

## 📋 Deployment Checklist

### Pre-deployment

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] SSL certificates obtained
- [ ] Monitoring configured
- [ ] Backup strategy implemented

### Post-deployment

- [ ] Health checks passing
- [ ] Database connectivity verified
- [ ] Cache connectivity verified
- [ ] API endpoints responding
- [ ] Frontend loading correctly
- [ ] Monitoring alerts configured
- [ ] Log aggregation working

## 🔗 Production URLs

After deployment, your application will be available at:

- **Frontend**: `https://your-domain.com`
- **API**: `https://api.your-domain.com`
- **API Documentation**: `https://api.your-domain.com/docs`
- **Health Check**: `https://api.your-domain.com/health`

## 📞 Support

For deployment issues:
1. Check the troubleshooting section
2. Review application logs
3. Verify environment configuration
4. Contact the development team

---

This deployment guide should be updated as the infrastructure evolves and new deployment options become available.