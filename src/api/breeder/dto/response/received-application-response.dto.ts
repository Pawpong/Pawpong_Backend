import { ApiProperty } from '@nestjs/swagger';

/**
 * 신청 폼 데이터 (Figma 디자인 기반)
 *
 * 브리더가 확인할 수 있는 입양자의 신청 폼 상세 정보입니다.
 */
export class ApplicationFormDataDto {
    /**
     * 개인정보 수집 및 이용 동의 여부
     * @example true
     */
    @ApiProperty({
        description: '개인정보 수집 및 이용 동의 여부',
        example: true,
    })
    privacyConsent: boolean;

    /**
     * 자기소개
     * @example "안녕하세요. 30대 남성이며 서울 강남구에 거주하고 있습니다. 재택근무를 하고 있어 반려동물과 충분한 시간을 보낼 수 있습니다."
     */
    @ApiProperty({
        description: '자기소개 (성별, 연령대, 거주지, 결혼 계획, 생활 패턴 등)',
        example: '안녕하세요. 30대 남성이며 서울 강남구에 거주하고 있습니다. 재택근무를 하고 있어 반려동물과 충분한 시간을 보낼 수 있습니다.',
    })
    selfIntroduction: string;

    /**
     * 함께 거주하는 가족 구성원 정보
     * @example "총 3명 - 본인(30대), 배우자(30대), 자녀(5세)"
     */
    @ApiProperty({
        description: '가족 구성원 정보',
        example: '총 3명 - 본인(30대), 배우자(30대), 자녀(5세)',
    })
    familyMembers: string;

    /**
     * 모든 가족 구성원의 입양 동의 여부
     * @example true
     */
    @ApiProperty({
        description: '모든 가족 구성원의 입양 동의 여부',
        example: true,
    })
    allFamilyConsent: boolean;

    /**
     * 알러지 검사 정보
     * @example "본인과 배우자 모두 알러지 검사 완료했으며, 반려동물 알러지 없음"
     */
    @ApiProperty({
        description: '알러지 검사 정보',
        example: '본인과 배우자 모두 알러지 검사 완료했으며, 반려동물 알러지 없음',
    })
    allergyTestInfo: string;

    /**
     * 평균적으로 집을 비우는 시간
     * @example "주중 9시간(오전 9시~오후 6시), 주말 집에 있음"
     */
    @ApiProperty({
        description: '집을 비우는 시간',
        example: '주중 9시간(오전 9시~오후 6시), 주말 집에 있음',
    })
    timeAwayFromHome: string;

    /**
     * 반려동물과 함께 지낼 공간 소개
     * @example "거실과 안방을 자유롭게 이용할 수 있습니다. 거실은 약 20평 크기이며, 캣타워와 스크래처를 설치할 예정입니다."
     */
    @ApiProperty({
        description: '거주 공간 소개',
        example: '거실과 안방을 자유롭게 이용할 수 있습니다. 거실은 약 20평 크기이며, 캣타워와 스크래처를 설치할 예정입니다.',
    })
    livingSpaceDescription: string;

    /**
     * 현재/이전 반려동물 정보
     * @example "5년 전 고양이 한 마리를 키웠습니다. 러시안블루 품종이었으며, 매우 온순한 성격이었습니다. 수명을 다해 무지개다리를 건넜습니다."
     */
    @ApiProperty({
        description: '반려동물 경험',
        example: '5년 전 고양이 한 마리를 키웠습니다. 러시안블루 품종이었으며, 매우 온순한 성격이었습니다. 수명을 다해 무지개다리를 건넜습니다.',
    })
    previousPetExperience: string;
}

/**
 * 받은 입양 신청 응답 DTO (Figma 디자인 기반)
 *
 * 브리더가 받은 입양 신청 목록을 조회할 때 사용됩니다.
 */
export class ReceivedApplicationResponseDto {
    /**
     * 입양 신청 고유 ID
     * @example "507f1f77bcf86cd799439088"
     */
    @ApiProperty({
        description: '입양 신청 고유 ID',
        example: '507f1f77bcf86cd799439088',
    })
    applicationId: string;

    /**
     * 입양자 고유 ID
     * @example "507f1f77bcf86cd799439044"
     */
    @ApiProperty({
        description: '입양자 고유 ID',
        example: '507f1f77bcf86cd799439044',
    })
    adopterId: string;

    /**
     * 입양자 이름
     * @example "김입양"
     */
    @ApiProperty({
        description: '입양자 이름',
        example: '김입양',
    })
    adopterName: string;

    /**
     * 입양자 이메일
     * @example "adopter@example.com"
     */
    @ApiProperty({
        description: '입양자 이메일',
        example: 'adopter@example.com',
    })
    adopterEmail: string;

    /**
     * 입양자 휴대폰 번호
     * @example "01012345678"
     */
    @ApiProperty({
        description: '입양자 휴대폰 번호',
        example: '01012345678',
    })
    adopterPhone: string;

    /**
     * 신청한 반려동물 ID (있는 경우)
     * @example "507f1f77bcf86cd799439099"
     */
    @ApiProperty({
        description: '신청한 반려동물 ID',
        example: '507f1f77bcf86cd799439099',
        required: false,
    })
    petId?: string;

    /**
     * 신청한 반려동물 이름 (있는 경우)
     * @example "루이"
     */
    @ApiProperty({
        description: '신청한 반려동물 이름',
        example: '루이',
        required: false,
    })
    petName?: string;

    /**
     * 신청 처리 상태
     * @example "consultation_pending"
     */
    @ApiProperty({
        description: '신청 처리 상태',
        example: 'consultation_pending',
        enum: ['consultation_pending', 'consultation_completed', 'adoption_approved', 'adoption_rejected'],
    })
    status: string;

    /**
     * 입양 신청서 상세 데이터 (Figma 디자인 기반)
     */
    @ApiProperty({
        description: '입양 신청서 상세 데이터',
        type: ApplicationFormDataDto,
    })
    applicationData: ApplicationFormDataDto;

    /**
     * 신청 접수 일시
     * @example "2024-01-15T10:30:00.000Z"
     */
    @ApiProperty({
        description: '신청 접수 일시',
        example: '2024-01-15T10:30:00.000Z',
        format: 'date-time',
    })
    appliedAt: string;

    /**
     * 신청 처리 일시 (처리 완료 시)
     * @example "2024-01-16T15:45:00.000Z"
     */
    @ApiProperty({
        description: '신청 처리 일시',
        example: '2024-01-16T15:45:00.000Z',
        format: 'date-time',
        required: false,
    })
    processedAt?: string;

    /**
     * 브리더 메모 (내부 참고용)
     * @example "면담 후 최종 결정 예정"
     */
    @ApiProperty({
        description: '브리더 메모',
        example: '면담 후 최종 결정 예정',
        required: false,
    })
    breederNotes?: string;
}
