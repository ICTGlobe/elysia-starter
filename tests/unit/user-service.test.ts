import { describe, expect, it, beforeAll, afterAll, beforeEach } from "bun:test";
import { database } from "@/database";
import { users } from "@/drizzle/schema/users";
import UserService from "@/services/user-service";
import * as argon2 from "argon2";
import { eq } from "drizzle-orm";

describe("UserService", () => {
  let userService: UserService;
  
  // Generate unique IDs to avoid conflicts with other tests
  const uniqueId = Math.random().toString(36).substring(2, 15);
  const testUser1 = {
    name: `User Service Test User 1 ${uniqueId}`,
    email: `user-service-test-1-${uniqueId}@example.com`,
    password: "password123",
  };
  
  const testUser2 = {
    name: `User Service Test User 2 ${uniqueId}`,
    email: `user-service-test-2-${uniqueId}@example.com`,
    password: "password456",
  };

  let user1Id: string;
  let user2Id: string;

  beforeAll(async () => {
    userService = new UserService();
    
    // Create test users in the database
    const hashedPassword1 = await argon2.hash(testUser1.password);
    const hashedPassword2 = await argon2.hash(testUser2.password);
    
    const [createdUser1] = await database.insert(users).values({
      ...testUser1,
      password: hashedPassword1,
    }).returning().execute();
    
    const [createdUser2] = await database.insert(users).values({
      ...testUser2,
      password: hashedPassword2,
    }).returning().execute();
    
    user1Id = createdUser1.id;
    user2Id = createdUser2.id;
  });

  afterAll(async () => {
    // Clean up test data
    try {
      await database.delete(users).where(eq(users.email, testUser1.email)).execute();
      await database.delete(users).where(eq(users.email, testUser2.email)).execute();
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe("getUserById", () => {
    it("successfully returns user when user exists", async () => {
      const user = await userService.getUserById(user1Id);
      
      expect(user).toBeDefined();
      expect(user.id).toBe(user1Id);
      expect(user.name).toBe(testUser1.name);
      expect(user.email).toBe(testUser1.email);
      expect(user).toHaveProperty("password"); // Password is included in service response
      expect(user).toHaveProperty("createdAt");
      expect(user).toHaveProperty("updatedAt");
    });

    it("throws error when user does not exist", async () => {
      const nonExistentId = "non-existent-user-id";
      
      await expect(userService.getUserById(nonExistentId)).rejects.toThrow("User not found");
    });

    it("returns different users for different IDs", async () => {
      const user1 = await userService.getUserById(user1Id);
      const user2 = await userService.getUserById(user2Id);
      
      expect(user1.id).toBe(user1Id);
      expect(user2.id).toBe(user2Id);
      expect(user1.email).toBe(testUser1.email);
      expect(user2.email).toBe(testUser2.email);
      expect(user1.id).not.toBe(user2.id);
    });

    it("throws error when user ID is empty string", async () => {
      await expect(userService.getUserById("")).rejects.toThrow("User ID is required");
    });

    it("throws error when user ID is undefined", async () => {
      // @ts-expect-error Testing runtime behavior with invalid input
      await expect(userService.getUserById(undefined)).rejects.toThrow("User ID is required");
    });

    it("throws error when user ID is null", async () => {
      // @ts-expect-error Testing runtime behavior with invalid input
      await expect(userService.getUserById(null)).rejects.toThrow("User ID is required");
    });
  });

  describe("getUserByEmail", () => {
    it("successfully returns user when user exists", async () => {
      const user = await userService.getUserByEmail(testUser1.email);
      
      expect(user).toBeDefined();
      expect(user.id).toBe(user1Id);
      expect(user.name).toBe(testUser1.name);
      expect(user.email).toBe(testUser1.email);
      expect(user).toHaveProperty("password");
      expect(user).toHaveProperty("createdAt");
      expect(user).toHaveProperty("updatedAt");
    });

    it("throws error when user with email does not exist", async () => {
      const nonExistentEmail = "nonexistent@example.com";
      
      await expect(userService.getUserByEmail(nonExistentEmail)).rejects.toThrow("User not found");
    });

    it("returns different users for different emails", async () => {
      const user1 = await userService.getUserByEmail(testUser1.email);
      const user2 = await userService.getUserByEmail(testUser2.email);
      
      expect(user1.id).toBe(user1Id);
      expect(user2.id).toBe(user2Id);
      expect(user1.email).toBe(testUser1.email);
      expect(user2.email).toBe(testUser2.email);
      expect(user1.email).not.toBe(user2.email);
    });

    it("is case sensitive for email lookup", async () => {
      const uppercaseEmail = testUser1.email.toUpperCase();
      
      await expect(userService.getUserByEmail(uppercaseEmail)).rejects.toThrow("User not found");
    });

    it("throws error when email is empty string", async () => {
      await expect(userService.getUserByEmail("")).rejects.toThrow("Email is required");
    });

    it("throws error when email is undefined", async () => {
      // @ts-expect-error Testing runtime behavior with invalid input
      await expect(userService.getUserByEmail(undefined)).rejects.toThrow("Email is required");
    });

    it("throws error when email is null", async () => {
      // @ts-expect-error Testing runtime behavior with invalid input
      await expect(userService.getUserByEmail(null)).rejects.toThrow("Email is required");
    });
  });

  describe("updateUser", () => {
    it("successfully updates user name", async () => {
      const newName = "Updated User Name";
      
      const updatedUser = await userService.updateUser(user1Id, { name: newName });
      
      expect(updatedUser).toBeDefined();
      expect(updatedUser.id).toBe(user1Id);
      expect(updatedUser.name).toBe(newName);
      expect(updatedUser.email).toBe(testUser1.email); // Email should remain unchanged
      
      // Verify the update persisted in database
      const fetchedUser = await userService.getUserById(user1Id);
      expect(fetchedUser.name).toBe(newName);
    });

    it("successfully updates user email", async () => {
      const newEmail = `updated-${uniqueId}@example.com`;
      
      const updatedUser = await userService.updateUser(user2Id, { email: newEmail });
      
      expect(updatedUser).toBeDefined();
      expect(updatedUser.id).toBe(user2Id);
      expect(updatedUser.email).toBe(newEmail);
      expect(updatedUser.name).toBe(testUser2.name); // Name should remain unchanged
      
      // Verify the update persisted in database
      const fetchedUser = await userService.getUserById(user2Id);
      expect(fetchedUser.email).toBe(newEmail);
      
      // Update testUser2 for cleanup
      testUser2.email = newEmail;
    });

    it("successfully updates multiple fields at once", async () => {
      const newName = "Multi Update Name";
      const newEmail = `multi-update-${uniqueId}@example.com`;
      
      const updatedUser = await userService.updateUser(user1Id, { 
        name: newName,
        email: newEmail 
      });
      
      expect(updatedUser).toBeDefined();
      expect(updatedUser.id).toBe(user1Id);
      expect(updatedUser.name).toBe(newName);
      expect(updatedUser.email).toBe(newEmail);
      
      // Verify both updates persisted
      const fetchedUser = await userService.getUserById(user1Id);
      expect(fetchedUser.name).toBe(newName);
      expect(fetchedUser.email).toBe(newEmail);
      
      // Update testUser1 for cleanup
      testUser1.email = newEmail;
    });

    it("returns updated user with all fields", async () => {
      const newName = "Complete User Test";
      
      const updatedUser = await userService.updateUser(user2Id, { name: newName });
      
      expect(updatedUser).toHaveProperty("id");
      expect(updatedUser).toHaveProperty("name", newName);
      expect(updatedUser).toHaveProperty("email");
      expect(updatedUser).toHaveProperty("password");
      expect(updatedUser).toHaveProperty("createdAt");
      expect(updatedUser).toHaveProperty("updatedAt");
    });

    it("throws error for empty update object", async () => {
      // Improved service now validates update data
      await expect(userService.updateUser(user1Id, {})).rejects.toThrow("Update data is required");
    });

    it("automatically updates updatedAt timestamp", async () => {
      const originalUser = await userService.getUserById(user2Id);
      
      // Wait a small amount to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const updatedUser = await userService.updateUser(user2Id, { name: "Timestamp Test" });
      
      // Improved service now automatically updates updatedAt
      const originalTime = new Date(originalUser.updatedAt).getTime();
      const updatedTime = new Date(updatedUser.updatedAt).getTime();
      
      expect(updatedTime).toBeGreaterThan(originalTime);
    });

    it("throws error for non-existent user ID", async () => {
      const nonExistentId = "non-existent-user-id";
      
      // Improved service now throws error for non-existent users
      await expect(userService.updateUser(nonExistentId, { name: "Should Not Update" }))
        .rejects.toThrow("User not found");
    });

    it("throws error when user ID is undefined", async () => {
      // @ts-expect-error Testing runtime behavior with invalid input
      await expect(userService.updateUser(undefined, { name: "Test" })).rejects.toThrow("User ID is required");
    });

    it("throws error when user ID is null", async () => {
      // @ts-expect-error Testing runtime behavior with invalid input
      await expect(userService.updateUser(null, { name: "Test" })).rejects.toThrow("User ID is required");
    });
  });

  describe("Edge Cases and Data Integrity", () => {
    it("maintains data consistency across operations", async () => {
      // Create, read, update, read sequence
      const initialUser = await userService.getUserById(user1Id);
      const newName = "Consistency Test Name";
      
      const updatedUser = await userService.updateUser(user1Id, { name: newName });
      const fetchedUpdatedUser = await userService.getUserById(user1Id);
      
      expect(initialUser.id).toBe(updatedUser.id);
      expect(updatedUser.id).toBe(fetchedUpdatedUser.id);
      expect(fetchedUpdatedUser.name).toBe(newName);
      expect(initialUser.name).not.toBe(fetchedUpdatedUser.name);
    });

    it("handles special characters in names and emails", async () => {
      const specialName = "Üser Nämé with Special Çhars & Symbols!";
      const specialEmail = `special-chars-${uniqueId}+test@example.com`;
      
      const updatedUser = await userService.updateUser(user2Id, { 
        name: specialName,
        email: specialEmail 
      });
      
      expect(updatedUser.name).toBe(specialName);
      expect(updatedUser.email).toBe(specialEmail);
      
      // Verify retrieval works with special characters
      const fetchedUser = await userService.getUserByEmail(specialEmail);
      expect(fetchedUser.name).toBe(specialName);
      
      // Update for cleanup
      testUser2.email = specialEmail;
    });

    it("preserves password when updating other fields", async () => {
      const originalUser = await userService.getUserById(user1Id);
      const originalPassword = originalUser.password;
      
      await userService.updateUser(user1Id, { name: "Password Preservation Test" });
      
      const updatedUser = await userService.getUserById(user1Id);
      expect(updatedUser.password).toBe(originalPassword);
    });
  });
});
