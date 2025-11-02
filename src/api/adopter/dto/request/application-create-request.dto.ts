import { IsString, IsNotEmpty, IsBoolean, MaxLength, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * 커스텀 질문 응답 DTO
 */
export class CustomQuestionAnswerDto {
    /**
     * 질문 ID (브리더가 설정한 커스텀 질문의 ID)
     * @example "custom_visit_time"
     */
    @ApiProperty({
        description: '브리더가 설정한 커스텀 질문 ID',
        example: 'custom_visit_time',
    })
    @IsString()
    @IsNotEmpty()
    questionId: string;

    /**
     * 응답 값
     * - text/textarea: string
     * - select/radio: string
     * - checkbox: string[] (배열)
     * - file: string (파일명)
     *
     * @example "오후 (13:00-17:00)"
     */
    @ApiProperty({
        description: '질문에 대한 응답 (타입에 따라 string 또는 string[])',
        example: '오후 (13:00-17:00)',
    })
    answer: any;
}

/**
 * 입양 신청 생성 요청 DTO (Figma 디자인 기반 + 커스텀 질문)
 *
 * **구조:**
 * - 표준 14개 필드: 모든 브리더 공통 (필수)
 * - 커스텀 응답: 해당 브리더가 추가한 질문들 (선택/필수 혼합)
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
     * @example "5년 전 고양이 한 마리를 키웠습니다. 러시안블루 품종이었으며, 매우 온순한 성격이었습니다. 수명을 다해 무지개다리를 건넸습니다."
     */
    @ApiProperty({
        description: '현재/이전 반려동물 정보 (품종, 성격, 함께한 기간, 이별 사유 등)',
        example: '5년 전 고양이 한 마리를 키웠습니다. 러시안블루 품종이었으며, 매우 온순한 성격이었습니다. 수명을 다해 무지개다리를 건넸습니다.',
        maxLength: 1500,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(1500, { message: '반려동물 경험은 최대 1500자까지 입력 가능합니다.' })
    previousPetExperience: string;

    /**
     * 기본 케어 책임 가능 여부
     *
     * 정기 예방접종·건강검진·훈련 등 기본 케어를 책임지고 제공할 수 있는지 확인
     *
     * @example true
     */
    @ApiProperty({
        description: '정기 예방접종·건강검진·훈련 등 기본 케어를 책임지고 해주실 수 있나요?',
        example: true,
    })
    @IsBoolean()
    @IsNotEmpty()
    canProvideBasicCare: boolean;

    /**
     * 치료비 감당 가능 여부
     *
     * 예상치 못한 질병이나 사고로 인한 치료비 발생 시 감당 가능한지 확인
     *
     * @example true
     */
    @ApiProperty({
        description: '예상치 못한 질병이나 사고 등으로 치료비가 발생할 경우 감당 가능하신가요?',
        example: true,
    })
    @IsBoolean()
    @IsNotEmpty()
    canAffordMedicalExpenses: boolean;

    /**
     * 중성화 동의 여부
     *
     * 모든 아이들은 중성화 후 분양되거나, 입양 후 중성화를 진행해야 합니다
     *
     * @example true
     */
    @ApiProperty({
        description: '모든 아이들은 중성화 후 분양되거나, 입양 후 중성화를 진행해야 합니다. 동의하십니까?',
        example: true,
    })
    @IsBoolean()
    @IsNotEmpty()
    neuteringConsent: boolean;

    /**
     * 마음에 두신 아이 또는 원하는 특징 (선택사항, 최대 1500자)
     *
     * 특정 아이가 있거나, 원하는 특징(성별, 타입, 외모, 컬러패턴, 성격 등)을 자유롭게 기술
     *
     * @example "활발하고 사람을 좋아하는 포메라니안을 찾고 있습니다. 크림색 털을 가진 아이면 좋겠습니다."
     */
    @ApiProperty({
        description: '마음에 두신 아이가 있으신가요? (특징: 성별, 타입, 외모, 컬러패턴, 성격 등)',
        example: '활발하고 사람을 좋아하는 포메라니안을 찾고 있습니다.',
        maxLength: 1500,
        required: false,
    })
    @IsString()
    @MaxLength(1500, { message: '선호 반려동물 설명은 최대 1500자까지 입력 가능합니다.' })
    preferredPetDescription?: string;

    /**
     * 원하는 입양 시기 (선택사항)
     *
     * 입양 희망 시기를 자유롭게 기술
     *
     * @example "2개월 후 (2025년 3월 예정)"
     */
    @ApiProperty({
        description: '원하시는 입양 시기가 있나요?',
        example: '2개월 후 (2025년 3월 예정)',
        required: false,
    })
    @IsString()
    desiredAdoptionTiming?: string;

    /**
     * 추가 문의사항 또는 남기고 싶은 말씀 (선택사항, 최대 1500자)
     *
     * 마지막으로 궁금한 점이나 브리더에게 전하고 싶은 메시지
     *
     * @example "첫 입양이라 많이 긴장되지만, 좋은 가족이 되도록 최선을 다하겠습니다."
     */
    @ApiProperty({
        description: '마지막으로 궁금하신 점이나 남기시고 싶으신 말씀이 있나요?',
        example: '첫 입양이라 많이 긴장되지만, 좋은 가족이 되도록 최선을 다하겠습니다.',
        maxLength: 1500,
        required: false,
    })
    @IsString()
    @MaxLength(1500, { message: '추가 문의사항은 최대 1500자까지 입력 가능합니다.' })
    additionalNotes?: string;

    /**
     * 커스텀 질문 응답 배열 (브리더가 추가한 질문들)
     *
     * 브리더가 설정한 추가 질문에 대한 응답입니다.
     * 각 브리더마다 다른 질문을 설정할 수 있습니다.
     *
     * @example [
     *   { questionId: "custom_visit_time", answer: "오후 (13:00-17:00)" },
     *   { questionId: "custom_pet_preference", answer: "활발하고 사람을 좋아하는 성격" }
     * ]
     */
    @ApiProperty({
        description: '브리더가 추가한 커스텀 질문에 대한 응답 배열',
        type: [CustomQuestionAnswerDto],
        required: false,
        example: [
            { questionId: 'custom_visit_time', answer: '오후 (13:00-17:00)' },
            { questionId: 'custom_pet_preference', answer: '활발하고 사람을 좋아하는 성격' },
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CustomQuestionAnswerDto)
    @IsOptional()
    customResponses?: CustomQuestionAnswerDto[];
}
