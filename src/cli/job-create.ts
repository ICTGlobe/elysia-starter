import { writeFileSync, readFileSync } from 'fs'
import { join } from 'path'

const args = process.argv.slice(2)

const showHelp = args.includes('--help') || args.includes('-h')

if (showHelp || args.length === 0) {
  console.log(`
Usage:
  bun run make:job <JobName> [options]

Options:
  --queue <name>     Queue name (default: default)
  --retries <number> Number of retries (default: inherited)
  --timeout <ms>     Job timeout in milliseconds
  --delay <ms>       Delay before execution in milliseconds
  -h, --help         Show this help message

Example:
  bun run make:job SendWelcomeEmail --queue emails --retries 5 --timeout 10000 --delay 60000
`)
  process.exit(0)
}

const rawName = args[0]

const jobName = rawName.endsWith('Job') ? rawName : `${rawName}Job`
const fileName = jobName
  .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
  .toLowerCase()

const jobsDir = join(process.cwd(), 'src/jobs')
const jobFilePath = join(jobsDir, `${fileName}.ts`)

const getFlagValue = (flag: string): string | undefined => {
  const index = args.indexOf(flag)
  return index !== -1 ? args[index + 1] : undefined
}

const queueName = getFlagValue('--queue')
const retries = getFlagValue('--retries')
const timeout = getFlagValue('--timeout')
const delay = getFlagValue('--delay')

// Validate queue name if provided
if (queueName) {
  try {
    const queueConfigPath = join(process.cwd(), 'src/queue/queue-config.ts')
    const queueConfigSource = readFileSync(queueConfigPath, 'utf8')

    const validQueues = Array.from(
      queueConfigSource.matchAll(/name:\s*['"](.*?)['"]/g),
    ).map(match => match[1])

    if (!validQueues.includes(queueName)) {
      console.error(`❌ Invalid queue name: ${queueName}`)
      console.error(`✅ Valid queues: ${validQueues.join(', ')}`)
      process.exit(1)
    }
  } catch {
    console.error('❌ Failed to validate queue name')
    process.exit(1)
  }
}

const staticConfigLines: string[] = []

if (queueName) staticConfigLines.push(`  static queueName = '${queueName}'`)
if (retries) staticConfigLines.push(`  static retries = ${Number(retries)}`)
if (timeout) staticConfigLines.push(`  static timeout = ${Number(timeout)}`)
if (delay) staticConfigLines.push(`  static delay = ${Number(delay)}`)

const staticConfig = staticConfigLines.join('\n')

const jobTemplate = `import { Job } from './job'

export class ${jobName} extends Job<{ }> {
${staticConfig ? staticConfig + '\n' : ''}
  async handle(): Promise<void> {
    console.log('${jobName} executed')
  }
}
`

// Prevent overwriting existing job file
try {
  writeFileSync(jobFilePath, jobTemplate, { flag: 'wx' })
} catch (error) {
  console.error(`❌ Job file already exists: ${jobFilePath}`)
  process.exit(1)
}

const handlersPath = join(process.cwd(), 'src/queue/job-handlers.ts')
let handlers = readFileSync(handlersPath, 'utf8')

if (handlers.includes(jobName)) {
  console.error(`❌ Job ${jobName} is already registered in job-handlers.ts`)
  process.exit(1)
}

// Register the job
  // Add import
  handlers = handlers.replace(
    /(import .*\n)+/,
    match => `${match}import { ${jobName} } from '@/jobs/${fileName}'\n`,
  )

  // Add handler entry (insert before final closing brace)
  if (!handlers.includes(`[${jobName}.name]`)) {
    const marker = 'export const jobHandlers'
    const start = handlers.indexOf(marker)

    if (start === -1) {
      console.error('❌ Could not find jobHandlers declaration')
      process.exit(1)
    }

    const end = handlers.lastIndexOf('}')
    if (end === -1 || end < start) {
      console.error('❌ Could not find end of jobHandlers object')
      process.exit(1)
    }

    handlers =
      handlers.slice(0, end).trimEnd() +
      `\n  [${jobName}.name]: () => new ${jobName}(),\n` +
      handlers.slice(end)
  }

writeFileSync(handlersPath, handlers)

console.log(`✅ Job ${jobName} created and registered`)