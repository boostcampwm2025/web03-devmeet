import { BaseError } from "../../error";


export class NotFoundRefereceError extends BaseError {
  constructor(message: string) {
    super({
      message, status : 404
    });
    this.name = "NotFoundError";
  }
}