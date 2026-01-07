import { Job } from './job'

export class SendWelcomeEmail extends Job<{ userId: string }> {
  static retries = 5
  static backoff = {
    type: 'exponential',
    delay: 2000,
  }
  static timeout = 10_000
  // Optional default delay (e.g., wait 30 seconds after signup)
  static delay = 30_000
  static queueName = 'emails'

  async handle({ userId }: { userId: string }): Promise<void> {
    console.log(`Sending welcome email to user ${userId}`)
  }
}