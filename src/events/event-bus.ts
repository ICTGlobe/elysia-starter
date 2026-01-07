export type EventConstructor<T> = new (...args: any[]) => T

type EventHandler<T> = (event: T) => void | Promise<void>

const handlers = new Map<string, EventHandler<any>[]>()

export function on<T>(eventClass: EventConstructor<T>, handler: EventHandler<T>) {
  const key = eventClass.name
  const list = handlers.get(key) ?? []
  list.push(handler)
  handlers.set(key, list)
}

export function emit<T>(event: T) {
  const key = (event as any).constructor.name
  const list = handlers.get(key) ?? []
  for (const handler of list) {
    // fire-and-forget; handlers may dispatch jobs
    void handler(event)
  }
}
