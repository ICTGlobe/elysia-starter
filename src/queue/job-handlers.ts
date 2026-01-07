import type { Job } from '../jobs/job'
import { SendWelcomeEmail } from '../jobs/send-welcome-email'

export const jobHandlers: Record<string, () => Job<any>> = {
  [SendWelcomeEmail.name]: () => new SendWelcomeEmail(),
}
