import { CustomError } from "./custom-error";

export class BadRequestError extends CustomError {
  constructor(
    public message: string,
    public status: number = 400
  ) {
    super(message);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}
