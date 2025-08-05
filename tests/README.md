# Test Organization

This directory contains all tests for the Elysia Starter application, organized by test type.

## Structure

### `/unit/` - Unit Tests
Tests for individual service classes and utility functions in isolation.

- `auth-service.test.ts` - Tests for AuthService business logic
- `user-service.test.ts` - Tests for UserService data operations  
- `team-service.test.ts` - Tests for TeamService team management operations
- `team-invitation-service.test.ts` - Tests for TeamInvitationService invitation management operations
- `password-service.test.ts` - Tests for PasswordService password reset token operations

### `/feature/` - Feature/Integration Tests  
End-to-end tests for API endpoints and controller functionality.

- `auth.test.ts` - Authentication endpoints
- `heath.test.ts` - Health monitoring endpoints
- `password.test.ts` - Password reset functionality
- `profile.test.ts` - User profile management
- `team.test.ts` - Team CRUD operations
- `team-invitation.test.ts` - Team invitation workflow
- `user.test.ts` - User data endpoints

## Running Tests

```bash
# Run all tests
bun test
# or
bun run test

# Run only unit tests
bun test tests/unit/
# or
bun run test:unit

# Run only feature tests  
bun test tests/feature/
# or
bun run test:feature

# Run a specific test file
bun test tests/feature/auth.test.ts
```

## Test Statistics

- **Total**: 186 tests (183 pass, 3 skip)
- **Unit Tests**: 106 tests (105 pass, 1 skip)
  - AuthService: 13 tests (12 pass, 1 skip)
  - UserService: 25 tests (25 pass)
  - TeamService: 25 tests (25 pass)
  - TeamInvitationService: 23 tests (23 pass)
  - PasswordService: 20 tests (20 pass)
- **Feature Tests**: 80 tests (78 pass, 2 skip)
- **Pass Rate**: 98% (183/186)
