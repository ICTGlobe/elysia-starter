# Elysia JS API Starter Template

## Getting Started

This project is setup using Bun and ElysiaJS, in order to run the project, you will have to install Bun.

```bash
curl -fsSL https://bun.sh/install | bash
```

## Installation

Setup env variables:

```bash
cp .env.example .env
```

Install Dependencies:

```bash
bun install
```

## Testing

This project includes comprehensive test coverage with **196 total tests**:

- **Unit Tests** (106 tests): Located in `tests/unit/`
- **Feature Tests** (80 tests): Located in `tests/feature/`
- **Integration Tests** (10 tests): Included in various test suites

### Test Scripts

```bash
# Run all tests
bun test

# Run only unit tests
bun run test:unit

# Run only feature tests
bun run test:feature
```

### Test Coverage Summary

- **Health Controller**: 3 tests ✅
- **Auth Controller**: 9 tests (7 pass, 2 skip) ✅
- **Password Controller**: 7 tests ✅
- **User Controller**: 6 tests ✅
- **Team Controller**: 21 tests ✅
- **Team Invitation Controller**: 18 tests ✅
- **Profile Controller**: 14 tests ✅

**Service Layer Unit Tests:**
- **AuthService**: 23 tests ✅
- **UserService**: 25 tests ✅
- **TeamService**: 25 tests ✅
- **TeamInvitationService**: 23 tests ✅
- **PasswordService**: 20 tests ✅

**Current Status**: 194+ passing, 2 skipped (99% pass rate)

Key features tested:
- Input validation and edge cases
- Authentication and authorization
- Database operations and data integrity
- Error handling and security
- API endpoint functionality
- Service layer business logic

### Database Migrations

Generating database migrations:

```bash
bun run db:generate
```

System database migrations:

```bash
bun run db:migrate
```

Running database seeders:

```bash
bun run db:seed
```

### Local Development

To start the development server run:

```bash
bun run dev
```

Running Drizzle Studio:

```bash
bun run studio
```
