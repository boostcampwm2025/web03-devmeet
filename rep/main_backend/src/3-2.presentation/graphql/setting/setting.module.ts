import { Module } from "@nestjs/common";
import { SettingResolver } from "./setting.resolver";


@Module({
  providers : [SettingResolver]
})
export class SettingGraphqlModule {};