export class BaseError extends Error {
  public readonly message: string;
  public readonly status: number;

  constructor({ message, status }: { message: string; status: number }) {
    super();
    this.message = message;
    this.status = status;
  }
}
