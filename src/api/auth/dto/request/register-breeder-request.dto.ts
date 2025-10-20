import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsEnum,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsOptional,
} from 'class-validator';

/**
 * 브리더 회원가입 요청 DTO
 *
 * 프론트엔드 회원가입 플로우:
 * 1. UserTypeSection: userType 선택 (breeder)
 * 2. AnimalSection: animal 선택 (cat/dog)
 * 3. PlanSection: plan 선택 (basic/pro)
 * 4. UserInfoSection: email, phoneNumber, agreements 입력
 * 5. BreederInfoSection: breederName, breederLocation, breeds, photo 입력
 * 6. DocumentSection: level 선택 및 서류 업로드 (MVP에서는 skip)
 * 7. SignupComplete: 완료
 */
export class RegisterBreederRequestDto {
  /**
   * 이메일 주소
   * @example "breeder@example.com"
   */
  @ApiProperty({
    description: '이메일 주소',
    example: 'breeder@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * 휴대폰 번호 (하이픈 포함)
   * @example "010-1234-5678"
   */
  @ApiProperty({
    description: '휴대폰 번호 (하이픈 포함)',
    example: '010-1234-5678',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  /**
   * 브리더명 (상호명)
   * @example "포포 캐터리"
   */
  @ApiProperty({
    description: '브리더명 (상호명)',
    example: '포포 캐터리',
  })
  @IsString()
  @IsNotEmpty()
  breederName: string;

  /**
   * 브리더 활동 지역
   * @example "서울특별시 강남구"
   */
  @ApiProperty({
    description: '브리더 활동 지역',
    example: '서울특별시 강남구',
  })
  @IsString()
  @IsNotEmpty()
  breederLocation: string;

  /**
   * 브리딩 동물 종류
   * @example "cat"
   */
  @ApiProperty({
    description: '브리딩 동물 종류',
    enum: ['cat', 'dog'],
    example: 'cat',
  })
  @IsEnum(['cat', 'dog'])
  @IsNotEmpty()
  animal: string;

  /**
   * 브리딩 품종 목록 (최대 5개)
   * @example ["페르시안", "샴", "러시안블루"]
   */
  @ApiProperty({
    description: '브리딩 품종 목록 (최대 5개)',
    example: ['페르시안', '샴', '러시안블루'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  breeds: string[];

  /**
   * 플랜 유형
   * @example "basic"
   */
  @ApiProperty({
    description: '플랜 유형',
    enum: ['basic', 'pro'],
    example: 'basic',
  })
  @IsEnum(['basic', 'pro'])
  @IsNotEmpty()
  plan: string;

  /**
   * 브리더 레벨
   * @example "new"
   */
  @ApiProperty({
    description: '브리더 레벨',
    enum: ['elite', 'new'],
    example: 'new',
  })
  @IsEnum(['elite', 'new'])
  @IsNotEmpty()
  level: string;

  /**
   * 서비스 이용약관 동의 여부
   * @example true
   */
  @ApiProperty({
    description: '서비스 이용약관 동의 여부',
    example: true,
  })
  @IsNotEmpty()
  termAgreed: boolean;

  /**
   * 개인정보 수집 및 이용 동의 여부
   * @example true
   */
  @ApiProperty({
    description: '개인정보 수집 및 이용 동의 여부',
    example: true,
  })
  @IsNotEmpty()
  privacyAgreed: boolean;

  /**
   * 광고성 정보 수신 동의 여부 (선택)
   * @example false
   */
  @ApiProperty({
    description: '광고성 정보 수신 동의 여부 (선택)',
    example: false,
    required: false,
  })
  @IsOptional()
  marketingAgreed?: boolean;

  /**
   * 소셜 로그인 임시 ID (선택)
   * @example "temp_google_123456"
   */
  @ApiProperty({
    description: '소셜 로그인 임시 ID (선택)',
    example: 'temp_google_123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  tempId?: string;

  /**
   * 소셜 로그인 제공자 (선택)
   * @example "google"
   */
  @ApiProperty({
    description: '소셜 로그인 제공자 (선택)',
    enum: ['google', 'kakao', 'naver'],
    example: 'google',
    required: false,
  })
  @IsOptional()
  @IsEnum(['google', 'kakao', 'naver'])
  provider?: string;

  /**
   * 프로필 이미지 URL (선택)
   * @example "https://example.com/profile.jpg"
   */
  @ApiProperty({
    description: '프로필 이미지 URL (선택)',
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  profileImage?: string;

  /**
   * 업로드된 인증 서류 URL 배열 (선택)
   * @example ["https://storage.googleapis.com/...", "https://storage.googleapis.com/..."]
   */
  @ApiProperty({
    description: '업로드된 인증 서류 URL 배열 (선택)',
    example: [
      'https://storage.googleapis.com/documents/verification/temp/id_card_123.pdf',
      'https://storage.googleapis.com/documents/verification/temp/license_456.pdf',
    ],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentUrls?: string[];

  /**
   * 업로드된 인증 서류 타입 배열 (선택, documentUrls와 순서 일치)
   * @example ["id_card", "animal_production_license"]
   */
  @ApiProperty({
    description: '업로드된 인증 서류 타입 배열 (선택, documentUrls와 순서 일치)',
    example: ['id_card', 'animal_production_license', 'adoption_contract_sample', 'pedigree', 'breeder_certification'],
    required: false,
    type: [String],
    enum: ['id_card', 'animal_production_license', 'adoption_contract_sample', 'pedigree', 'breeder_certification'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentTypes?: string[];
}
