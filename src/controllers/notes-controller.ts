import { Elysia } from "elysia";
import { currentUser } from "@/middleware/current-user";
import { services } from "@/service";
import { createNoteRequest } from "@/requests/notes/create-note-request";
import { updateNoteRequest } from "@/requests/notes/update-note-request";
import { BadRequestError } from "@/errors/bad-request-error";

export const notesController = new Elysia({
  detail: {
    tags: ["Notes"],
  },
})
  .use(currentUser)
  .use(services)

  /**
   * Get all notes for a specific team
   */
  .get(
    "/teams/:id/notes",
    async ({ params, currentUser, notesService }) => {
      try {
        const notes = await notesService.getNotesByTeamId(params.id, currentUser.id);

        return {
          success: true,
          data: notes,
        };
      } catch (error) {
        if (error instanceof BadRequestError) {
          throw error;
        }
        throw new BadRequestError("Failed to fetch notes");
      }
    }
  )

  /**
   * Get a specific note by ID
   */
  .get(
    "/teams/:id/notes/:noteId",
    async ({ params, currentUser, set, notesService }) => {
      try {
        const note = await notesService.getNoteById(params.noteId, currentUser.id);

        return {
          success: true,
          data: note,
        };
      } catch (error) {
        if (error instanceof BadRequestError) {
          if (error.message === "Note not found") {
            set.status = 404;
            return {
              success: false,
              message: "Note not found",
            };
          }
          if (error.message === "User is not a member of this team") {
            set.status = 403;
            return {
              success: false,
              message: "Access denied: User is not a member of this team",
            };
          }
          throw error;
        }
        throw new BadRequestError("Failed to fetch note");
      }
    }
  )

  /**
   * Create a new note
   */
  .post(
    "/teams/:id/notes",
    async ({ params, body, currentUser, set, notesService }) => {
      try {
        const noteData = {
          title: body.title,
          content: body.content,
          teamId: params.id,
          authorId: currentUser.id,
        };

        const note = await notesService.createNote(noteData);

        set.status = 201;
        return {
          success: true,
          data: note,
        };
      } catch (error) {
        if (error instanceof BadRequestError) {
          if (error.message === "User is not a member of this team") {
            set.status = 403;
            return {
              success: false,
              message: "Access denied: User is not a member of this team",
            };
          }
          throw error;
        }
        throw new BadRequestError("Failed to create note");
      }
    },
    {
      body: createNoteRequest,
    }
  )

  /**
   * Update a note
   */
  .put(
    "/teams/:id/notes/:noteId",
    async ({ params, body, currentUser, set, notesService }) => {
      try {
        const updateData: any = {};
        if (body.title !== undefined) updateData.title = body.title;
        if (body.content !== undefined) updateData.content = body.content;

        const updatedNote = await notesService.updateNote(
          params.noteId,
          updateData,
          currentUser.id
        );

        return {
          success: true,
          data: updatedNote,
        };
      } catch (error) {
        if (error instanceof BadRequestError) {
          if (error.message === "Note not found") {
            set.status = 404;
            return {
              success: false,
              message: "Note not found",
            };
          }
          if (error.message === "User is not a member of this team") {
            set.status = 403;
            return {
              success: false,
              message: "Access denied: User is not a member of this team",
            };
          }
          throw error;
        }
        throw new BadRequestError("Failed to update note");
      }
    },
    {
      body: updateNoteRequest,
    }
  )

  /**
   * Delete a note
   */
  .delete(
    "/teams/:id/notes/:noteId",
    async ({ params, currentUser, set, notesService }) => {
      try {
        await notesService.deleteNote(params.noteId, currentUser.id);

        return {
          success: true,
          message: "Note deleted successfully",
        };
      } catch (error) {
        if (error instanceof BadRequestError) {
          if (error.message === "Note not found") {
            set.status = 404;
            return {
              success: false,
              message: "Note not found",
            };
          }
          if (error.message === "User is not a member of this team") {
            set.status = 403;
            return {
              success: false,
              message: "Access denied: User is not a member of this team",
            };
          }
          throw error;
        }
        throw new BadRequestError("Failed to delete note");
      }
    }
  );
