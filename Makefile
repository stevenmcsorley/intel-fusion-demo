# Intel Fusion Dashboard - Development Makefile

.PHONY: help install dev build test clean docker-dev docker-prod

# Default target
help: ## Show this help message
	@echo "Intel Fusion Dashboard - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development setup
install: ## Install all dependencies
	@echo "🔧 Installing dependencies..."
	npm install
	cd shared && npm install
	cd backend && npm install  
	cd frontend && npm install

install-clean: ## Clean install all dependencies
	@echo "🧹 Cleaning and installing dependencies..."
	rm -rf node_modules shared/node_modules backend/node_modules frontend/node_modules
	npm ci
	cd shared && npm ci
	cd backend && npm ci
	cd frontend && npm ci

# Development
dev: ## Start development environment with Docker
	@echo "🚀 Starting development environment..."
	docker compose -f docker/docker-compose.dev.yml up --build

dev-local: ## Start development environment locally (requires local PostgreSQL/Redis)
	@echo "🚀 Starting local development environment..."
	docker/wait-for-it.sh --host localhost --port 5432 --timeout 30 -- npm run dev

dev-backend: ## Start only backend development server
	@echo "🔧 Starting backend development server..."
	cd backend && npm run dev

dev-frontend: ## Start only frontend development server  
	@echo "🎨 Starting frontend development server..."
	cd frontend && npm run dev

# Building
build: ## Build all packages
	@echo "🏗️ Building all packages..."
	npm run build

build-shared: ## Build shared package
	@echo "📦 Building shared package..."
	cd shared && npm run build

build-backend: ## Build backend
	@echo "🔧 Building backend..."
	cd backend && npm run build

build-frontend: ## Build frontend
	@echo "🎨 Building frontend..."
	cd frontend && npm run build

# Testing
test: ## Run all tests
	@echo "🧪 Running all tests..."
	npm run test

test-backend: ## Run backend tests
	@echo "🔧 Running backend tests..."
	cd backend && npm run test

test-frontend: ## Run frontend tests
	@echo "🎨 Running frontend tests..."
	cd frontend && npm run test

test-watch: ## Run tests in watch mode
	@echo "👀 Running tests in watch mode..."
	npm run test:watch

# Quality checks
typecheck: ## Run TypeScript type checking
	@echo "📝 Running TypeScript checks..."
	npm run typecheck

lint: ## Run ESLint
	@echo "🔍 Running ESLint..."
	npm run lint

lint-fix: ## Run ESLint with auto-fix
	@echo "🔧 Running ESLint with auto-fix..."
	npm run lint -- --fix

format: ## Format code with Prettier
	@echo "💅 Formatting code..."
	npx prettier --write "**/*.{ts,tsx,js,jsx,json,md}"

check: typecheck lint ## Run all quality checks

# Docker operations
docker-dev: ## Start Docker development environment
	@echo "🐳 Starting Docker development environment..."
	docker compose -f docker/docker-compose.dev.yml up --build

docker-dev-detached: ## Start Docker development environment in background
	@echo "🐳 Starting Docker development environment (detached)..."
	docker compose -f docker/docker-compose.dev.yml up --build -d

docker-prod: ## Start Docker production environment
	@echo "🐳 Starting Docker production environment..."
	docker compose -f docker/docker-compose.prod.yml up --build

docker-down: ## Stop Docker containers
	@echo "🛑 Stopping Docker containers..."
	docker compose -f docker/docker-compose.dev.yml down
	docker compose -f docker/docker-compose.prod.yml down

docker-clean: ## Clean Docker containers and volumes
	@echo "🧹 Cleaning Docker containers and volumes..."
	ddocker compose -f docker/docker-compose.dev.yml down -v
	docker system prune -f

# Database operations
db-reset: ## Reset development database
	@echo "🗄️ Resetting development database..."
	docker compose -f docker/docker-compose.dev.yml down -v
	docker compose -f docker/docker-compose.dev.yml up postgres -d
	sleep 10
	docker compose -f docker/docker-compose.dev.yml up backend -d

# Utilities
logs: ## Show Docker container logs
	@echo "📋 Showing Docker logs..."
	docker compose-f docker/docker-compose.dev.yml logs -f

logs-backend: ## Show backend logs
	docker compose -f docker/docker-compose.dev.yml logs -f backend

logs-frontend: ## Show frontend logs
	docker compose -f docker/docker-compose.dev.yml logs -f frontend

clean: ## Clean build artifacts and dependencies
	@echo "🧹 Cleaning build artifacts..."
	rm -rf dist/
	rm -rf shared/dist/
	rm -rf backend/dist/
	rm -rf frontend/dist/
	rm -rf coverage/
	rm -rf .nyc_output/

# Environment setup
env-setup: ## Copy environment file template
	@echo "⚙️ Setting up environment files..."
	cp .env.example .env
	@echo "✅ Created .env file. Please update with your configuration."

# API documentation
api-docs: ## Open API documentation
	@echo "📖 Opening API documentation..."
	open http://localhost:3001/api/docs

# Health check
health: ## Check application health
	@echo "🏥 Checking application health..."
	curl -f http://localhost:3001/api/v1/health || echo "❌ Backend not responding"
	curl -f http://localhost:5173 || echo "❌ Frontend not responding"

# Quick start
setup: install env-setup ## Complete initial setup
	@echo "✅ Setup complete! Run 'make dev' to start development."

# Deploy (placeholder)
deploy: ## Deploy to production (placeholder)
	@echo "🚀 Deploy functionality not implemented yet"
	@echo "This would typically deploy to your chosen cloud platform"