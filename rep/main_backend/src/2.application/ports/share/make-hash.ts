import { NullInterfaceError } from '@error/application/application.error';
import { Injectable } from '@nestjs/common';

// 해시를 만드는 클래스
@Injectable()
export class MakeHashPort {
  constructor() {}

  public async makeHash(value: string): Promise<string> | never {
    throw new NullInterfaceError();
  }
}
