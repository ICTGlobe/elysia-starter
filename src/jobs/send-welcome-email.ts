import { Job } from './job'

export class SendWelcomeEmail extends Job<{ userId: string }> {
  static queueName = 'emails'

  async handle({ userId }: { userId: string }): Promise<void> {
    console.log(`Sending welcome email to user ${userId}`)
  }
}
