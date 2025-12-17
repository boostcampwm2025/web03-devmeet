import { BaseError } from '@error/error';

export class NullInterfaceError extends BaseError {
  constructor() {
    super({
      message: '비어있는 인터페이스 입니다.',
      status: 500,
    });
  }
}
