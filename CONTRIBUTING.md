# Contributing to Intel Fusion Dashboard

Thank you for your interest in contributing to the Intel Fusion Dashboard project! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ and npm 10+
- Docker and Docker Compose
- Git

### Initial Setup
1. Clone the repository
2. Run `make setup` to install dependencies and create environment files
3. Update `.env` with your API keys (especially Mapbox for map functionality)
4. Run `make dev` to start the development environment

## 📁 Project Structure

```
intel-fusion-demo/
├── frontend/          # React + TypeScript frontend
├── backend/           # NestJS API server
├── shared/            # Shared types and utilities
├── docker/            # Docker configuration
├── docs/              # Documentation
└── README.md          # Main documentation
```

## 🛠️ Development Workflow

### 1. Code Style
We follow the guidelines in [STYLE_GUIDE.md](./STYLE_GUIDE.md). Key points:

- **TypeScript**: Strict mode enabled, no `any` types
- **React**: Arrow function components, no `React.FC`
- **Backend**: NestJS with decorators and dependency injection
- **Testing**: Jest for unit tests, Playwright for E2E

### 2. Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Individual features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Critical production fixes

### 3. Commit Convention
We use conventional commits:

```
feat: add incident clustering on map
fix: resolve timeline date filtering bug
docs: update API documentation
test: add tests for entity service
chore: update dependencies
```

### 4. Pull Request Process
1. Create a feature branch from `develop`
2. Make your changes following the style guide
3. Add tests for new functionality
4. Run quality checks: `make check`
5. Create a pull request with a clear description
6. Ensure all CI checks pass

## 🧪 Testing

### Running Tests
```bash
# All tests
make test

# Specific package tests
make test-backend
make test-frontend

# Watch mode
make test-watch
```

### Testing Guidelines
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints and service interactions
- **Component Tests**: Test React components with React Testing Library
- **E2E Tests**: Test complete user workflows

### Test Coverage
- Maintain >80% test coverage
- All new features must include tests
- Bug fixes should include regression tests

## 📝 Documentation

### Code Documentation
- Use JSDoc comments for functions and classes
- Add type annotations for all parameters
- Document complex algorithms and business logic

### API Documentation
- Use Swagger/OpenAPI decorators in controllers
- Provide example requests and responses
- Document error cases and status codes

### User Documentation
- Update README.md for setup changes
- Add feature documentation in `/docs`
- Include screenshots for UI changes

## 🔒 Security

### Security Guidelines
- Never commit API keys or secrets
- Use environment variables for configuration
- Validate all user inputs
- Follow OWASP security practices
- Only use public datasets in demo

### Reporting Security Issues
Report security vulnerabilities privately to the maintainers.

## 🏗️ Architecture Guidelines

### Frontend (React + TypeScript)
- Use functional components with hooks
- Implement proper error boundaries
- Use TanStack Query for server state
- Follow the component structure in STYLE_GUIDE.md

### Backend (NestJS + TypeScript)
- Use dependency injection
- Implement proper error handling
- Use DTOs for request/response validation
- Follow REST API conventions

### Database
- Use TypeORM with PostgreSQL
- Enable PostGIS for geospatial queries
- Use pgvector for semantic search
- Write migrations for schema changes

### Shared Package
- Export types, utilities, and validation schemas
- Use Zod for runtime validation
- Keep utilities pure and well-tested

## 🐛 Bug Reports

When reporting bugs, please include:
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Screenshots if applicable
- Error logs or console output

## 💡 Feature Requests

For new features:
- Check existing issues to avoid duplicates
- Provide clear use cases and requirements
- Include mockups or diagrams if helpful
- Consider implementation complexity

## 📋 Code Review Checklist

### For Authors
- [ ] Code follows style guide
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No console.log statements left in code
- [ ] TypeScript strict mode compliance
- [ ] Accessibility considerations addressed

### For Reviewers
- [ ] Code is readable and maintainable
- [ ] Business logic is correct
- [ ] Error handling is appropriate
- [ ] Performance considerations addressed
- [ ] Security implications reviewed

## 🎯 Performance Guidelines

### Frontend Performance
- Use React.memo() judiciously
- Implement proper loading states
- Optimize bundle size with code splitting
- Use efficient re-rendering patterns

### Backend Performance
- Optimize database queries
- Implement proper caching strategies
- Use pagination for large datasets
- Monitor API response times

## 🔧 Development Tools

### Required Tools
- VSCode (recommended) with extensions:
  - TypeScript and JavaScript Language Features
  - ESLint
  - Prettier
  - REST Client

### Useful Commands
```bash
# Start development with hot reload
make dev

# Run quality checks
make check

# View application logs
make logs

# Reset database
make db-reset

# Check application health
make health
```

## 📊 Monitoring and Observability

### Logging
- Use structured logging with winston
- Include correlation IDs for request tracing
- Log errors with appropriate context
- Avoid logging sensitive information

### Metrics
- Monitor API response times
- Track error rates
- Monitor database performance
- Use Prometheus metrics format

## 🤝 Community

### Getting Help
- Check existing documentation
- Search through issues
- Ask questions in discussions
- Join our community channels

### Contributing Areas
- Bug fixes and improvements
- New visualization features
- Data source integrations
- Documentation improvements
- Performance optimizations

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to Intel Fusion Dashboard! Your efforts help make intelligence analysis more accessible and effective.