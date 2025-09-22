import { Controller, Get } from '@nestjs/common';
import { ApiResponseDto } from '../../common/dto/response/api-response.dto';
import { ApiController, ApiEndpoint } from '../../common/decorator/swagger.decorator';

/**
 * 시스템 헬스체크 응답 데이터 타입
 */
interface HealthCheckData {
    status: string;
    timestamp: string;
    service: string;
    version: string;
    environment: string;
    uptime: number;
}

@ApiController('시스템')
@Controller('health')
export class HealthController {
    @Get()
    @ApiEndpoint({
        summary: '헬스체크',
        description: '시스템 상태를 확인합니다.',
        isPublic: true,
    })
    getHealth(): ApiResponseDto<HealthCheckData> {
        const healthData: HealthCheckData = {
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
