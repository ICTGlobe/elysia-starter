# Elysia JS API Starter Template

## Getting Started
This project is setup using Bun and ElysiaJS, in order to run the project, you will have to install Bun.

```bash
curl -fsSL https://bun.sh/install | bash
```
## Development

Setup env variables:
```bash
cp .env.example .env
```

To start the development server run:
```bash
bun run dev
```

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
