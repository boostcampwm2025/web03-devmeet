import { NullInterfaceError } from '@error/application/application.error';
import { Payload, TokenDto } from '@app/auth/commands/dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TokenIssuer {
  constructor() {}

  public async makeIssuer(payload: any): Promise<TokenDto> | never {
    throw new NullInterfaceError();
  }

  public async makeToken(payload: any): Promise<string> | never {
    throw new NullInterfaceError();
  }

  public async tokenVerify(token: string): Promise<Payload> | never {
    throw new NullInterfaceError();
  }
}
