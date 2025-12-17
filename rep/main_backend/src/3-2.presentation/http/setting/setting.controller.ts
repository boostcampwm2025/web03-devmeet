import { Controller, Get } from '@nestjs/common';

@Controller('api/health')
export class SettingController {
  constructor() {}

  @Get('')
  healthCheck(): Record<string, number> {
    return { status: 200 };
  }
}
