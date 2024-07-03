export abstract class CustomError extends Error {
  abstract status: number;

  constructor(message: string) {
    super(message);
  }

  abstract serializeErrors(): { message: string; field?: string }[];
}
