# AGENTS.md

This file provides guidance for agentic coding tools operating in this repository.
Follow these instructions unless explicitly overridden by user/system prompts.

---

## Project Overview

- **Runtime**: Bun (TypeScript)
- **Framework**: Elysia
- **Database**: Drizzle ORM (SQLite / libsql)
- **Architecture**: Controller → Service → Database
- **Tests**: Bun test runner (unit + feature)

The codebase favors explicit types, thin controllers, and business logic in services.

---

## Environment Prerequisites

- Bun >= current stable
- Node.js is not required for runtime, only tooling compatibility
- Environment variables via `.env` (see `.env.example`)

---

## Common Commands

### Development

- Start API (production-style):
  `bun run src/index.ts`
- Start API with hot reload:
  `bun run --hot src/index.ts`

### Type Checking / Linting

- Type check (acts as lint):
  `bun run --bun tsc --noEmit`
- Alias:
  `bun run lint`

### Formatting

- Format all files:
  `bun run --bun prettier --write .`
- Check formatting only:
  `bun run --bun prettier --check .`

### Tests

- Run all tests:
  `bun test`
- Run unit tests only:
  `bun test tests/unit/`
- Run feature tests only:
  `bun test tests/feature/`

#### Running a Single Test

- Single test file:
  `bun test tests/unit/user-service.test.ts`
- Filter by test name:
  `bun test -t "creates user"`

### Database

- Generate migrations:
  `bun run db:generate`
- Apply migrations:
  `bun run db:migrate`
- Seed database:
  `bun run db:seed`
- Open Drizzle Studio:
  `bun run studio`

---

## Repository Structure

- `src/controllers/` – HTTP layer, request/response mapping only
- `src/services/` – Business logic (preferred location)
- `src/database/` – DB client and test DB setup
- `src/drizzle/` – Schema, migrations, seeds
- `src/middleware/` – Auth and request context
- `src/plugins/` – Elysia plugins (cors, logging, swagger)
- `src/requests/` – Request validation schemas
- `src/responses/` – Typed API responses
- `tests/unit/` – Service-level tests
- `tests/feature/` – API-level tests

---

## Code Style Guidelines

### Language & Types

- Use **TypeScript strictly**; avoid `any`
- Prefer explicit return types for public functions
- Export shared types from `src/types/`
- Use `type` over `interface` unless extension is required

### Imports

- Use ES module syntax only
- Group imports in this order:
  1. Node/Bun built-ins
  2. External libraries
  3. Internal absolute imports
- Use consistent relative paths within folders

Example:
```ts
import { Elysia } from 'elysia'
import jwt from 'jsonwebtoken'

import { userService } from '../services/user-service'
```

### Formatting

- Prettier is the source of truth
- 2-space indentation
- Trailing commas where supported
- Single quotes for strings

### Naming Conventions

- Files: `kebab-case.ts`
- Variables & functions: `camelCase`
- Classes & types: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE` (only when truly constant)

### Functions

- Prefer small, pure functions
- Avoid deeply nested conditionals
- Early returns are encouraged

---

## Controllers

- Controllers should:
  - Validate input (via request schemas)
  - Call exactly one service
  - Map service output to response DTOs
- Do **not**:
  - Access database directly
  - Contain business logic

---

## Services

- Services own business logic
- Services may:
  - Call other services
  - Access database via Drizzle
- Services should be testable in isolation

---

## Error Handling

- Use custom error classes in `src/errors/`
- Throw domain-specific errors from services
- Let middleware handle HTTP translation
- Avoid throwing raw strings or generic `Error`

Example:
```ts
throw new BadRequestError('Email already exists')
```

---

## Testing Guidelines

- Unit tests:
  - Test services directly
  - Mock external dependencies if needed
- Feature tests:
  - Use real HTTP routes
  - Use test database helpers

General rules:
- One behavior per test
- Descriptive test names
- Avoid shared mutable state

---

## Database & Migrations

- Schema lives in `src/drizzle/schema/`
- Never edit generated migration SQL manually
- Add new migrations for schema changes
- Use transactions for multi-step operations

---

## Logging & Observability

- Use configured logging plugin
- Do not use `console.log` in production code
- Errors should include enough context for debugging

---

## Do Not

- Do not commit `.env` files
- Do not bypass type checking
- Do not add unused dependencies
- Do not refactor unrelated code without request

---

## Notes for Agentic Tools

- Favor minimal, focused changes
- Match existing patterns before introducing new ones
- Ask before large refactors or dependency changes
- Never commit unless explicitly instructed
