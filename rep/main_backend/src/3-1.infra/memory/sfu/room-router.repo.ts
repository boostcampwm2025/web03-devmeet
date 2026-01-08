import { Injectable } from '@nestjs/common';
import { RoomRouterRepositoryPort } from '@app/sfu/ports';
import { RoomEntry } from '@app/sfu/commands/dto';


@Injectable()
export class RoomRouterRepository implements RoomRouterRepositoryPort {
  private readonly roomRouters = new Map<string, RoomEntry>();

  get(roomId: string) { return this.roomRouters.get(roomId); }
  set(roomId: string, entry: RoomEntry) { this.roomRouters.set(roomId, entry); }
  delete(roomId: string) { this.roomRouters.delete(roomId); }
}
