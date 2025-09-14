import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { BreederService } from './breeder.service';
import { BreederSearchRequestDto } from './dto/request/breederSearch-request.dto';
import { BreederSearchResponseDto } from './dto/response/breeder-search-response.dto';
import { BreederProfileResponseDto } from './dto/response/breeder-profileresponse.dto';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { CurrentUser } from '../../common/decorator/user.decorator';

@Controller('breeder')
export class BreederController {
    constructor(private readonly breederService: BreederService) {}

    @Get('search')
    async searchBreeders(@Query() searchDto: BreederSearchRequestDto): Promise<BreederSearchResponseDto> {
        return this.breederService.searchBreeders(searchDto);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async getBreederProfile(
        @Param('id') breederId: string,
        @CurrentUser() user: any,
    ): Promise<BreederProfileResponseDto> {
        return this.breederService.getBreederProfile(breederId, user.userId);
    }
}
