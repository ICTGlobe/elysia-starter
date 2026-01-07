import { queues } from '../queue/queues'

const args = process.argv.slice(2)

const showHelp = args.includes('--help') || args.includes('-h')

if (showHelp) {
  console.log(`
Usage:
  bun run queue:stats [queue]

Description:
  Shows job statistics for all queues or a single queue.

Options:
  -h, --help   Show this help message

Example:
  bun run queue:stats default
`)
  process.exit(0)
}

const queueNameFilter = args[0]

let queueEntries = Object.entries(queues)

if (queueNameFilter) {
  const queue = (queues as Record<string, any>)[queueNameFilter]

  if (!queue) {
    console.error(`❌ Unknown queue: ${queueNameFilter}`)
    console.error(`✅ Available queues: ${Object.keys(queues).join(', ')}`)
    process.exit(1)
  }

  queueEntries = [[queueNameFilter, queue]]
}

if (queueEntries.length === 0) {
  console.log('ℹ️  No queues configured')
  process.exit(0)
}

async function showStats() {
  console.log('📊 Queue statistics:\n')

  for (const [name, queue] of queueEntries) {
    const counts = await queue.getJobCounts(
      'waiting',
      'active',
      'delayed',
      'completed',
      'failed',
    )

    console.log(`🔹 ${name}`)
    console.log(`  waiting:   ${counts.waiting}`)
    console.log(`  active:    ${counts.active}`)
    console.log(`  delayed:   ${counts.delayed}`)
    console.log(`  completed: ${counts.completed}`)
    console.log(`  failed:    ${counts.failed}`)
    console.log('')
  }

  process.exit(0)
}

showStats().catch(error => {
  console.error('❌ Failed to fetch queue stats')
  console.error(error)
  process.exit(1)
})
