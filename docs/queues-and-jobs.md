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
- Throttle queues using rate limiting
- Retry failed jobs with exponential backoff
- Enforce execution timeouts
- Schedule jobs to run in the future
- Monitor jobs via a web dashboard

Typical flow:

```
Controller → Job.dispatch() → Redis → Worker → Job.handle()
```

---

## Key Concepts

### Hello World Job

The simplest possible job is shown below. This is a good starting point when adding new jobs or onboarding team members.

**`src/jobs/example-job.ts`**

```ts
import { Job } from './job'

export class ExampleJob extends Job<{ message: string }> {
  async handle({ message }: { message: string }): Promise<void> {
    console.log(`ExampleJob executed with message: ${message}`)
  }
}
```

Dispatching the job:

```ts
ExampleJob.dispatch({ message: 'Hello from the queue!' })
```

### Registering the job

After creating a job, it **must be registered** so that workers know how to execute it.

Jobs are registered explicitly in:

**`src/queue/job-handlers.ts`**

Example:

```ts
import { ExampleJob } from '../jobs/example-job'

export const jobHandlers = {
  [ExampleJob.name]: () => new ExampleJob(),
}
```

If a job is not registered:
- It may be enqueued successfully
- But workers will fail with `Unknown job` errors

This explicit registration is intentional:
- Avoids hidden magic
- Makes job wiring obvious
- Keeps worker behavior predictable

---

This job:
- Uses the default queue
- Inherits default retries, backoff, timeout, and delay
- Demonstrates the minimum required implementation

---

## Job Checklist

Before adding a new job, run through this checklist to ensure it is production‑ready:

- **Payload**
  - Pass identifiers only (e.g. `userId`, `teamId`)
  - Ensure payload is JSON‑serializable

- **Queue selection**
  - Choose the appropriate queue (`default`, `emails`, etc.)
  - Consider rate‑limited queues for external services

- **Retries & Backoff**
  - Set `static retries` if defaults are not sufficient
  - Use exponential backoff for unstable dependencies

- **Timeouts**
  - Always ensure a sensible `static timeout`
  - Keep timeouts tight to avoid stuck jobs

- **Delays (if applicable)**
  - Use `static delay` or `dispatchAfter()` for scheduled work

- **Error handling**
  - Throw errors to trigger retries
  - Do not swallow failures silently

- **Idempotency**
  - Ensure the job can safely run more than once
  - Avoid duplicate side effects (emails, charges, webhooks)

- **Registration**
  - Register the job in `src/queue/job-handlers.ts`

- **Observability**
  - Verify job behavior in the BullMQ dashboard

---

## System Diagram

Below is a simplified diagram of the queue and job execution flow:

```
┌────────────┐
│ Controller │
└─────┬──────┘
      │ Job.dispatch()
      ▼
┌────────────┐
│   Redis    │  ← durable storage
│  (BullMQ)  │
└─────┬──────┘
      │
      ▼
┌────────────┐     ┌──────────────────┐
│   Worker   │ ──▶ │  Job.handle()    │
│ (per queue)│     │  business logic  │
└─────┬──────┘     └──────────────────┘
      │
      ▼
┌────────────┐
│ Dashboard  │  ← monitoring, retries
│ (/admin/…) │
└────────────┘
```

Key properties:
- Controllers return responses immediately
- Jobs are persisted before execution
- Workers can scale horizontally
- Retries, delays, rate limits, and timeouts are enforced centrally

---

### Job

A **Job** is a class that represents a unit of background work.

- Jobs are dispatched using static helper methods
- Jobs declare which queue they belong to
- Jobs implement a `handle()` method
- Jobs define their own reliability guarantees

Example:

```ts
export class SendWelcomeEmail extends Job<{ userId: string }> {
  static queueName = 'emails'
  static retries = 5
  static backoff = { type: 'exponential', delay: 2000 }
  static timeout = 10_000
  static delay = 60_000

  async handle({ userId }) {
    console.log(`Sending welcome email to user ${userId}`)
  }
}
```

Best practices:
- Pass **identifiers**, not full objects (e.g. `userId`, not `User`)
- Keep jobs thin; business logic should live in services
- Throw errors to trigger retries

---

### Dispatching Jobs

#### Immediate execution

```ts
await SendWelcomeEmail.dispatch({ userId: user.id })
```

#### Delayed execution

```ts
await SendWelcomeEmail.dispatchAfter(
  { userId: user.id },
  5 * 60 * 1000, // 5 minutes
)
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
- Workers and dashboards automatically discover them

---

### Queue Configuration (Concurrency & Rate Limiting)

**`src/queue/queue-config.ts`**

```ts
export const queueConfig = [
  {
    name: 'default',
    concurrency: 2,
  },
  {
    name: 'emails',
    concurrency: 2,
    rateLimit: {
      max: 10,
      duration: 60_000,
    },
  },
]
```

Configuration options:

- `concurrency`
  - Number of jobs processed in parallel per queue

- `rateLimit`
  - `max`: maximum jobs
  - `duration`: time window in milliseconds

Rate limiting is enforced **across all workers** for a queue.

---

## Workers

Workers process jobs from Redis and execute job handlers.

### Starting Workers

```bash
bun run queue:work
```

This command:
- Reads `queue-config.ts`
- Starts a worker for each configured queue
- Applies concurrency and rate limits

---

### Worker Responsibilities

Workers are:
- Queue‑agnostic
- Stateless
- Safe to run in multiple processes
- Gracefully shut down on process signals

---

### Graceful Shutdown

Workers listen for `SIGINT` and `SIGTERM`.

On shutdown:
- Workers stop polling Redis
- In‑flight jobs are allowed to finish
- Redis connections are closed cleanly

This prevents:
- Duplicate job execution
- Abandoned jobs
- Partial side effects (e.g. duplicate emails)

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

## Reliability Features

### Retries & Exponential Backoff

Jobs retry automatically when `handle()` throws.

```ts
static retries = 5
static backoff = {
  type: 'exponential',
  delay: 2000,
}
```

Retry timing example:
```
2s → 4s → 8s → 16s → 32s
```

---

### Timeouts

Jobs can enforce a maximum execution time.

```ts
static timeout = 10_000 // 10 seconds
```

If a job exceeds its timeout:
- It fails
- Retries apply
- Failure is visible in the dashboard

---

### Delayed Jobs

Jobs can be scheduled to run later.

Options:

- Default delay per job:
  ```ts
  static delay = 60_000
  ```

- Explicit delay at dispatch:
  ```ts
  Job.dispatchAfter(payload, delayMs)
  ```

Delayed jobs appear in the **Delayed** state in the dashboard.

---

### Rate Limiting

Queues can throttle throughput to protect external systems.

Example:
```ts
rateLimit: {
  max: 10,
  duration: 60_000,
}
```

Guarantees:
- No more than `max` jobs start within `duration`
- Excess jobs remain waiting
- Limits apply across all workers

---

## Redis Configuration

Redis is required for queues to function.

```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=null
```

These values are shared by API and workers.

---

## Dashboard (Bull Board)

A web dashboard is available for inspecting queues and jobs.

### Access

```
/admin/queues
```

### Features

- View waiting, delayed, active, completed, and failed jobs
- Inspect payloads and errors
- Retry failed jobs
- Promote or remove delayed jobs
- Clean queues

⚠️ **Security notice:** the dashboard exposes internal job data and controls. It must not be publicly accessible without protection.

---

### Enabling / Disabling the Dashboard

The dashboard is **explicitly controlled** via an environment variable:

```env
QUEUE_DASHBOARD_ENABLED=true
```

Behavior:

- Default: **disabled**
- Disabled in all environments unless explicitly enabled
- Can be enabled in development, staging, or production

Example usage:

```env
# Local development
QUEUE_DASHBOARD_ENABLED=true

# Production (recommended default)
QUEUE_DASHBOARD_ENABLED=false
```

This approach:
- Prevents accidental exposure
- Makes intent explicit
- Works cleanly with CI/CD and infrastructure tooling

---

### Production Guidance

If the dashboard is enabled in production:

- Protect it behind authentication middleware
- Restrict access by IP or VPN if possible
- Never expose it publicly without access control

A common pattern is:

- Enable the dashboard via `QUEUE_DASHBOARD_ENABLED=true`
- Wrap `createQueueDashboard()` with auth middleware

This mirrors how Laravel Horizon and Sidekiq Web are typically deployed.

---

## Design Principles

- Explicit over magical
- Durable over in‑memory
- Thin jobs, rich services
- Centralized configuration
- Production‑first reliability

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

Dispatch with delay:
```ts
SendWelcomeEmail.dispatchAfter({ userId }, 60_000)
```
