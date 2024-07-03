import { CustomError } from "./custom-error";

export class ServerError extends CustomError {
  status = 500;

  constructor() {
    super("Internal server error");
  }

  serializeErrors() {
    return [{ message: "Internal server error" }];
  }
}
