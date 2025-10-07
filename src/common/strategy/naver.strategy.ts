import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-naver';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
    constructor(private readonly configService: ConfigService) {
        super({
            clientID: configService.get<string>('NAVER_CLIENT_ID'),
            clientSecret: configService.get<string>('NAVER_CLIENT_SECRET'),
            callbackURL: configService.get<string>('NAVER_CALLBACK_URL'),
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: any, done: any): Promise<any> {
        const { id, email, nickname, profile_image } = profile._json;

        const user = {
            provider: 'naver',
            providerId: id,
            email: email,
            name: nickname || email.split('@')[0],
            profileImage: profile_image,
        };

        done(null, user);
    }
}