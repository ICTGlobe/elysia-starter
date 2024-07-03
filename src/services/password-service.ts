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
    return database
      .insert(passwordResets)
      .values({
        token: createId(),
        userId: userId,
        expiresAt: moment().add(1, "h").format("y-mm-DD hh:mm:ss"),
      })
      .returning()
      .get();
  }

  /**
   * Validate the provided token
   */
  async validatePasswordResetToken(token: string): Promise<PasswordReset> {
    let existingToken = await database
      .select()
      .from(passwordResets)
      .where(eq(passwordResets.token, token))
      .limit(1)
      .get();

    if (!existingToken) {
      throw new Error("Token not found");
    }

    if (moment(existingToken.expiresAt).isAfter(moment())) {
      throw new Error("Token expired");
    }

    return existingToken;
  }

  /**
   * Delete the token from the database
   */
  async deletePasswordResetToken(id: string): Promise<void> {
    await database
      .delete(passwordResets)
      .where(eq(passwordResets.id, id))
      .execute();
  }
}
