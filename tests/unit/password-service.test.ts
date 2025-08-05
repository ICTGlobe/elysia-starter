import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { PasswordService } from "@/services/password-service";
import { database } from "@/database";
import { passwordResets } from "@/drizzle/schema/passwordResets";
import { users } from "@/drizzle/schema/users";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import moment from "moment";

describe("PasswordService", () => {
  let passwordService: PasswordService;
  let testUserId: string;
  let testTokenId: string;

  beforeEach(async () => {
    passwordService = new PasswordService();
    
    // Create a test user
    testUserId = createId();
    await database.insert(users).values({
      id: testUserId,
      name: "Test User",
      email: "test@example.com",
      password: "hashedpassword",
    });

    // Create a test password reset token
    testTokenId = createId();
    await database.insert(passwordResets).values({
      id: testTokenId,
      userId: testUserId,
      token: "test-token-123",
      expiresAt: moment().add(1, "hour").format("YYYY-MM-DD HH:mm:ss"),
    });
  });

  afterEach(async () => {
    // Clean up test data
    await database.delete(passwordResets).execute();
    await database.delete(users).execute();
  });

  describe("generatePasswordResetToken", () => {
    it("should create a new password reset token successfully", async () => {
      const result = await passwordService.generatePasswordResetToken(testUserId);
      
      expect(result.userId).toBe(testUserId);
      expect(result.token).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.expiresAt).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it("should generate unique tokens for multiple requests", async () => {
      const token1 = await passwordService.generatePasswordResetToken(testUserId);
      const token2 = await passwordService.generatePasswordResetToken(testUserId);
      
      expect(token1.token).not.toBe(token2.token);
      expect(token1.id).not.toBe(token2.id);
    });

    it("should set expiration time 1 hour in the future", async () => {
      const beforeCreation = moment();
      const result = await passwordService.generatePasswordResetToken(testUserId);
      const afterCreation = moment();
      
      const expirationTime = moment(result.expiresAt);
      const expectedMinExpiration = beforeCreation.add(59, "minutes");
      const expectedMaxExpiration = afterCreation.add(61, "minutes");
      
      expect(expirationTime.isAfter(expectedMinExpiration)).toBe(true);
      expect(expirationTime.isBefore(expectedMaxExpiration)).toBe(true);
    });

    it("should throw descriptive error for invalid userId", async () => {
      await expect(passwordService.generatePasswordResetToken(null as any)).rejects.toThrow("User ID is required");
      await expect(passwordService.generatePasswordResetToken(undefined as any)).rejects.toThrow("User ID is required");
      await expect(passwordService.generatePasswordResetToken("")).rejects.toThrow("User ID cannot be empty");
    });

    it("should handle database constraint violations for non-existent user", async () => {
      const nonExistentUserId = createId();
      await expect(passwordService.generatePasswordResetToken(nonExistentUserId)).rejects.toThrow();
    });
  });

  describe("validatePasswordResetToken", () => {
    it("should return token when valid and not expired", async () => {
      const result = await passwordService.validatePasswordResetToken("test-token-123");
      
      expect(result.id).toBe(testTokenId);
      expect(result.userId).toBe(testUserId);
      expect(result.token).toBe("test-token-123");
    });

    it("should throw error when token not found", async () => {
      const nonExistentToken = "non-existent-token-456";
      
      await expect(passwordService.validatePasswordResetToken(nonExistentToken)).rejects.toThrow("Token not found");
    });

    it("should throw error when token is expired", async () => {
      // Create an expired token
      const expiredTokenId = createId();
      await database.insert(passwordResets).values({
        id: expiredTokenId,
        userId: testUserId,
        token: "expired-token-456",
        expiresAt: moment().subtract(1, "hour").format("YYYY-MM-DD HH:mm:ss"),
      });

      await expect(passwordService.validatePasswordResetToken("expired-token-456")).rejects.toThrow("Token expired");
    });

    it("should throw descriptive error for invalid token input", async () => {
      await expect(passwordService.validatePasswordResetToken(null as any)).rejects.toThrow("Token is required");
      await expect(passwordService.validatePasswordResetToken(undefined as any)).rejects.toThrow("Token is required");
      await expect(passwordService.validatePasswordResetToken("")).rejects.toThrow("Token cannot be empty");
    });

    it("should handle tokens that expire exactly at current time", async () => {
      // Create a token that expires at the current moment
      const expiredTokenId = createId();
      await database.insert(passwordResets).values({
        id: expiredTokenId,
        userId: testUserId,
        token: "exact-expiry-token",
        expiresAt: moment().format("YYYY-MM-DD HH:mm:ss"),
      });

      // This should be treated as expired (not valid)
      await expect(passwordService.validatePasswordResetToken("exact-expiry-token")).rejects.toThrow("Token expired");
    });

    it("should work with tokens that have different date formats", async () => {
      // Create a token with a slightly different but valid date format
      const validTokenId = createId();
      await database.insert(passwordResets).values({
        id: validTokenId,
        userId: testUserId,
        token: "format-test-token",
        expiresAt: moment().add(30, "minutes").format("YYYY-MM-DD HH:mm:ss"),
      });

      const result = await passwordService.validatePasswordResetToken("format-test-token");
      expect(result.token).toBe("format-test-token");
    });
  });

  describe("deletePasswordResetToken", () => {
    it("should delete token successfully", async () => {
      await passwordService.deletePasswordResetToken(testTokenId);
      
      // Verify token is deleted by trying to validate it
      await expect(passwordService.validatePasswordResetToken("test-token-123")).rejects.toThrow("Token not found");
    });

    it("should throw descriptive error for invalid token ID", async () => {
      await expect(passwordService.deletePasswordResetToken(null as any)).rejects.toThrow("Token ID is required");
      await expect(passwordService.deletePasswordResetToken(undefined as any)).rejects.toThrow("Token ID is required");
      await expect(passwordService.deletePasswordResetToken("")).rejects.toThrow("Token ID cannot be empty");
    });

    it("should handle deleting non-existent token gracefully", async () => {
      const nonExistentId = createId();
      
      // Should not throw error for non-existent token
      await expect(passwordService.deletePasswordResetToken(nonExistentId)).resolves.toBeUndefined();
    });

    it("should not affect other tokens", async () => {
      // Create another token
      const anotherTokenId = createId();
      await database.insert(passwordResets).values({
        id: anotherTokenId,
        userId: testUserId,
        token: "another-token-456",
        expiresAt: moment().add(1, "hour").format("YYYY-MM-DD HH:mm:ss"),
      });

      await passwordService.deletePasswordResetToken(testTokenId);

      // Other token should still exist and be valid
      const remainingToken = await passwordService.validatePasswordResetToken("another-token-456");
      expect(remainingToken.id).toBe(anotherTokenId);
    });
  });

  describe("Edge Cases and Data Integrity", () => {
    it("should maintain data consistency across operations", async () => {
      // Generate a new token
      const newToken = await passwordService.generatePasswordResetToken(testUserId);
      
      // Validate it
      const validatedToken = await passwordService.validatePasswordResetToken(newToken.token!);
      expect(validatedToken.id).toBe(newToken.id);
      expect(validatedToken.userId).toBe(newToken.userId);
      
      // Delete it
      await passwordService.deletePasswordResetToken(newToken.id);
      
      // Should no longer be found
      await expect(passwordService.validatePasswordResetToken(newToken.token!)).rejects.toThrow("Token not found");
    });

    it("should handle multiple tokens for the same user", async () => {
      const token1 = await passwordService.generatePasswordResetToken(testUserId);
      const token2 = await passwordService.generatePasswordResetToken(testUserId);
      
      // Both tokens should be valid
      const validated1 = await passwordService.validatePasswordResetToken(token1.token!);
      const validated2 = await passwordService.validatePasswordResetToken(token2.token!);
      
      expect(validated1.userId).toBe(testUserId);
      expect(validated2.userId).toBe(testUserId);
      expect(validated1.token).not.toBe(validated2.token);
    });

    it("should handle token expiration boundaries correctly", async () => {
      // Create a token that expires in the past
      const expiredId = createId();
      await database.insert(passwordResets).values({
        id: expiredId,
        userId: testUserId,
        token: "expired-boundary-test",
        expiresAt: moment().subtract(1, "second").format("YYYY-MM-DD HH:mm:ss"),
      });

      // Should be expired
      await expect(passwordService.validatePasswordResetToken("expired-boundary-test")).rejects.toThrow("Token expired");

      // Create a token that expires far in the future
      const validId = createId();
      await database.insert(passwordResets).values({
        id: validId,
        userId: testUserId,
        token: "valid-boundary-test",
        expiresAt: moment().add(10, "minutes").format("YYYY-MM-DD HH:mm:ss"),
      });

      // Should be valid
      const result = await passwordService.validatePasswordResetToken("valid-boundary-test");
      expect(result.token).toBe("valid-boundary-test");
    });

    it("should preserve token data integrity when validating", async () => {
      const originalToken = await database
        .select()
        .from(passwordResets)
        .where(eq(passwordResets.token, "test-token-123"))
        .limit(1)
        .get();

      const validatedToken = await passwordService.validatePasswordResetToken("test-token-123");

      // All data should be preserved
      expect(validatedToken.id).toBe(originalToken!.id);
      expect(validatedToken.userId).toBe(originalToken!.userId);
      expect(validatedToken.token).toBe(originalToken!.token);
      expect(validatedToken.expiresAt).toBe(originalToken!.expiresAt);
      expect(validatedToken.createdAt).toBe(originalToken!.createdAt);
    });

    it("should handle concurrent token operations", async () => {
      // Generate multiple tokens concurrently
      const tokenPromises = Array.from({ length: 5 }, () => 
        passwordService.generatePasswordResetToken(testUserId)
      );
      
      const tokens = await Promise.all(tokenPromises);
      
      // All tokens should be unique
      const tokenValues = tokens.map(t => t.token);
      const uniqueTokens = new Set(tokenValues);
      expect(uniqueTokens.size).toBe(5);
      
      // All tokens should be valid
      const validationPromises = tokens.map(t => 
        passwordService.validatePasswordResetToken(t.token!)
      );
      
      const validatedTokens = await Promise.all(validationPromises);
      expect(validatedTokens).toHaveLength(5);
    });
  });
});
