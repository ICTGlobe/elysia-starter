import { Elysia } from 'elysia'
import { createBullBoard } from '@bull-board/api'
import { ElysiaAdapter } from '@bull-board/elysia'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'

import { queues } from './queues'

export function createQueueDashboard() {
  const serverAdapter = new ElysiaAdapter('/admin/queues')

  createBullBoard({
    queues: Object.values(queues).map(queue => new BullMQAdapter(queue)),
    serverAdapter,
  })

  return new Elysia().use(serverAdapter.registerPlugin())
}
