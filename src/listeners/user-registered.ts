import { on } from '@/events/event-bus'
import { UserRegistered } from '@/events/user-registered'
import { SendWelcomeEmail } from '@/jobs/send-welcome-email'

on(UserRegistered, event => {
  SendWelcomeEmail.dispatch({ userId: event.userId })
})
