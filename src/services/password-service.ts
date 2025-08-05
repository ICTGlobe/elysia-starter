import { PasswordReset, passwordResets } from "@/drizzle/schema/passwordResets";

import { createId } from "@paralleldrive/cuid2";
import { database } from "@/database";
import { eq } from "drizzle-orm";
import moment from "moment";

export class PasswordService {
  /**
   * Create a new password reset token
   */
  async generatePasswordResetToken(userId: string): Promise<PasswordReset> {
    // Validate userId
    if (userId === null || userId === undefined) {
      throw new Error("User ID is required");
    }
    if (userId === "") {
      throw new Error("User ID cannot be empty");
    }

    return database
      .insert(passwordResets)
      .values({
        token: createId(),
        userId: userId,
        expiresAt: moment().add(1, "h").format("YYYY-MM-DD HH:mm:ss"),
      })
      .returning()
      .get();
  }

  /**
   * Validate the provided token
   */
  async validatePasswordResetToken(token: string): Promise<PasswordReset> {
    // Validate token input
    if (token === null || token === undefined) {
      throw new Error("Token is required");
    }
    if (token === "") {
      throw new Error("Token cannot be empty");
    }

    let existingToken = await database
      .select()
      .from(passwordResets)
      .where(eq(passwordResets.token, token))
      .limit(1)
      .get();

    if (!existingToken) {
      throw new Error("Token not found");
    }

    if (moment(existingToken.expiresAt).isBefore(moment())) {
      throw new Error("Token expired");
    }

    return existingToken;
  }

  /**
   * Delete the token from the database
   */
  async deletePasswordResetToken(id: string): Promise<void> {
    // Validate token ID
    if (id === null || id === undefined) {
      throw new Error("Token ID is required");
    }
    if (id === "") {
      throw new Error("Token ID cannot be empty");
    }

    await database
      .delete(passwordResets)
      .where(eq(passwordResets.id, id))
      .execute();
  }
}
