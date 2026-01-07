# Queue & Jobs System

This document describes the background job and queue system used in this codebase.
It is inspired by Laravel’s queue system and built using **BullMQ + Redis**, with Bun as the runtime.

---

## Overview

The system allows you to:

- Dispatch background jobs from controllers or services
- Persist jobs in Redis (durable, retryable)
- Process jobs asynchronously using workers
- Scale per queue using configurable concurrency
- Monitor jobs via a web dashboard

Typical flow:

```
Controller → Job.dispatch() → Redis → Worker → Job.handle()
```

---

## Key Concepts

### Job

A **Job** is a class that represents a unit of background work.

- Jobs are dispatched using a static `dispatch()` method
- Jobs declare which queue they belong to
- Jobs implement a `handle()` method

Example:

```ts
export class SendWelcomeEmail extends Job<{ userId: string }> {
  static queueName = 'emails'

  async handle({ userId }) {
    console.log(`Sending welcome email to user ${userId}`)
  }
}
```

Best practices:
- Pass **identifiers**, not full objects (e.g. `userId`, not `User`)
- Keep jobs thin; business logic should live in services

---

### Dispatching Jobs

Jobs can be dispatched from anywhere (controllers, services, listeners):

```ts
await SendWelcomeEmail.dispatch({ userId: user.id })
```

Dispatching is:
- Non‑blocking
- Durable (stored in Redis)
- Safe to call inside HTTP request handlers

---

## Queues

Queues are centrally defined and reused across the system.

### Queue Registry

**`src/queue/queues.ts`**

```ts
export const queues = {
  default: new Queue('default', { connection }),
  emails: new Queue('emails', { connection }),
}

export type QueueName = keyof typeof queues
```

- All queues live in one place
- Jobs reference queues by name
- Dashboards and workers automatically pick them up

---

### Queue Configuration (Workers & Concurrency)

**`src/queue/queue-config.ts`**

```ts
export const queueConfig = [
  { name: 'default', concurrency: 2 },
  { name: 'emails', concurrency: 2 },
]
```

- `concurrency` = number of jobs processed in parallel per queue
- Easily adjustable for scaling
- Can later be environment‑driven (e.g. via env vars)

---

## Workers

Workers are responsible for processing jobs from Redis.

### Starting Workers

```bash
bun run queue:work
```

This command:
- Reads `queue-config.ts`
- Starts a worker for each configured queue
- Applies the configured concurrency

---

### Worker Implementation

**`src/queue/worker.ts`** (simplified)

```ts
for (const { name, concurrency } of queueConfig) {
  new Worker(name, async job => {
    const handlerFactory = jobHandlers[job.name]

    if (!handlerFactory) {
      throw new Error(`Unknown job: ${job.name}`)
    }

    await handlerFactory().handle(job.data)
  }, { connection, concurrency })
}
```

Workers are:
- Queue‑agnostic
- Stateless
- Safe to run in multiple processes

---

## Job Handlers Registry

Jobs are explicitly registered in one place.

**`src/queue/job-handlers.ts`**

```ts
export const jobHandlers = {
  [SendWelcomeEmail.name]: () => new SendWelcomeEmail(),
}
```

Why explicit registration?
- No magic
- Easy code reviews
- Clear onboarding for new team members
- Compile‑time safety

To add a new job:
1. Create the job class
2. Import it here
3. Register it in the map

---

## Redis Configuration

Redis is required for queues to function.

Environment variables:

```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=null
```

These are read automatically by queues and workers.

---

## Dashboard (Bull Board)

A web dashboard is available for inspecting queues and jobs.

### Access

```
/admin/queues
```

### Features

- View waiting, active, completed, failed jobs
- Inspect job payloads
- Retry failed jobs
- Clean queues

### Setup

The dashboard is created in:

**`src/queue/dashboard.ts`**

And mounted in the main app:

```ts
app.use(createQueueDashboard())
```

⚠️ The dashboard should be protected or disabled in production.

---

## Failure Handling & Retries

- Jobs are retried automatically based on their configuration
- Failed jobs are preserved for inspection
- Retry/backoff can be added per job or globally

(See BullMQ docs for advanced retry strategies.)

---

## Design Principles

- Explicit over magical
- Durable over in‑memory
- Thin jobs, rich services
- Centralized configuration
- Easy local development, production‑ready scaling

---

## Future Enhancements

Planned / easy additions:

- Exponential backoff
- Delayed jobs
- Graceful worker shutdown
- Per‑queue rate limiting
- Auth‑protected dashboard
- Event → Job bridges

---

## Quick Reference

Start API:
```bash
bun run dev
```

Start workers:
```bash
bun run queue:work
```

Dispatch a job:
```ts
SendWelcomeEmail.dispatch({ userId })
```
