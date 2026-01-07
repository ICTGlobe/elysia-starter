import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const args = process.argv.slice(2)
const showHelp = args.includes('--help') || args.includes('-h')

if (showHelp || args.length === 0) {
  console.log(`
Usage:
  bun run make:queue <name> [options]

Options:
  --concurrency <number>   Worker concurrency (default: 1)
  --rate <max>:<ms>        Rate limit, e.g. 10:60000 (optional)
  -h, --help               Show this help message

Example:
  bun run make:queue emails --concurrency 2 --rate 10:60000
`)
  process.exit(0)
}

const name = args[0]
if (!/^[a-z][a-z0-9-]*$/.test(name)) {
  console.error('❌ Queue name must be kebab-case (e.g. emails, notifications)')
  process.exit(1)
}

const getFlagValue = (flag: string): string | undefined => {
  const i = args.indexOf(flag)
  return i !== -1 ? args[i + 1] : undefined
}

const concurrency = Number(getFlagValue('--concurrency') ?? 1)
if (!Number.isInteger(concurrency) || concurrency <= 0) {
  console.error('❌ --concurrency must be a positive integer')
  process.exit(1)
}

const rate = getFlagValue('--rate')
let rateLimit: { max: number; duration: number } | undefined
if (rate) {
  const [max, duration] = rate.split(':').map(Number)
  if (!Number.isInteger(max) || !Number.isInteger(duration)) {
    console.error('❌ --rate must be in the form <max>:<durationMs>')
    process.exit(1)
  }
  rateLimit = { max, duration }
}

// Update queue-config.ts
const queueConfigPath = join(process.cwd(), 'src/queue/queue-config.ts')
let qc = readFileSync(queueConfigPath, 'utf8')

if (qc.includes(`name: '${name}'`) || qc.includes(`name: "${name}"`)) {
  console.error(`❌ Queue '${name}' already exists in queue-config.ts`)
  process.exit(1)
}

const rateBlock = rateLimit
  ? `,\n    rateLimit: { max: ${rateLimit.max}, duration: ${rateLimit.duration} }`
  : ''

qc = qc.replace(
  /export const queueConfig: QueueConfig\[] = \[([\s\S]*?)\n\]/m,
  (_, body) =>
    `export const queueConfig: QueueConfig[] = [${body}\n  {\n    name: '${name}',\n    concurrency: ${concurrency}${rateBlock}\n  },\n]`,
)

writeFileSync(queueConfigPath, qc)

// Update queues.ts registry
const queuesPath = join(process.cwd(), 'src/queue/queues.ts')
let qs = readFileSync(queuesPath, 'utf8')

if (qs.includes(`'${name}'`)) {
  console.error(`❌ Queue '${name}' already exists in queues.ts`)
  process.exit(1)
}

qs = qs.replace(
  /export const queues = \{([\s\S]*?)\n\}/m,
  (_, body) =>
    `export const queues = {${body}\n  ${name}: new Queue('${name}', { connection }),\n}`,
)

writeFileSync(queuesPath, qs)

console.log(`✅ Queue '${name}' created and registered`)