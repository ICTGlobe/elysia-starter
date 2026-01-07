import { test, expect, beforeEach, afterEach, spyOn } from 'bun:test'

import { Job } from '../../../src/jobs/job'
import { queues } from '../../../src/queue/queues'

class TestDispatchJob extends Job<{ value: number }> {
  static queueName = 'default'
  static retries = 5
  static timeout = 1234
  static delay = 5678

  async handle(): Promise<void> {}
}

let addSpy: ReturnType<typeof spyOn>

beforeEach(() => {
  addSpy = spyOn(queues.default, 'add').mockResolvedValue({} as any)
})

afterEach(() => {
  addSpy.mockRestore()
})

test('Job.dispatch passes retries, timeout, and delay to BullMQ', async () => {
  await TestDispatchJob.dispatch({ value: 42 })

  expect(addSpy).toHaveBeenCalledTimes(1)

  const [, , options] = addSpy.mock.calls[0]

  expect(options.attempts).toBe(5)
  expect(options.timeout).toBe(1234)
  expect(options.delay).toBe(5678)
})

test('Job.dispatch allows overriding options', async () => {
  await TestDispatchJob.dispatch(
    { value: 99 },
    {
      attempts: 1,
      delay: 100,
    } as any,
  )

  const [, , options] = addSpy.mock.calls[0]

  expect(options.attempts).toBe(1)
  expect(options.delay).toBe(100)
})