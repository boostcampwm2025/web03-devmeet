import { BaseError } from '@error/error';

export class EmptyAuthCode extends BaseError {
  constructor() {
    super({
      message:
        '토큰이 담겨져 있지 않습니다. (제대로 redirect가 되지 않았습니다.)',
      status: 400,
    });
  }
}

export class NotGenerateUser extends BaseError {
  constructor() {
    super({
      message: '유저 정보가 업데이트 되지 않았습니다.',
      status: 500,
    });
  }
}
