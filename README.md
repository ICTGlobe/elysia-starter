# Elysia JS API Starter Template

A modern, fast, and scalable API starter template built with [ElysiaJS](https://elysiajs.com/) and [Bun](https://bun.sh/). Features comprehensive authentication, team management, and robust testing.

## 🚀 Features

- **Background Jobs & Queues**: Redis‑backed job system with retries, delays, rate limiting, and dashboard
- **Fast & Modern**: Built with ElysiaJS and Bun for exceptional performance
- **Type Safety**: Full TypeScript support with strict type checking
- **Authentication**: JWT-based authentication with secure password hashing
- **Team Management**: Complete team and staff management system
- **Database**: SQLite with Drizzle ORM for type-safe database operations
- **Testing**: 284 comprehensive tests with 99.3% pass rate
- **API Documentation**: Auto-generated Swagger documentation
- **CI/CD**: GitHub Actions for automated testing and deployment

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- [Bun](https://bun.sh/) (JavaScript runtime)

## 🛠️ Installation

### 1. Install Bun

```bash
curl -fsSL https://bun.sh/install | bash
```

### 2. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/ICTGlobe/elysia-starter.git
cd elysia-starter

# Install dependencies
bun install

# Setup environment variables
cp .env.example .env
```

### 3. Configure Environment

Edit the `.env` file with your configuration:

```bash
# Required: JWT secret for authentication
JWT_SECRET=your-super-secret-jwt-key

# Optional: JWT expiration time (default: 86400 seconds = 24 hours)
JWT_MAX_AGE=86400

# Database URL (default: SQLite file)
DATABASE_URL=file:./database.db
```

## 🗄️ Database Setup

### Generate Migrations

When you modify the database schema, generate new migrations:

```bash
bun run db:generate
```

### Run Migrations

Apply database migrations:

```bash
bun run db:migrate
```

### Seed Database

Populate the database with initial data:

```bash
bun run db:seed
```

### Database Studio

Open Drizzle Studio to view and edit data:

```bash
bun run studio
```

## 🧵 Background Jobs & Queues

This project includes a background job system inspired by Laravel queues, built with **BullMQ + Redis**.

### Key capabilities

- Redis‑backed durable queues
- Multiple queues (e.g. `default`, `emails`, `notifications`)
- Configurable concurrency per queue
- Per‑queue rate limiting
- Retries with exponential backoff
- Job execution timeouts
- Delayed (scheduled) jobs
- Graceful worker shutdown
- Web dashboard for monitoring and retries

### Running workers

Start the background workers in a separate process:

```bash
bun run queue:work
```

### Creating a job (CLI)

Use the built‑in CLI to scaffold and register jobs:

```bash
bun run make:job Example
```

This will:

- Create a new job class in `src/jobs/`
- Register it in `src/queue/job-handlers.ts`
- Enforce safe defaults (no overwrites, no duplicates)

---

### Creating a queue (CLI)

Use the CLI to scaffold and register new queues:

```bash
bun run make:queue emails --concurrency 2 --rate 10:60000
```

This will:

- Add the queue to `queue-config.ts`
- Register the queue in `queues.ts`
- Configure concurrency and rate limiting

---

### Dispatching a job

```ts
SendWelcomeEmail.dispatch({ userId });
```

### Dashboard

When the API is running, visit:

```
/admin/queues
```

For full documentation, see:

- [Queues & Jobs](docs/queues-and-jobs.md)
- [Event System](docs/events.md)
- [CLI Reference](docs/cli.md)

---

## 🚀 Development

### Start Development Server

```bash
bun run dev
```

The server will start with hot reloading enabled. Visit `http://localhost:3000` to see your API.

### Production Build

```bash
bun run start
```

## 🧪 Testing

This project includes comprehensive test coverage with **284 total tests**:

- **Unit Tests** (175 tests): Service layer and utility functions
- **Feature Tests** (109 tests): API endpoints and integration tests

### Run Tests

```bash
# Run all tests
bun test

# Run only unit tests
bun run test:unit

# Run only feature tests
bun run test:feature
```

### Test Coverage Summary

**API Controllers:**

- **Health Controller**: 3 tests ✅
- **Auth Controller**: 9 tests (7 pass, 2 skip) ✅
- **Password Controller**: 7 tests ✅
- **User Controller**: 6 tests ✅
- **Team Controller**: 21 tests ✅
- **Team Invitation Controller**: 18 tests ✅
- **Team Staff Management**: 12 tests ✅
- **Profile Controller**: 14 tests ✅

**Service Layer:**

- **AuthService**: 23 tests ✅
- **UserService**: 25 tests ✅
- **TeamService**: 25 tests ✅
- **TeamInvitationService**: 23 tests ✅
- **TeamStaffService**: 19 tests ✅
- **PasswordService**: 20 tests ✅
- **NotesService**: 18 tests ✅
- **Log Plugin**: 6 tests ✅
- **Setup Functions**: 6 tests ✅

**Current Status**: 282 passing, 2 skipped (99.3% pass rate)

### What's Tested

- ✅ Input validation and edge cases
- ✅ Authentication and authorization
- ✅ Database operations and data integrity
- ✅ Error handling and security
- ✅ API endpoint functionality
- ✅ Service layer business logic

## 🔄 Continuous Integration

This project uses GitHub Actions for automated testing and code quality checks.

### Workflows

- **CI**: Runs all tests, type checking, and security audits on every push and pull request
- **Code Quality**: Performs additional code quality checks
- **Test Suite**: Dedicated test runner with detailed statistics

### Status Badges

![CI](https://github.com/ICTGlobe/elysia-starter/workflows/CI/badge.svg)
![Code Quality](https://github.com/ICTGlobe/elysia-starter/workflows/Code%20Quality/badge.svg)
![Test Suite](https://github.com/ICTGlobe/elysia-starter/workflows/Test%20Suite/badge.svg)

For detailed information about the CI/CD setup, see [GitHub Actions Documentation](docs/github-actions.md).

## 📚 API Documentation

Once the server is running, visit `http://localhost:3000/swagger` to view the interactive API documentation.

## 🏗️ Project Structure

**Architecture Overview**

This project follows an explicit, event‑driven architecture. HTTP controllers are intentionally thin and only validate input, call a single service, and emit domain events. Services contain all business logic and never trigger side effects directly. Events represent facts that already happened and are consumed by listeners, which orchestrate side effects such as dispatching background jobs or integrations. Jobs run asynchronously via BullMQ workers and remain isolated, reusable units. This separation keeps the system predictable, testable, and easy to evolve as complexity grows.


```
src/
├── app.ts                # App composition & plugin setup
├── index.ts              # Application entry point
├── routes.ts             # Route registration
├── controllers/          # HTTP controllers (thin)
├── services/             # Business logic
├── events/               # Domain events (classes)
├── listeners/            # Event listeners (side effects)
├── jobs/                 # Background job classes
├── queue/                # Queue config, workers, handlers
├── cli/                  # CLI commands (make:*, queue:*)
├── database/             # Database client & test DB
├── drizzle/              # Schema, migrations, seeds
├── middleware/           # Auth & request context
├── plugins/              # Elysia plugins
├── requests/             # Request validation schemas
├── responses/            # Typed API responses
├── errors/               # Custom error types
├── types/                # Shared TypeScript types
├── util.ts               # Shared utilities
└── setup.ts              # App/bootstrap helpers

tests/
├── unit/                 # Service-level tests
└── feature/              # API & integration tests
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [documentation](docs/)
2. Search existing [issues](https://github.com/ICTGlobe/elysia-starter/issues)
3. Create a new issue with detailed information

---

**Built with ❤️ using [ElysiaJS](https://elysiajs.com/) and [Bun](https://bun.sh/)**
