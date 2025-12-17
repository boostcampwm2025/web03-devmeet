import { NullInterfaceError } from '@error/application/application.error';
import { Injectable } from '@nestjs/common';

class OutboundBaseDb<T> {
  protected db: T;

  constructor(db: T) {
    this.db = db;
  }
}

@Injectable()
export class InsertValueToDb<T> extends OutboundBaseDb<T> {
  constructor(db: T) {
    super(db);
  }

  public async insert(entity: any): Promise<boolean> | never {
    throw new NullInterfaceError();
  }
}
