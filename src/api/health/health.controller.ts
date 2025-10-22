import { Controller, Get } from '@nestjs/common';
import { ApiResponseDto } from '../../common/dto/response/api-response.dto';
import { ApiController, ApiEndpoint } from '../../common/decorator/swagger.decorator';
import { HealthCheckResponseDto } from './dto/response/health-check-response.dto';

@ApiController('시스템')
@Controller('health')
export class HealthController {
    @Get()
    @ApiEndpoint({
        summary: '헬스체크',
        description: '시스템 상태를 확인합니다.',
        responseType: HealthCheckResponseDto,
        isPublic: true,
    })
    getHealth(): ApiResponseDto<HealthCheckResponseDto> {
        const healthData: HealthCheckResponseDto = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'Pawpong Backend',
            version: '1.0.0-MVP',
            environment: process.env.NODE_ENV || 'development',
            uptime: Math.floor(process.uptime()),
        };

        return ApiResponseDto.success(healthData, '시스템이 정상 작동 중입니다.');
    }
}
