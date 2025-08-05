import { database } from "@/database";
import { notes, type Note, type NewNote } from "@/drizzle/schema/notes";
import { teams } from "@/drizzle/schema/teams";
import { teamUser } from "@/drizzle/schema/teamUser";
import { users } from "@/drizzle/schema/users";
import { and, eq, inArray, sql } from "drizzle-orm";
import { BadRequestError } from "@/errors/bad-request-error";

export default class NotesService {
  /**
   * Create a new note
   */
  async createNote(noteData: Omit<NewNote, "id" | "createdAt" | "updatedAt">): Promise<Note> {
    // Verify the team exists and user is a member
    const isTeamMember = await this.isUserTeamMember(noteData.authorId, noteData.teamId);
    if (!isTeamMember) {
      throw new BadRequestError("User is not a member of this team");
    }

    const [createdNote] = await database
      .insert(notes)
      .values({
        ...noteData,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .returning();

    return createdNote;
  }

  /**
   * Get all notes for teams that the user belongs to
   */
  async getNotesByUserId(userId: string): Promise<Note[]> {
    // Get all team IDs the user belongs to
    const userTeams = await database
      .select({ teamId: teamUser.teamId })
      .from(teamUser)
      .where(eq(teamUser.userId, userId));

    if (userTeams.length === 0) {
      return [];
    }

    const teamIds = userTeams.map(team => team.teamId);

    // Get all notes from those teams
    const userNotes = await database
      .select({
        id: notes.id,
        title: notes.title,
        content: notes.content,
        teamId: notes.teamId,
        authorId: notes.authorId,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
        authorName: users.name,
        teamName: teams.name,
      })
      .from(notes)
      .innerJoin(users, eq(notes.authorId, users.id))
      .innerJoin(teams, eq(notes.teamId, teams.id))
      .where(inArray(notes.teamId, teamIds))
      .orderBy(sql`${notes.updatedAt} DESC`);

    return userNotes;
  }

  /**
   * Get notes for a specific team
   */
  async getNotesByTeamId(teamId: string, userId: string): Promise<Note[]> {
    // Verify user is a member of the team
    const isTeamMember = await this.isUserTeamMember(userId, teamId);
    if (!isTeamMember) {
      throw new BadRequestError("User is not a member of this team");
    }

    const teamNotes = await database
      .select({
        id: notes.id,
        title: notes.title,
        content: notes.content,
        teamId: notes.teamId,
        authorId: notes.authorId,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
        authorName: users.name,
        teamName: teams.name,
      })
      .from(notes)
      .innerJoin(users, eq(notes.authorId, users.id))
      .innerJoin(teams, eq(notes.teamId, teams.id))
      .where(eq(notes.teamId, teamId))
      .orderBy(sql`${notes.updatedAt} DESC`);

    return teamNotes;
  }

  /**
   * Get a specific note by ID
   */
  async getNoteById(noteId: string, userId: string): Promise<Note> {
    const note = await database
      .select({
        id: notes.id,
        title: notes.title,
        content: notes.content,
        teamId: notes.teamId,
        authorId: notes.authorId,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
        authorName: users.name,
        teamName: teams.name,
      })
      .from(notes)
      .innerJoin(users, eq(notes.authorId, users.id))
      .innerJoin(teams, eq(notes.teamId, teams.id))
      .where(eq(notes.id, noteId))
      .limit(1);

    if (note.length === 0) {
      throw new BadRequestError("Note not found");
    }

    // Verify user is a member of the team this note belongs to
    const isTeamMember = await this.isUserTeamMember(userId, note[0].teamId);
    if (!isTeamMember) {
      throw new BadRequestError("User is not a member of this team");
    }

    return note[0];
  }

  /**
   * Update a note
   */
  async updateNote(
    noteId: string,
    updateData: Partial<Pick<Note, "title" | "content">>,
    userId: string
  ): Promise<Note> {
    // First get the note to verify it exists and user has access
    const existingNote = await this.getNoteById(noteId, userId);

    const [updatedNote] = await database
      .update(notes)
      .set({
        ...updateData,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(notes.id, noteId))
      .returning();

    return updatedNote;
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId: string, userId: string): Promise<boolean> {
    // First verify the note exists and user has access
    await this.getNoteById(noteId, userId);

    await database
      .delete(notes)
      .where(eq(notes.id, noteId));

    return true;
  }

  /**
   * Check if a user is a member of a team
   */
  async isUserTeamMember(userId: string, teamId: string): Promise<boolean> {
    const membership = await database
      .select({ id: teamUser.id })
      .from(teamUser)
      .where(and(eq(teamUser.userId, userId), eq(teamUser.teamId, teamId)))
      .limit(1);

    return membership.length > 0;
  }
}
