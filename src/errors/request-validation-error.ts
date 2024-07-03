import { CustomError } from "./custom-error";
import { ValidationError } from "elysia";

export class RequestValidationError extends CustomError {
  constructor(
    private error: ValidationError,
    public status: number = 400
  ) {
    super("Invalid request parameters");
  }

  serializeErrors() {
    return this.error.all.map((err) => {
      return { field: err.path.replace(/^\//, ""), message: err.message };
    });
  }
}
