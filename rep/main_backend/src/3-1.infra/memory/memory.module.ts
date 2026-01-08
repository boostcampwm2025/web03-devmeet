import { Module } from "@nestjs/common";
import { InMemoryRoomCreateLock, RoomRouterRepository } from "./sfu";


@Module({
  providers : [
    RoomRouterRepository,
    InMemoryRoomCreateLock
  ],
  exports : [
    RoomRouterRepository,
    InMemoryRoomCreateLock
  ]
})
export class MemoryModule {};