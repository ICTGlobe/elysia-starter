# Event System

This project uses a **class-based event system** to decouple HTTP controllers from background jobs and other side effects.

The goal is to:
- Keep controllers thin and synchronous
- Emit **facts** about what happened
- Let listeners orchestrate async work (jobs, emails, integrations)

---

## Core Concepts

### Events are Classes

Events are plain classes that describe **something that already happened**.

```ts
export class UserRegistered {
  constructor(public readonly userId: string) {}
}
```

Rules:
- No logic inside events
- No side effects
- Constructor arguments are the event payload

---

### Event Identity

Events are identified by their **class name**, not strings.

This gives:
- Type safety
- Refactor safety
- No magic constants

---

## Event Bus

**File:** `src/events/event-bus.ts`

The event bus exposes two functions:

```ts
on(EventClass, handler)
emit(eventInstance)
```

### Emitting Events

Used from controllers or services:

```ts
import { emit } from '../events/event-bus'
import { UserRegistered } from '../events/user-registered'

emit(new UserRegistered(user.id))
```

✅ Controllers emit facts only
✅ No jobs or side effects here

---

### Listening to Events

Listeners subscribe to events and perform side effects.

```ts
import { on } from '../events/event-bus'
import { UserRegistered } from '../events/user-registered'
import { SendWelcomeEmail } from '../jobs/send-welcome-email'

on(UserRegistered, event => {
  SendWelcomeEmail.dispatch({ userId: event.userId })
})
```

Rules:
- Listeners may dispatch jobs
- Listeners may call services
- Listeners should stay small and focused

---

## Listener Registration

Listeners are registered via **side-effect imports** at app startup.

**File:** `src/app.ts`

```ts
import './listeners/user-registered-listener'
```

This ensures:
- All listeners are registered once
- No runtime discovery or magic

---

## Why This Design

### Compared to calling jobs directly

❌ Controller → Job
- Tight coupling
- Hard to change behavior

✅ Controller → Event → Listener → Job
- Loose coupling
- Easy to add or remove reactions

---

## When to Use Events

Use events when:
- Something meaningful happened (user registered, team created)
- Multiple reactions may exist now or later
- Work should happen asynchronously

Avoid events for:
- Simple internal function calls
- Request validation
- Synchronous business logic

---

## Summary

- Events are immutable facts
- Controllers emit events
- Listeners orchestrate async work
- Jobs remain isolated and reusable

This keeps the system explicit, testable, and scalable.
