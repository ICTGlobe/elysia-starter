import { User, users } from "@/drizzle/schema/users";

import { database } from "@/database";
import { eq } from "drizzle-orm";

export default class UserService {
  /**
   * Get a user by id
   */
  async getUserById(id: string): Promise<User> {
    if (!id) {
      throw new Error("User ID is required");
    }

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
    if (!email) {
      throw new Error("Email is required");
    }

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
  }  /**
   * Update the given user
   */
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    // Handle null/undefined ID
    if (!id) {
      throw new Error("User ID is required");
    }

    // Handle empty update object
    if (!data || Object.keys(data).length === 0) {
      throw new Error("Update data is required");
    }

    // Automatically update the updatedAt timestamp
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const result = await database
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning()
      .get();

    if (!result) {
      throw new Error("User not found");
    }

    return result;
  }
}
