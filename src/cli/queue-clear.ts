import { queues } from '../queue/queues'

const args = process.argv.slice(2)

const showHelp = args.includes('--help') || args.includes('-h')

if (showHelp || args.length === 0) {
  console.log(`
Usage:
  bun run queue:clear <queue>

Options:
  -h, --help   Show this help message

Example:
  bun run queue:clear default
`)
  process.exit(0)
}

const queueName = args[0]

const queue = (queues as Record<string, any>)[queueName]

if (!queue) {
  console.error(`❌ Unknown queue: ${queueName}`)
  console.error(`✅ Available queues: ${Object.keys(queues).join(', ')}`)
  process.exit(1)
}

async function clearQueue() {
  console.log(`🧹 Clearing queue '${queueName}'...`)

  await queue.pause(true)

  await Promise.all([
    queue.drain(),
    queue.clean(0, 'completed'),
    queue.clean(0, 'failed'),
    queue.clean(0, 'delayed'),
    queue.clean(0, 'wait'),
    queue.clean(0, 'active'),
  ])

  await queue.resume()

  console.log(`✅ Queue '${queueName}' cleared successfully`)
  process.exit(0)
}

clearQueue().catch(error => {
  console.error('❌ Failed to clear queue')
  console.error(error)
  process.exit(1)
})
