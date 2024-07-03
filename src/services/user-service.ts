import { User, users } from "@/drizzle/schema/users";

import { database } from "@/database";
import { eq } from "drizzle-orm";

export default class UserService {
  /**
   * Get a user by id
   */
  async getUserById(id: string): Promise<User> {
    let user = await database
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)
      .get();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }
  /**
   * Get a user by email
   */
  async getUserByEmail(email: string): Promise<User> {
    let user = await database
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .get();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  /**
   * Update the given user
   */
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return await database
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning()
      .get();
  }
}
