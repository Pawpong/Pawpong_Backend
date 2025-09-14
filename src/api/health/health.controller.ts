import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
    @Get()
    getHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'Pawpong Backend',
            version: '1.0.0-MVP',
            environment: process.env.NODE_ENV || 'development',
        };
    }
}
