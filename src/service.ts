import AuthService from "@/services/auth-service";
import Elysia from "elysia";
import { PasswordService } from "./services/password-service";
import TeamInvitationService from "./services/team-invitation-service";
import TeamService from "./services/team-service";
import UserService from "./services/user-service";

export const services = new Elysia({ name: "services" }).decorate({
  authService: new AuthService(),
  passwordService: new PasswordService(),
  userService: new UserService(),
  teamService: new TeamService(),
  teamInvitationService: new TeamInvitationService(),
});
