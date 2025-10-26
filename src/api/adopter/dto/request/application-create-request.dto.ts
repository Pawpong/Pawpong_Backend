import { IsString, IsNotEmpty, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 입양 신청 생성 요청 DTO (Figma 디자인 기반)
 *
 * Figma 상담 신청 폼 구조에 맞춰 재설계된 DTO입니다.
 * 모든 필드는 DB에 저장되며, 브리더가 상세하게 확인할 수 있습니다.
 *
 * 입양자의 기본 정보(이름, 휴대폰, 이메일)는 JWT 토큰에서 자동으로 추출됩니다.
 */
export class ApplicationCreateRequestDto {
    /**
     * 신청할 브리더 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '신청할 브리더 ID',
        example: '507f1f77bcf86cd799439011',
    })
    @IsString()
    @IsNotEmpty()
    breederId: string;

    /**
     * 신청할 반려동물 ID (선택사항 - 전체 상담일 수도 있음)
     * @example "507f1f77bcf86cd799439022"
     */
    @ApiProperty({
        description: '신청할 반려동물 ID (특정 개체 상담인 경우)',
        example: '507f1f77bcf86cd799439022',
        required: false,
    })
    @IsString()
    @IsNotEmpty()
    petId: string;

    /**
     * 개인정보 수집 및 이용 동의 여부 (필수)
     *
     * 수집 항목: 이름, 연락처, 이메일주소 등
     * 이용 목적: 입양자 상담 및 검토
     * 보유 기간: 상담 또는 입양 직후 폐기
     *
     * @example true
     */
    @ApiProperty({
        description: '개인정보 수집 및 이용 동의 여부 (필수)',
        example: true,
    })
    @IsBoolean()
    @IsNotEmpty()
    privacyConsent: boolean;

    /**
     * 자기소개 (최대 1500자)
     *
     * 포함 내용: 성별, 연령대, 거주지, 결혼 계획, 생활 패턴 등
     *
     * @example "안녕하세요. 30대 남성이며 서울 강남구에 거주하고 있습니다. 재택근무를 하고 있어 반려동물과 충분한 시간을 보낼 수 있습니다."
     */
    @ApiProperty({
        description: '자기소개 (성별, 연령대, 거주지, 결혼 계획, 생활 패턴 등)',
        example: '안녕하세요. 30대 남성이며 서울 강남구에 거주하고 있습니다. 재택근무를 하고 있어 반려동물과 충분한 시간을 보낼 수 있습니다.',
        maxLength: 1500,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(1500, { message: '자기소개는 최대 1500자까지 입력 가능합니다.' })
    selfIntroduction: string;

    /**
     * 함께 거주하는 가족 구성원 정보
     *
     * 포함 내용: 인원 수, 관계, 연령대 등
     *
     * @example "총 3명 - 본인(30대), 배우자(30대), 자녀(5세)"
     */
    @ApiProperty({
        description: '함께 거주하는 가족 구성원 정보 (인원 수, 관계, 연령대 등)',
        example: '총 3명 - 본인(30대), 배우자(30대), 자녀(5세)',
    })
    @IsString()
    @IsNotEmpty()
    familyMembers: string;

    /**
     * 모든 가족 구성원의 입양 동의 여부
     *
     * @example true
     */
    @ApiProperty({
        description: '모든 가족 구성원들이 입양에 동의하셨나요?',
        example: true,
    })
    @IsBoolean()
    @IsNotEmpty()
    allFamilyConsent: boolean;

    /**
     * 알러지 검사 정보
     *
     * 포함 내용: 알러지 검사 여부, 결과(유무), 향후 계획
     *
     * @example "본인과 배우자 모두 알러지 검사 완료했으며, 반려동물 알러지 없음"
     */
    @ApiProperty({
        description: '알러지 검사 여부와 결과(유무), 혹은 향후 계획',
        example: '본인과 배우자 모두 알러지 검사 완료했으며, 반려동물 알러지 없음',
    })
    @IsString()
    @IsNotEmpty()
    allergyTestInfo: string;

    /**
     * 평균적으로 집을 비우는 시간
     *
     * 포함 내용: 출퇴근·외출 시간을 포함해 하루 중 집을 비우는 시간
     *
     * @example "주중 9시간(오전 9시~오후 6시), 주말 집에 있음"
     */
    @ApiProperty({
        description: '평균적으로 집을 비우는 시간 (출퇴근·외출 시간 포함)',
        example: '주중 9시간(오전 9시~오후 6시), 주말 집에 있음',
    })
    @IsString()
    @IsNotEmpty()
    timeAwayFromHome: string;

    /**
     * 반려동물과 함께 지낼 공간 소개 (최대 1500자)
     *
     * 포함 내용: 반려동물이 주로 생활할 공간(예: 거실 등)과 환경(크기, 구조 등)
     *
     * ⚠️ 주의: 아이들은 철장, 베란다, 야외 등 열악한 공간에서는 지낼 수 없어요
     *
     * @example "거실과 안방을 자유롭게 이용할 수 있습니다. 거실은 약 20평 크기이며, 캣타워와 스크래처를 설치할 예정입니다."
     */
    @ApiProperty({
        description: '아이와 함께 지낼 공간 소개 (주로 생활할 공간과 환경)',
        example: '거실과 안방을 자유롭게 이용할 수 있습니다. 거실은 약 20평 크기이며, 캣타워와 스크래처를 설치할 예정입니다.',
        maxLength: 1500,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(1500, { message: '거주 공간 소개는 최대 1500자까지 입력 가능합니다.' })
    livingSpaceDescription: string;

    /**
     * 현재 함께하는, 또는 이전에 함께했던 반려동물 정보 (최대 1500자)
     *
     * 포함 내용: 반려동물의 품종, 성격, 함께한 기간, 이별 사유 등
     *
     * @example "5년 전 고양이 한 마리를 키웠습니다. 러시안블루 품종이었으며, 매우 온순한 성격이었습니다. 수명을 다해 무지개다리를 건넜습니다."
     */
    @ApiProperty({
        description: '현재/이전 반려동물 정보 (품종, 성격, 함께한 기간, 이별 사유 등)',
        example: '5년 전 고양이 한 마리를 키웠습니다. 러시안블루 품종이었으며, 매우 온순한 성격이었습니다. 수명을 다해 무지개다리를 건넜습니다.',
        maxLength: 1500,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(1500, { message: '반려동물 경험은 최대 1500자까지 입력 가능합니다.' })
    previousPetExperience: string;
}
