import { Job } from './job'

export class ExampleJob extends Job<{ message: string }> {
  // Optional: override the queue (defaults to 'default')
  static queueName = 'default'

  async handle({ message }: { message: string }): Promise<void> {
    console.log(`ExampleJob executed with message: ${message}`)
  }
}
