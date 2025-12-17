import { NullInterfaceError } from '@error/application/application.error';
import { Injectable } from '@nestjs/common';

class InboundBaseCache<T> {
  protected cache: T;

  constructor(cache: T) {
    this.cache = cache;
  }
}

@Injectable()
export class SelectDataFromCache<T> extends InboundBaseCache<T> {
  constructor(cache: T) {
    super(cache);
  }

  public async select({
    namespace,
    keyName,
  }: {
    namespace: string;
    keyName: string;
  }): Promise<any | undefined> | never {
    throw new NullInterfaceError();
  }
}
