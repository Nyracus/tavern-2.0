# Unit Tests for Anomaly Feature

This directory contains unit tests for the anomaly detection and management system.

## ⚡ Automated Testing

**Tests run automatically before each commit!** 

If tests fail, the commit will be blocked. You must fix failing tests before committing.

## Test File

- `test_anomaly.test.ts` - Comprehensive tests for all anomaly API endpoints

## Test Coverage

The test suite covers all three anomaly API endpoints:

1. **POST /api/admin/anomalies/scan** - Scan for anomalies
   - Tests scanning for inactive NPCs
   - Tests detecting overworked adventurers
   - Tests detecting deadline anomalies
   - Tests authentication and authorization

2. **GET /api/admin/anomalies** - List all anomalies
   - Tests listing all anomalies
   - Tests sorting by creation date
   - Tests authentication and authorization

3. **PATCH /api/admin/anomalies/:id/status** - Update anomaly status
   - Tests updating status to ACKNOWLEDGED, RESOLVED, and IGNORED
   - Tests error handling (missing status, non-existent anomaly)
   - Tests authentication and authorization

4. **Integration Test** - Full workflow test
   - Tests scanning, listing, and updating anomalies in sequence

## Running Tests

### Prerequisites

1. Make sure MongoDB is running (test database will be used)
2. Install dependencies:
   ```bash
   npm install
   ```

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Database

Tests use a separate test database: `mongodb://127.0.0.1:27017/tavern_test`

You can override this by setting `TEST_MONGO_URI` in your environment.

## Test Structure

- **Authentication**: Tests properly handle JWT tokens (no hardcoded tokens)
- **Authorization**: Tests verify that only Guild Masters can access endpoints
- **Data Isolation**: Each test runs in isolation with clean database state
- **Error Handling**: Tests cover error cases (401, 403, 404, 400)

## Notes

- Tests create users dynamically with proper password hashing
- Tests clean up after themselves (database is cleared after each test)
- All authentication tokens are generated programmatically
- Tests verify both success and failure scenarios

## Viewing Test Results

### Quick View (Terminal)
```bash
npm test
```

### Detailed HTML Report
```bash
npm test
# Open: test-results/test-report.html
```

### Coverage Report
```bash
npm run test:coverage
# Open: test-results/coverage/index.html
```

### For Assignment Submission
1. Run `npm test`
2. Take a screenshot of the terminal output showing all tests passing
3. OR screenshot the HTML report at `test-results/test-report.html`

See `TEST_RESULTS.md` in the root directory for detailed instructions.

