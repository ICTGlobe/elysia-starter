export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  iat: number; // JWT issued at timestamp
  exp: number; // JWT expiration timestamp
}
