# CLI Reference

This project provides a set of **first‑class CLI tools** to scaffold and operate core architectural building blocks such as **events**, **listeners**, **jobs**, and **queues**.

The CLI is intentionally opinionated and designed to:
- Enforce conventions
- Prevent accidental overwrites
- Keep the architecture explicit and discoverable
- Improve developer ergonomics without adding magic

All commands are run using **Bun**:

```bash
bun run <command>
```

---

## Scaffolding Commands

### `make:event`

Create a new domain event.

#### Usage
```bash
bun run make:event <EventName>
```

#### Arguments
- `EventName` (required)
  - PascalCase
  - Represents a **past‑tense domain fact** (e.g. `UserSubscribed`, `PasswordResetRequested`)

#### Behavior
- Creates `src/events/<kebab-name>.ts`
- Generates a minimal event class
- Fails safely if the file already exists

#### Example
```bash
bun run make:event UserSubscribed
```

Generated file:
```ts
export class UserSubscribed {
  constructor() {}
}
```

Events are **data carriers only** and must not contain side effects.

---

### `make:listener`

Create a listener bound to a domain event.

#### Usage
```bash
bun run make:listener <EventName> <ListenerName>
```

#### Arguments
- `EventName` (required)
  - Must match an event class name
- `ListenerName` (required)
  - Intent‑based name describing the reaction (e.g. `ProcessSubscription`, `SendWelcomeEmail`)

#### Behavior
- Creates the event automatically if it does not exist
- Creates `src/listeners/<kebab-listener>.ts`
- Wires the listener to the event using the event bus
- Automatically registers the listener in `src/listeners/index.ts`
- Generates an empty handler body by design

#### Example
```bash
bun run make:listener UserSubscribed ProcessSubscription
```

Generated listener:
```ts
import { on } from '../events/event-bus'
import { UserSubscribed } from '../events/user-subscribed'

on(UserSubscribed, event => {
  //
})
```

Listeners are intentionally created with no side effects to ensure all behavior is explicit.

---

### `make:job`

Scaffold and register a background job.

#### Usage
```bash
bun run make:job <JobName> [options]
```

#### Options
- `--queue <name>` – Queue name (default: `default`)
- `--retries <number>` – Number of retries
- `--timeout <ms>` – Job timeout in milliseconds
- `--delay <ms>` – Delay before execution

#### Behavior
- Creates a job class in `src/jobs/`
- Automatically registers the job in `src/queue/job-handlers.ts`
- Validates queue names
- Fails safely on naming or registration conflicts

---

### `make:queue`

Create and register a new queue.

#### Usage
```bash
bun run make:queue <queue-name> [options]
```

#### Options
- `--concurrency <number>` – Jobs processed in parallel (default: 1)
- `--rate <max>:<durationMs>` – Optional rate limit

#### Behavior
- Adds the queue to `queue-config.ts`
- Registers it in `queues.ts`
- Makes it immediately available to workers

---

## Operational Commands

### `queue:work`

Start background workers.

```bash
bun run queue:work
```

- Reads queue configuration
- Starts one worker per queue
- Applies concurrency and rate limits

---

### `queue:list`

List all registered queues.

```bash
bun run queue:list
```

---

### `queue:stats`

Show job counts per queue.

```bash
bun run queue:stats
bun run queue:stats emails
```

Displays counts for:
- waiting
- active
- delayed
- completed
- failed

---

### `queue:clear`

Clear all jobs from a queue.

```bash
bun run queue:clear <queue>
```

Intended for:
- Local development
- CI cleanup
- Recovering from invalid job payloads

---

## Recommended Usage Flow

When adding new asynchronous behavior:

1. Create an event
   ```bash
   bun run make:event UserSubscribed
   ```

2. Emit the event from a controller or service

3. Create a listener
   ```bash
   bun run make:listener UserSubscribed ProcessSubscription
   ```

4. Add side effects inside the listener

5. Create jobs for heavy or retryable work

This keeps controllers thin, events reusable, and side effects explicit.

---

## Safety & Design Guarantees

The CLI guarantees:
- No silent overwrites
- No runtime scanning or magic registration
- Explicit wiring for jobs and listeners
- Convention‑driven structure

If a command fails, no partial changes are applied.
