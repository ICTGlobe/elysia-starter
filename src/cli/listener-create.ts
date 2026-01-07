import { writeFileSync } from 'fs'
import { join } from 'path'

const args = process.argv.slice(2)

const showHelp = args.includes('--help') || args.includes('-h')

if (showHelp || args.length < 2) {
  console.log(`
Usage:
  bun run make:listener <EventName> <ListenerName>

Description:
  Creates an event listener bound to an event.

Options:
  -h, --help   Show this help message

Example:
  bun run make:listener UserSubscribed ProcessSubscription
`)
  process.exit(0)
}

const rawEventName = args[0]
const rawListenerName = args[1]

const eventName = rawEventName
const listenerName = rawListenerName

const fileName = listenerName
  .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
  .toLowerCase()

const listenersDir = join(process.cwd(), 'src/listeners')
const listenerFilePath = join(listenersDir, `${fileName}.ts`)

const eventFileName = eventName
  .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
  .toLowerCase()

const eventsDir = join(process.cwd(), 'src/events')
const eventFilePath = join(eventsDir, `${eventFileName}.ts`)

// Ensure event exists (create if missing)
try {
  require('fs').accessSync(eventFilePath)
} catch {
  const eventTemplate = `export class ${eventName} {
  constructor() {}
}
`

  try {
    require('fs').writeFileSync(eventFilePath, eventTemplate, { flag: 'wx' })
    console.log(`✅ Event ${eventName} created at src/events/${eventFileName}.ts`)
  } catch {
    console.error(`❌ Failed to create event: src/events/${eventFileName}.ts`)
    process.exit(1)
  }
}

const template = `import { on } from '../events/event-bus'
import { ${eventName} } from '../events/${eventFileName}'

on(${eventName}, event => {
  //
})
`

try {
  writeFileSync(listenerFilePath, template, { flag: 'wx' })
} catch {
  console.error(`❌ Listener file already exists: ${listenerFilePath}`)
  process.exit(1)
}

// Register listener in listeners index
const indexPath = join(listenersDir, 'index.ts')
const importLine = `import './${fileName}'\n`

try {
  const indexSource = require('fs').readFileSync(indexPath, 'utf8')

  if (!indexSource.includes(importLine.trim())) {
    require('fs').writeFileSync(indexPath, indexSource + importLine)
  }
} catch {
  console.error('⚠️  Listener created, but failed to update listeners/index.ts')
}

console.log(`✅ Listener created at src/listeners/${fileName}.ts`)
console.log('✅ Listener registered in src/listeners/index.ts')
