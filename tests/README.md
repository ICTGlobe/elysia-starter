# Test Organization

This directory contains all tests for the Elysia Starter application, organized by test type.

## Structure

### `/unit/` - Unit Tests
Tests for individual service classes and utility functions in isolation.

- `auth-service.test.ts` - Tests for AuthService business logic
- `user-service.test.ts` - Tests for UserService data operations  
- `team-service.test.ts` - Tests for TeamService team management operations
- `team-invitation-service.test.ts` - Tests for TeamInvitationService invitation management operations
- `team-staff-service.test.ts` - Tests for TeamStaffService team member management operations
- `password-service.test.ts` - Tests for PasswordService password reset token operations
- `notes-service.test.ts` - Tests for NotesService note management operations
- `log-plugin.test.ts` - Tests for logging plugin functionality
- `setup.test.ts` - Tests for application setup functions

### `/feature/` - Feature/Integration Tests  
End-to-end tests for API endpoints and controller functionality.

- `auth.test.ts` - Authentication endpoints
- `heath.test.ts` - Health monitoring endpoints
- `password.test.ts` - Password reset functionality
- `profile.test.ts` - User profile management
- `team.test.ts` - Team CRUD operations
- `team-invitation.test.ts` - Team invitation workflow
- `team-staff.test.ts` - Team staff management operations
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

- **Total**: 284 tests (282 pass, 2 skip)
- **Unit Tests**: 175 tests (175 pass)
  - AuthService: 23 tests (23 pass)
  - UserService: 25 tests (25 pass)
  - TeamService: 25 tests (25 pass)
  - TeamInvitationService: 23 tests (23 pass)
  - TeamStaffService: 19 tests (19 pass)
  - PasswordService: 20 tests (20 pass)
  - NotesService: 18 tests (18 pass)
  - Log Plugin: 6 tests (6 pass)
  - Setup Functions: 6 tests (6 pass)
- **Feature Tests**: 109 tests (107 pass, 2 skip)
  - Auth: 9 tests (7 pass, 2 skip)
  - Health: 3 tests (3 pass)
  - Password: 7 tests (7 pass)
  - Profile: 14 tests (14 pass)
  - Team: 21 tests (21 pass)
  - Team Invitation: 18 tests (18 pass)
  - Team Staff: 12 tests (12 pass)
  - User: 6 tests (6 pass)
- **Pass Rate**: 99.3% (282/284)
