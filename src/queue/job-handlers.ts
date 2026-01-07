import type { Job } from '@/jobs/job'
import { ExampleJob } from '@/jobs/example-job'
import { SendWelcomeEmail } from '@/jobs/send-welcome-email'

export const jobHandlers: Record<string, () => Job<any>> = {  
  [ExampleJob.name]: () => new ExampleJob(),
  [SendWelcomeEmail.name]: () => new SendWelcomeEmail(),
}
