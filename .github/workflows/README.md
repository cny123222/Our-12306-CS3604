# GitHub Actions Workflows

This directory contains CI/CD workflows for automated testing of the 12306 Railway Booking System.

## 📋 Workflow Overview

### 1. `ci.yml` - Main CI Pipeline
**Triggers:** Push to `main`, Pull Requests to `main`

The comprehensive CI pipeline that runs all tests in sequence:
- **Backend Tests**: Unit tests, service tests, controller tests
- **Frontend Tests**: Component tests, page tests  
- **E2E Integration**: Full stack integration tests with backend server running
- **Test Summary**: Aggregated results and status report

**Use this workflow for:** Production releases, main branch protection

---

### 2. `backend-tests.yml` - Backend Only
**Triggers:** Push/PR affecting `backend/**` files

Runs backend tests in isolation on multiple Node versions (18.x, 20.x):
- Unit tests for services and controllers
- Route tests
- Integration tests
- Code coverage reporting

**Use this workflow for:** Backend-focused development branches

---

### 3. `frontend-tests.yml` - Frontend Only  
**Triggers:** Push/PR affecting `frontend/**` files

Runs frontend tests in isolation on multiple Node versions (18.x, 20.x):
- Component tests (React Testing Library)
- Page tests
- Integration tests
- Build verification
- Code coverage reporting

**Use this workflow for:** Frontend-focused development branches

---

### 4. `integration-tests.yml` - Full Stack Integration
**Triggers:** Push/PR to any branch matching `main`, `develop`, `build_*`

Comprehensive integration testing:
- Starts real backend server
- Runs backend integration tests
- Runs frontend integration tests  
- Tests cross-page navigation flows
- Collects server logs on failure

**Use this workflow for:** Testing feature branches before merging

---

## 🚀 Quick Start

### Running Tests Locally

**Backend:**
```bash
cd backend
npm test                  # All tests
npm run test:coverage     # With coverage
```

**Frontend:**
```bash
cd frontend
npm test -- --run         # All tests
npm run test:coverage     # With coverage
```

**Integration (Full Stack):**
```bash
# Terminal 1: Start backend
cd backend && npm start

# Terminal 2: Run integration tests
cd backend && npm test -- test/integration/
cd frontend && npm test -- --run test/integration/
```

---

## 📊 Test Coverage

Current test suite coverage:

### Backend
- **Test Suites:** 5 passed
- **Test Cases:** 93 passed, 10 skipped
- **Coverage:** ~80% statements, ~81% branches

### Frontend  
- **Test Files:** 14 passed, 1 skipped
- **Test Cases:** 205 passed, 14 skipped
- **Components Tested:** 
  - LoginForm, RegisterForm
  - SmsVerificationModal, RegistrationVerificationModal
  - TopNavigation, BottomNavigation
  - ValidationInput, SelectDropdown, SuccessModal

---

## 🔧 Workflow Configuration

### Node.js Versions
- **Primary:** Node 20.x (LTS)
- **Compatibility:** Node 18.x

### Caching Strategy
All workflows use npm dependency caching for faster builds:
```yaml
cache: 'npm'
cache-dependency-path: backend/package-lock.json
```

### Parallel Execution
- Backend and Frontend tests run in parallel
- Integration tests run after both pass (dependency chain)
- Matrix strategy tests multiple Node versions simultaneously

---

## 🎯 Branch Protection Rules

### Recommended Settings for `main` branch:

1. **Require status checks to pass:**
   - ✅ CI - Full Test Suite / backend-tests
   - ✅ CI - Full Test Suite / frontend-tests  
   - ✅ CI - Full Test Suite / e2e-integration

2. **Require branches to be up to date**

3. **Require pull request reviews:** 1 approval

---

## 🐛 Debugging Failed Workflows

### Backend Tests Failing
1. Check if new code broke existing tests
2. Review backend logs in workflow output
3. Verify database schema/migrations
4. Check for environment-specific issues

### Frontend Tests Failing  
1. Check React Testing Library warnings
2. Verify mock implementations
3. Check for async timing issues
4. Review component prop changes

### Integration Tests Failing
1. Check if backend started successfully
2. Review server logs (uploaded as artifacts on failure)
3. Verify API endpoint compatibility
4. Check for port conflicts or timeouts

### Common Issues
- **Timeout errors:** Backend may need more time to start
- **Port conflicts:** Ensure port 3000 is available
- **Database locks:** SQLite may have concurrent access issues
- **Missing dependencies:** Check if `npm ci` completed successfully

---

## 📈 Future Enhancements

- [ ] Add E2E tests with Playwright/Cypress
- [ ] Performance benchmarking
- [ ] Visual regression testing
- [ ] Automated dependency updates (Dependabot)
- [ ] Deploy previews for PRs
- [ ] Code quality checks (ESLint, TypeScript)
- [ ] Security scanning (npm audit, Snyk)

---

## 📝 Adding New Tests

When adding new test files:

1. **Backend tests** → Place in `backend/test/`
   - Unit tests: `test/services/` or `test/controllers/`
   - Integration: `test/integration/`
   - Routes: `test/routes/`

2. **Frontend tests** → Place in `frontend/test/`
   - Components: `test/components/`
   - Pages: `test/pages/`
   - Integration: `test/integration/`
   - Cross-page: `test/cross-page/`

3. Update this README if adding new workflow files

---

## 🤝 Contributing

Before submitting a PR:
1. ✅ Run tests locally
2. ✅ Ensure all workflows pass
3. ✅ Add tests for new features
4. ✅ Update documentation

---

**Last Updated:** 2025-11-12  
**Maintained by:** CS3604 Project Team

