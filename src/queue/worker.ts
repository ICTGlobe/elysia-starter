import { Worker } from 'bullmq'

import { jobHandlers } from './job-handlers'

const connection = {
  host: process.env.REDIS_HOST ?? '127.0.0.1',
  port: Number(process.env.REDIS_PORT ?? 6379),
  password:
    process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD !== 'null'
      ? process.env.REDIS_PASSWORD
      : undefined,
}


import { queueConfig } from './queue-config'

for (const { name, concurrency } of queueConfig) {
  new Worker(
    name,
    async job => {
      const handlerFactory = jobHandlers[job.name]

      if (!handlerFactory) {
        throw new Error(`Unknown job: ${job.name}`)
      }

      await handlerFactory().handle(job.data)
    },
    { connection, concurrency },
  )

  console.log(`✅ Worker started for queue: ${name} (concurrency=${concurrency})`)
}

