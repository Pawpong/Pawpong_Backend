import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import CoolsmsMessageService from 'coolsms-node-sdk';
import { Adopter, AdopterDocument } from '../../schema/adopter.schema';
import { Breeder, BreederDocument } from '../../schema/breeder.schema';

interface VerificationCode {
    phone: string;
    code: string;
    expiresAt: Date;
    attempts: number;
    verified: boolean;
}

@Injectable()
export class SmsService {
    private readonly messageService: CoolsmsMessageService;
    private verificationCodes: Map<string, VerificationCode> = new Map();
    private readonly MAX_ATTEMPTS = 5;
    private readonly CODE_EXPIRY_MINUTES = 3;

    constructor(
        private readonly configService: ConfigService,
        @InjectModel(Adopter.name) private adopterModel: Model<AdopterDocument>,
        @InjectModel(Breeder.name) private breederModel: Model<BreederDocument>,
    ) {
        const apiKey = this.configService.get<string>('COOLSMS_API_KEY');
        const apiSecret = this.configService.get<string>('COOLSMS_API_SECRET');

        if (apiKey && apiSecret) {
            this.messageService = new CoolsmsMessageService(apiKey, apiSecret);
        }
    }

    async sendVerificationCode(phone: string): Promise<{ success: boolean; message: string }> {
        const normalizedPhone = this.normalizePhoneNumber(phone);

        // 전화번호 중복 체크 (입양자 + 브리더)
        const existingAdopter = await this.adopterModel.findOne({ phoneNumber: normalizedPhone }).exec();
        if (existingAdopter) {
            throw new BadRequestException('이미 등록된 전화번호입니다.');
        }

        const existingBreeder = await this.breederModel.findOne({ phone: normalizedPhone }).exec();
        if (existingBreeder) {
            throw new BadRequestException('이미 등록된 전화번호입니다.');
        }

        const existingCode = this.verificationCodes.get(normalizedPhone);
        if (existingCode && !this.isExpired(existingCode.expiresAt)) {
            const remainingTime = Math.ceil(
                (existingCode.expiresAt.getTime() - Date.now()) / 1000 / 60
            );
            throw new BadRequestException(
                `이미 발송된 인증코드가 있습니다. ${remainingTime}분 후에 재발송 가능합니다.`
            );
        }

        const verificationCode = this.generateVerificationCode();
        const expiresAt = new Date(Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000);

        try {
            if (!this.messageService) {
                throw new InternalServerErrorException('SMS 서비스가 설정되지 않았습니다.');
            }

            const senderPhone = this.configService.get<string>('COOLSMS_SENDER_PHONE');

            if (!senderPhone) {
                throw new InternalServerErrorException('발신번호가 설정되지 않았습니다.');
            }

            const messageContent = `[Pawpong]\n인증번호는 ${verificationCode}입니다.\n${this.CODE_EXPIRY_MINUTES}분 내에 입력해주세요.`;

            await this.messageService.sendOne({
                to: normalizedPhone,
                from: senderPhone,
                text: messageContent,
                autoTypeDetect: true,
            });

            this.verificationCodes.set(normalizedPhone, {
                phone: normalizedPhone,
                code: verificationCode,
                expiresAt,
                attempts: 0,
                verified: false,
            });

            return {
                success: true,
                message: '인증번호가 발송되었습니다.',
            };
        } catch (error) {
            console.error('SMS 발송 실패:', error);
            throw new InternalServerErrorException('인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
        }
    }

    async verifyCode(phone: string, code: string): Promise<{ success: boolean; message: string }> {
        const normalizedPhone = this.normalizePhoneNumber(phone);
        const verification = this.verificationCodes.get(normalizedPhone);

        if (!verification) {
            throw new BadRequestException('인증번호를 먼저 요청해주세요.');
        }

        if (verification.verified) {
            throw new BadRequestException('이미 인증이 완료되었습니다.');
        }

        if (this.isExpired(verification.expiresAt)) {
            this.verificationCodes.delete(normalizedPhone);
            throw new BadRequestException('인증번호가 만료되었습니다. 다시 요청해주세요.');
        }

        verification.attempts++;

        if (verification.attempts > this.MAX_ATTEMPTS) {
            this.verificationCodes.delete(normalizedPhone);
            throw new BadRequestException('인증 시도 횟수를 초과했습니다. 다시 요청해주세요.');
        }

        if (verification.code !== code) {
            throw new BadRequestException(
                `인증번호가 일치하지 않습니다. (${verification.attempts}/${this.MAX_ATTEMPTS})`
            );
        }

        verification.verified = true;

        return {
            success: true,
            message: '전화번호 인증이 완료되었습니다.',
        };
    }

    isPhoneVerified(phone: string): boolean {
        const normalizedPhone = this.normalizePhoneNumber(phone);
        const verification = this.verificationCodes.get(normalizedPhone);

        return verification?.verified === true && !this.isExpired(verification.expiresAt);
    }

    clearVerification(phone: string): void {
        const normalizedPhone = this.normalizePhoneNumber(phone);
        this.verificationCodes.delete(normalizedPhone);
    }

    private generateVerificationCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    private normalizePhoneNumber(phone: string): string {
        const cleaned = phone.replace(/[^0-9]/g, '');

        if (!cleaned.match(/^01[0-9]{8,9}$/)) {
            throw new BadRequestException('올바른 전화번호 형식이 아닙니다.');
        }

        return cleaned;
    }

    private isExpired(expiresAt: Date): boolean {
        return expiresAt.getTime() < Date.now();
    }

    cleanupExpiredCodes(): void {
        const now = Date.now();
        for (const [phone, verification] of this.verificationCodes.entries()) {
            if (verification.expiresAt.getTime() < now) {
                this.verificationCodes.delete(phone);
            }
        }
    }
}