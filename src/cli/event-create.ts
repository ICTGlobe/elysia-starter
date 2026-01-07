import { writeFileSync } from 'fs'
import { join } from 'path'

const args = process.argv.slice(2)

const showHelp = args.includes('--help') || args.includes('-h')

if (showHelp || args.length === 0) {
  console.log(`
Usage:
  bun run make:event <EventName>

Description:
  Scaffolds a new class-based domain event.

Options:
  -h, --help   Show this help message

Example:
  bun run make:event UserRegistered
`)
  process.exit(0)
}

const rawName = args[0]

const eventName = rawName
const fileName = eventName
  .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
  .toLowerCase()

const eventsDir = join(process.cwd(), 'src/events')
const eventFilePath = join(eventsDir, `${fileName}.ts`)

const template = `export class ${eventName} {
  constructor() {}
}
`

try {
  writeFileSync(eventFilePath, template, { flag: 'wx' })
} catch {
  console.error(`❌ Event file already exists: ${eventFilePath}`)
  process.exit(1)
}

console.log(`✅ Event ${eventName} created at src/events/${fileName}.ts`)
