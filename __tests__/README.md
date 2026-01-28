# DogCal Tests

This directory contains automated tests for the DogCal application.

## Test Structure

```
__tests__/
├── api/                    # API endpoint tests
│   └── users.test.ts      # User creation and management
├── admin/                  # Admin interface integration tests
│   └── admin-interface.test.ts
├── setup.ts               # Global test setup
└── README.md             # This file
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run only API tests
npm run test:api

# Run only admin interface tests
npm run test:admin
```

## Test Coverage

### API Tests (`__tests__/api/users.test.ts`)

Tests for `/api/users` endpoint:

- **Create Owner**
  - ✅ Create owner with all fields
  - ✅ Create owner with only required fields
  - ✅ Create owner with empty string optional fields
  - ✅ Create owner with null optional fields
  - ✅ Reject owner with missing name
  - ✅ Reject owner with invalid URL
  - ✅ Reject owner with name too long

- **Create Friend**
  - ✅ Create friend with all fields
  - ✅ Create friend with only required fields
  - ✅ Create friend with empty string optional fields

- **Get Users**
  - ✅ Return all users
  - ✅ Return users sorted by role then name

### Admin Interface Tests (`__tests__/admin/admin-interface.test.ts`)

Integration tests simulating admin interface usage:

- **Create Owner Flow**
  - ✅ Create owner via admin interface
  - ✅ Handle empty form fields gracefully

- **Create Friend Flow**
  - ✅ Set up test data (owner and pup)
  - ✅ Create friend via admin interface
  - ✅ Handle friend creation with empty optional fields

- **Create Pup Flow**
  - ✅ Create pup with all fields
  - ✅ Create pup with only required fields

- **Error Handling**
  - ✅ Reject invalid URLs
  - ✅ Reject missing required fields
  - ✅ Reject invalid role

- **Data Retrieval**
  - ✅ Fetch all users
  - ✅ Fetch all pups

## Important Test Cases

### Empty String Handling

The tests ensure that empty strings in optional fields are properly converted to `null`:

```javascript
// This should work
{
  name: 'Test Owner',
  role: 'OWNER',
  phoneNumber: '',
  profilePhotoUrl: '',
  address: ''
}

// Result: all optional fields are null
```

### URL Validation

The tests verify that invalid URLs are rejected:

```javascript
// This should fail
{
  name: 'Test Owner',
  role: 'OWNER',
  profilePhotoUrl: 'not-a-url'
}
```

## Prerequisites

1. **Dev server must be running**:
   ```bash
   npm run dev
   ```

2. **Database must be seeded**:
   ```bash
   npm run prisma:seed
   ```

## Environment Variables

Tests use `TEST_API_BASE` environment variable (defaults to `http://localhost:3000`):

```bash
TEST_API_BASE=http://localhost:3000 npm test
```

## CI/CD Integration

These tests are part of the CI pipeline:

```bash
npm run ci:check
```

This runs:
1. Linting (`npm run lint`)
2. Type checking (`npm run typecheck`)
3. Unit/Integration tests (`npm run test`)
4. E2E tests (`npm run test:e2e`)

## Adding New Tests

### For API Endpoints

1. Create a new test file in `__tests__/api/`
2. Import test utilities:
   ```typescript
   import { describe, it, expect } from 'vitest';
   ```
3. Follow the existing test structure
4. Test both success and error cases

### For Admin Interface

1. Add tests to `__tests__/admin/admin-interface.test.ts`
2. Test the complete user flow
3. Include error handling tests
4. Verify data persistence

## Test Philosophy

- **Integration over Unit**: Tests focus on API endpoints and user flows
- **Real Database**: Tests run against a real database (requires dev server)
- **Black Box Testing**: Tests simulate actual API calls
- **Error Cases**: Every success case should have corresponding error tests

## Troubleshooting

### Tests Fail with Connection Error

Make sure the dev server is running:
```bash
npm run dev
```

### Tests Fail with Database Error

Reset and seed the database:
```bash
npm run prisma:migrate
npm run prisma:seed
```

### Tests Are Slow

Tests create real database entries. Consider:
1. Running specific test suites: `npm run test:api`
2. Using test database (future enhancement)
3. Adding database cleanup between test runs

## Future Improvements

- [ ] Add database cleanup/isolation between tests
- [ ] Add test coverage reporting
- [ ] Add performance benchmarks
- [ ] Add authentication/authorization tests
- [ ] Add WhatsApp integration tests
- [ ] Add calendar API tests
- [ ] Add suggestion/approval flow tests
