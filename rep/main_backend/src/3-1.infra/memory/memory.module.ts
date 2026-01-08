import { Global, Module } from "@nestjs/common";
import { RoomCreateLockRepo, RoomRouterRepository } from "./sfu";


@Global()
@Module({
  providers : [
    RoomRouterRepository,
    RoomCreateLockRepo
  ],
  exports : [
    RoomRouterRepository,
    RoomCreateLockRepo
  ]
})
export class MemoryModule {};