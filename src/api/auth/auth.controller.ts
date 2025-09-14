import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterAdopterRequestDto } from './dto/request/register-adopter-request.dto';
import { RegisterBreederRequestDto } from './dto/request/register-breeder-request.dto';
import { LoginRequestDto } from './dto/request/login-request.dto';
import { AuthResponseDto } from './dto/response/auth-response.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register/adopter')
    async registerAdopter(@Body() registerAdopterDto: RegisterAdopterRequestDto): Promise<AuthResponseDto> {
        return this.authService.registerAdopter(registerAdopterDto);
    }

    @Post('register/breeder')
    async registerBreeder(@Body() registerBreederDto: RegisterBreederRequestDto): Promise<AuthResponseDto> {
        return this.authService.registerBreeder(registerBreederDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginRequestDto): Promise<AuthResponseDto> {
        return this.authService.login(loginDto);
    }
}
