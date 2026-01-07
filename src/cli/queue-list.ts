import { queues } from '../queue/queues'

const args = process.argv.slice(2)

const showHelp = args.includes('--help') || args.includes('-h')

if (showHelp) {
  console.log(`
Usage:
  bun run queue:list

Description:
  Lists all configured queues registered in the application.

Options:
  -h, --help   Show this help message
`)
  process.exit(0)
}

const queueNames = Object.keys(queues)

if (queueNames.length === 0) {
  console.log('ℹ️  No queues configured')
  process.exit(0)
}

console.log('📋 Registered queues:\n')

for (const name of queueNames) {
  console.log(`- ${name}`)
}
