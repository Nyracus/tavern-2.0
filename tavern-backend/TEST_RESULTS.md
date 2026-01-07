# Test Results Guide

## 🚀 Quick Start

### First Time Setup

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

This will:
- Install all dependencies (if needed)
- Set up Husky for automated testing
- Configure pre-commit hooks

## How to View Test Results

### 1. Run Tests Manually

```bash
cd tavern-backend
npm test
```

This will:
- Run all unit tests
- Display results in the terminal
- Show pass/fail status for each test

### 2. View HTML Test Report

After running tests, an HTML report is generated:

```bash
cd tavern-backend
npm test
# Then open: test-results/test-report.html in your browser
```

The HTML report includes:
- Test summary (passed/failed/total)
- Detailed test results
- Execution time
- Test coverage information

### 3. View Coverage Report

```bash
cd tavern-backend
npm run test:coverage
```

This generates:
- Terminal output with coverage summary
- HTML coverage report at: `test-results/coverage/index.html`
- Detailed line-by-line coverage information

### 4. Automated Testing (Pre-commit Hook)

Tests run automatically before each commit. If tests fail:
- The commit is blocked
- You'll see error messages in the terminal
- Fix the tests before committing

To bypass the hook (not recommended):
```bash
git commit --no-verify
```

### 5. Test Output Files

All test results are saved in:
- `tavern-backend/test-results/test-report.html` - HTML test report
- `tavern-backend/test-results/coverage/` - Coverage reports

### 6. CI/CD Integration

For continuous integration, use:
```bash
npm run test:ci
```

This runs tests in CI mode with:
- Coverage collection
- Optimized for CI environments
- Limited workers for stability

## Test Status Indicators

- ✅ **Green** - All tests passed
- ❌ **Red** - Some tests failed
- ⚠️ **Yellow** - Tests passed with warnings

## Screenshot for Assignment Submission

To capture test results for assignment submission:

1. Run tests:
   ```bash
   cd tavern-backend
   npm test
   ```

2. Take a screenshot of:
   - Terminal output showing all tests passing
   - OR the HTML report (`test-results/test-report.html`)

3. The screenshot should show:
   - Test file name: `test_anomaly.test.ts`
   - All test cases passing
   - Test summary (X tests passed)

## Example Output

```
PASS  src/tests/test_anomaly.test.ts
  Anomaly API Endpoints
    POST /api/admin/anomalies/scan
      ✓ should scan for anomalies and return results (Guild Master only) (234ms)
      ✓ should detect overworked adventurers (156ms)
      ✓ should detect deadline anomalies (189ms)
      ✓ should reject requests without authentication (45ms)
      ✓ should reject requests from non-Guild Master users (38ms)
    GET /api/admin/anomalies
      ✓ should list all anomalies (Guild Master only) (67ms)
      ✓ should return anomalies sorted by creation date (newest first) (52ms)
      ✓ should reject requests without authentication (31ms)
      ✓ should reject requests from non-Guild Master users (28ms)
    PATCH /api/admin/anomalies/:id/status
      ✓ should update anomaly status to ACKNOWLEDGED (89ms)
      ✓ should update anomaly status to RESOLVED (76ms)
      ✓ should update anomaly status to IGNORED (71ms)
      ✓ should return 400 if status is not provided (42ms)
      ✓ should return 404 if anomaly does not exist (38ms)
      ✓ should reject requests without authentication (29ms)
      ✓ should reject requests from non-Guild Master users (25ms)
    Integration: Full anomaly workflow
      ✓ should scan, list, and update anomalies in sequence (234ms)

Test Suites: 1 passed, 1 total
Tests:       17 passed, 17 total
Snapshots:   0 total
Time:        2.456 s
```

