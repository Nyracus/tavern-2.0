# 🧪 Automated Testing Setup Guide

## ✅ Testing is Now Automated!

Unit tests will **automatically run before each commit**. If tests fail, the commit will be blocked.

## 🚀 Quick Setup (One-Time)

### Step 1: Install Dependencies

```bash
cd tavern-backend
npm install
```

### Step 2: Initialize Git Hooks

**Windows:**
```bash
cd tavern-backend
setup-tests.bat
```

**Linux/Mac:**
```bash
cd tavern-backend
chmod +x setup-tests.sh
./setup-tests.sh
```

**Or manually:**
```bash
cd tavern-backend
npx husky install
```

## 📊 How to View Test Results

### Method 1: Terminal Output (Quick)
```bash
cd tavern-backend
npm test
```

You'll see output like:
```
PASS  src/tests/test_anomaly.test.ts
  Anomaly API Endpoints
    ✓ should scan for anomalies (234ms)
    ✓ should list all anomalies (67ms)
    ...
Test Suites: 1 passed, 1 total
Tests:       17 passed, 17 total
```

### Method 2: HTML Report (Detailed)
```bash
cd tavern-backend
npm test
```

Then open in browser:
- **Windows:** `tavern-backend\test-results\test-report.html`
- **Linux/Mac:** `tavern-backend/test-results/test-report.html`

The HTML report shows:
- ✅ All test cases with pass/fail status
- ⏱️ Execution time for each test
- 📈 Test coverage information
- 📝 Detailed error messages (if any tests fail)

### Method 3: Coverage Report
```bash
cd tavern-backend
npm run test:coverage
```

Then open:
- `tavern-backend/test-results/coverage/index.html`

Shows line-by-line code coverage.

## 📸 For Assignment Submission

### Option 1: Terminal Screenshot
1. Run: `cd tavern-backend && npm test`
2. Take a screenshot showing:
   - All tests passing (green checkmarks)
   - Test summary (X tests passed)
   - Test file name: `test_anomaly.test.ts`

### Option 2: HTML Report Screenshot
1. Run: `cd tavern-backend && npm test`
2. Open: `tavern-backend/test-results/test-report.html`
3. Take a screenshot of the report showing all tests passed

## 🔄 How Automation Works

### Pre-Commit Hook
When you run `git commit`, tests automatically run:

```bash
git add .
git commit -m "Your message"
# 🧪 Tests run automatically here
# ✅ If tests pass → commit succeeds
# ❌ If tests fail → commit is blocked
```

### Bypassing (Not Recommended)
If you need to commit without running tests:
```bash
git commit --no-verify -m "Your message"
```

**Warning:** Only use this in emergencies. Always fix tests before committing.

## 🛠️ Troubleshooting

### Tests Not Running on Commit?
1. Make sure Husky is installed:
   ```bash
   cd tavern-backend
   npx husky install
   ```

2. Check if `.husky/pre-commit` exists and is executable

3. Re-run setup:
   ```bash
   cd tavern-backend
   ./setup-tests.sh  # or setup-tests.bat on Windows
   ```

### MongoDB Connection Error?
- Make sure MongoDB is running
- Tests use: `mongodb://127.0.0.1:27017/tavern_test`
- You can set `TEST_MONGO_URI` environment variable to override

### Tests Failing?
1. Check error messages in terminal
2. View detailed HTML report: `test-results/test-report.html`
3. Make sure test database is clean (tests clean up automatically)

## 📁 Test Files Location

- **Test file:** `tavern-backend/src/tests/test_anomaly.test.ts`
- **Test results:** `tavern-backend/test-results/`
- **Coverage:** `tavern-backend/test-results/coverage/`

## 🎯 Test Coverage

The test suite covers:
- ✅ POST /api/admin/anomalies/scan (5 tests)
- ✅ GET /api/admin/anomalies (4 tests)
- ✅ PATCH /api/admin/anomalies/:id/status (7 tests)
- ✅ Integration workflow (1 test)

**Total: 17 tests** covering all anomaly endpoints with authentication and error handling.

