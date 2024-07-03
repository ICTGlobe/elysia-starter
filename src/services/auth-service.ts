import * as jwt from "jsonwebtoken";

import { NewUser, User, users } from "@/drizzle/schema/users";

import { database } from "@/database";
import { eq } from "drizzle-orm";

export default class AuthService {
  /**
   * Sign up a user
   *
   * @param user - The user data
   *
   * @returns {Promise<User>} The created user
   */
  async signup(user: NewUser): Promise<User> {
    let existing = await database
      .select({
        id: users.id,
      })
      .from(users)
      .where(eq(users.email, user.email))
      .get();

    if (existing) {
      throw new Error("Email address already in use");
    }

    return await database.insert(users).values(user).returning().get();
  }

  /**
   * Delete the given user from the database
   *
   * @param id - the user's id
   */
  async deleteUser(id: string): Promise<void> {
    await database.delete(users).where(eq(users.id, id)).execute();
  }

  /**
   * Refresh JWT Token
   *
   * @param id - The user's id
   *
   * @returns {Promise<string>} The refreshed token
   */
  async refreshJwtToken(id: string): Promise<string> {
    let user = await database
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)
      .get();

    if (!user) {
      throw new Error("Failed to retrieve the user");
    }

    return this.generateUserJwt(user);
  }

  /**
   * Generate a JWT for a user
   *
   * @param user The user
   *
   * @returns {string} The JWT
   */
  generateUserJwt(user: User): string {
    return jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_MAX_AGE! }
    );
  }
}
