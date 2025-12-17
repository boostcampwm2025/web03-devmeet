import { BaseError } from '../../error';

export class InValidEmailError extends BaseError {
  constructor() {
    super({
      message: '이미 존재하는 이메일 입니다.',
      status: 409,
    });
  }
}

export class NotInvalidOauthUserError extends BaseError {
  constructor() {
    super({
      message: 'oauth 데이터가 존재하지 않습니다.',
      status: 500,
    });
  }
}

export class NotValidEmailError extends BaseError {
  constructor() {
    super({
      message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      status: 401,
    });
  }
}

export class NotAllowPasswordError extends BaseError {
  constructor() {
    super({
      message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      status: 401,
    });
  }
}

export class NotAllowOauthLoginError extends BaseError {
  constructor() {
    super({
      message: '다른 플랫폼으로 로그인 하였습니다.',
      status: 401,
    });
  }
}

export class UnthorizedError extends BaseError {
  constructor(message: string) {
    super({
      message,
      status: 401,
    });
  }
}

export class NotMakeHashValue extends BaseError {
  constructor() {
    super({
      message: '해시값이 생성되지 않았습니다.',
      status: 500,
    });
  }
}
