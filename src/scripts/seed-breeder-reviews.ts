#!/usr/bin/env ts-node
/**
 * 브리더 후기 및 반려동물 데이터 시딩 스크립트
 *
 * 실행 방법:
 * npx ts-node src/scripts/seed-breeder-reviews.ts
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * 한국식 반려동물 이름 생성기
 */
const PET_NAMES = {
    dog: ['콩이', '초코', '뭉치', '뽀삐', '해피', '루루', '복실이', '코코', '땅콩', '꼬미', '두부', '보리', '몽이', '호두', '통이'],
    cat: ['나비', '까미', '삼색이', '치즈', '냥이', '야옹이', '깜냥이', '구름', '별이', '달이', '모카', '라떼', '츄츄', '꼬물이', '솜이'],
};

/**
 * 입양자 이름 목록
 */
const ADOPTER_NAMES = ['김민준', '이서연', '박지호', '최수빈', '정예은', '강도윤', '윤하은', '조민서', '장서준', '임지우', '한예준', '오시우', '신채원', '권하린', '송지안'];

/**
 * 후기 내용 템플릿
 */
const REVIEW_TEMPLATES = {
    consultation: [
        '브리더님이 정말 친절하게 상담해주셨어요. 반려동물에 대한 애정이 느껴졌습니다.',
        '시설이 깨끗하고 아이들이 건강해 보여서 안심이 됐습니다.',
        '상담 과정에서 많은 정보를 얻을 수 있었고, 브리더님의 전문성이 돋보였어요.',
        '처음 방문했는데 너무 친절하게 안내해주셨어요. 다음에 또 방문하고 싶습니다.',
        '브리더님께서 반려동물에 대한 열정이 대단하시더라고요. 믿고 분양받을 수 있을 것 같아요.',
    ],
    adoption: [
        '건강하고 예쁜 아이를 분양받았습니다. 너무 감사해요!',
        '분양 후에도 지속적으로 관리해주시고 궁금한 점을 친절하게 답변해주셔서 감사합니다.',
        '우리 집에 온 지 한 달이 됐는데 정말 건강하고 활발해요. 최고의 선택이었습니다!',
        '브리더님 덕분에 소중한 가족을 만났어요. 평생 잘 키우겠습니다.',
        '분양 과정이 매우 체계적이었고, 아이가 정말 건강해서 만족스러워요.',
    ],
};

/**
 * 랜덤 날짜 생성 (과거 N개월 이내)
 */
function getRandomPastDate(monthsAgo: number): Date {
    const now = new Date();
    const randomMonths = Math.floor(Math.random() * monthsAgo);
    const randomDays = Math.floor(Math.random() * 30);
    const date = new Date(now.getFullYear(), now.getMonth() - randomMonths, now.getDate() - randomDays);
    return date;
}

/**
 * 랜덤 미래 날짜 생성 (N개월 이전에 태어남)
 */
function getRandomBirthDate(ageInMonths: number): Date {
    const now = new Date();
    const birthDate = new Date(now.getFullYear(), now.getMonth() - ageInMonths, now.getDate());
    return birthDate;
}

/**
 * 분양 가능한 반려동물 데이터 생성
 */
export function generateAvailablePets(petType: 'dog' | 'cat', breed: string, priceRange: { min: number; max: number }, count: number = 3) {
    const pets: any[] = [];
    const names = PET_NAMES[petType];
    const statuses = ['available', 'available', 'available', 'reserved'];

    for (let i = 0; i < count; i++) {
        const name = names[Math.floor(Math.random() * names.length)];
        const gender = Math.random() > 0.5 ? 'male' : 'female';
        const ageInMonths = Math.floor(Math.random() * 6) + 2; // 2~8개월
        const birthDate = getRandomBirthDate(ageInMonths);
        const price = Math.floor(Math.random() * (priceRange.max - priceRange.min)) + priceRange.min;
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        pets.push({
            petId: uuidv4(),
            name,
            breed,
            gender,
            birthDate,
            price,
            status,
            photos: [
                `https://picsum.photos/seed/${petType}-${breed}-pet-${i}-1/600/400`,
                `https://picsum.photos/seed/${petType}-${breed}-pet-${i}-2/600/400`,
            ],
            isActive: true,
        });
    }

    return pets;
}

/**
 * 부모 반려동물 데이터 생성
 */
export function generateParentPets(petType: 'dog' | 'cat', breed: string, count: number = 2) {
    const pets: any[] = [];
    const names = PET_NAMES[petType];

    for (let i = 0; i < count; i++) {
        const gender = i === 0 ? 'female' : 'male'; // 첫 번째는 어미, 두 번째는 수컷
        const name = names[Math.floor(Math.random() * names.length)];
        const age = Math.floor(Math.random() * 4) + 2; // 2~6살

        pets.push({
            petId: uuidv4(),
            name,
            breed,
            gender,
            age,
            photos: [
                `https://picsum.photos/seed/${petType}-${breed}-parent-${i}-1/600/400`,
                `https://picsum.photos/seed/${petType}-${breed}-parent-${i}-2/600/400`,
            ],
            isActive: true,
        });
    }

    return pets;
}

/**
 * 후기 데이터 생성
 */
export function generateReviews(count: number = 5) {
    const reviews: any[] = [];
    const types: ('consultation' | 'adoption')[] = ['consultation', 'adoption'];

    for (let i = 0; i < count; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const adopterName = ADOPTER_NAMES[Math.floor(Math.random() * ADOPTER_NAMES.length)];
        const rating = Math.random() > 0.3 ? 5 : 4; // 70% chance of 5 stars
        const contentTemplates = REVIEW_TEMPLATES[type];
        const content = contentTemplates[Math.floor(Math.random() * contentTemplates.length)];
        const writtenAt = getRandomPastDate(12); // 지난 12개월 이내
        const hasPhoto = Math.random() > 0.6;

        reviews.push({
            reviewId: uuidv4(),
            writtenAt,
            type,
            adopterName,
            rating,
            content,
            photos: hasPhoto ? [`https://picsum.photos/seed/review-${i}/600/400`] : [],
            isVisible: true,
        });
    }

    // 최신순 정렬
    return reviews.sort((a, b) => b.writtenAt.getTime() - a.writtenAt.getTime());
}

// 테스트 실행
if (require.main === module) {
    console.log('=== Available Pets (Dog) ===');
    console.log(JSON.stringify(generateAvailablePets('dog', '말티즈', { min: 2000000, max: 3000000 }, 3), null, 2));

    console.log('\n=== Parent Pets (Dog) ===');
    console.log(JSON.stringify(generateParentPets('dog', '말티즈', 2), null, 2));

    console.log('\n=== Reviews ===');
    console.log(JSON.stringify(generateReviews(5), null, 2));
}
