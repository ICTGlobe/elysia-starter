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
    // Validate user data
    if (!user) {
      throw new Error("User data is required");
    }

    // Validate required fields
    if (!user.email || user.email.trim() === "") {
      throw new Error("Email is required");
    }

    if (!user.name || user.name.trim() === "") {
      throw new Error("Name is required");
    }

    if (!user.password || user.password.trim() === "") {
      throw new Error("Password is required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      throw new Error("Invalid email format");
    }

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
    // Validate user ID
    if (id === null || id === undefined) {
      throw new Error("User ID is required");
    }
    if (id === "") {
      throw new Error("User ID cannot be empty");
    }

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
    // Validate user ID
    if (id === null || id === undefined) {
      throw new Error("User ID is required");
    }
    if (id === "" || id.trim() === "") {
      throw new Error("User ID cannot be empty");
    }

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
    // Validate user data
    if (!user) {
      throw new Error("User data is required");
    }
    if (!user.id) {
      throw new Error("User ID is required");
    }
    if (!user.email) {
      throw new Error("User email is required");
    }
    if (!user.name) {
      throw new Error("User name is required");
    }

    // Validate environment variables
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET environment variable is required");
    }
    if (!process.env.JWT_MAX_AGE) {
      throw new Error("JWT_MAX_AGE environment variable is required");
    }

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
