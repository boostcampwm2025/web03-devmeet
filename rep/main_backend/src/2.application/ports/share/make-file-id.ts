import { NullInterfaceError } from '@error/application/application.error';
import { Injectable } from '@nestjs/common';

// file_id를 만들어준다.
@Injectable()
export class MakeFileIdPort {
  constructor() {}

  public make(): string | never {
    throw new NullInterfaceError();
  }
}
