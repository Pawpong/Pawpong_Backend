#!/usr/bin/env ts-node
/**
 * 브리더 목업 데이터에 availablePets, parentPets, reviews 추가 스크립트
 */

import * as fs from 'fs';
import * as path from 'path';

// 반려동물 이름 풀
const PET_NAMES = {
    dog: ['콩이', '초코', '뭉치', '뽀삐', '해피', '루루', '복실이', '코코', '땅콩', '꼬미', '두부', '보리', '몽이', '호두', '통이', '깜이', '뚱이', '별이', '달이', '구름이'],
    cat: ['나비', '까미', '삼색이', '치즈', '냥이', '야옹이', '깜냥이', '구름', '별이', '달이', '모카', '라떼', '츄츄', '꼬물이', '솜이', '순이', '돌이', '복이', '뭉치', '꼬미'],
};

const ADOPTER_NAMES = ['김민준', '이서연', '박지호', '최수빈', '정예은', '강도윤', '윤하은', '조민서', '장서준', '임지우', '한예준', '오시우', '신채원', '권하린', '송지안', '배서현', '홍주원', '노예린', '서민재', '황지후'];

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
        '브리더님이 정말 친절하시고 분양 후에도 계속 연락주셔서 감동받았어요.',
    ],
};

function getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(monthsAgo: number): Date {
    const now = new Date();
    const randomDays = Math.floor(Math.random() * monthsAgo * 30);
    return new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);
}

function getBirthDate(ageInMonths: number): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - ageInMonths, now.getDate());
}

function generateAvailablePets(petType: 'dog' | 'cat', breed: string, priceRange: { min: number; max: number }, index: number) {
    const count = Math.floor(Math.random() * 2) + 2; // 2-3 pets
    const pets: any[] = [];
    const usedNames = new Set<string>();

    for (let i = 0; i < count; i++) {
        let name = getRandomItem(PET_NAMES[petType]);
        while (usedNames.has(name)) {
            name = getRandomItem(PET_NAMES[petType]);
        }
        usedNames.add(name);

        const gender = Math.random() > 0.5 ? 'male' : 'female';
        const ageInMonths = Math.floor(Math.random() * 5) + 2; // 2-6개월
        const birthDate = getBirthDate(ageInMonths);
        const price = Math.floor(Math.random() * (priceRange.max - priceRange.min)) + priceRange.min;
        const status = i === count - 1 && Math.random() > 0.6 ? 'reserved' : 'available';

        pets.push({
            petId: `pet-${breed.replace(/\s+/g, '')}-${index}-${i + 1}`,
            name,
            breed,
            gender,
            birthDate,
            price,
            status,
            photos: [
                `https://picsum.photos/seed/${petType}-${breed}-pet-${index}-${i}-1/600/400`,
                `https://picsum.photos/seed/${petType}-${breed}-pet-${index}-${i}-2/600/400`,
            ],
            isActive: true,
        });
    }

    return pets;
}

function generateParentPets(petType: 'dog' | 'cat', breed: string, index: number) {
    const pets: any[] = [];
    const usedNames = new Set<string>();

    for (let i = 0; i < 2; i++) {
        let name = getRandomItem(PET_NAMES[petType]);
        while (usedNames.has(name)) {
            name = getRandomItem(PET_NAMES[petType]);
        }
        usedNames.add(name);

        const gender = i === 0 ? 'female' : 'male';
        const age = Math.floor(Math.random() * 4) + 2; // 2-6살

        pets.push({
            petId: `parent-${breed.replace(/\s+/g, '')}-${index}-${i + 1}`,
            name,
            breed,
            gender,
            age,
            photos: [
                `https://picsum.photos/seed/${petType}-${breed}-parent-${index}-${i}-1/600/400`,
                `https://picsum.photos/seed/${petType}-${breed}-parent-${index}-${i}-2/600/400`,
            ],
            isActive: true,
        });
    }

    return pets;
}

function generateReviews(breed: string, index: number) {
    const count = Math.floor(Math.random() * 3) + 3; // 3-5 reviews
    const reviews: any[] = [];
    const usedNames = new Set<string>();

    for (let i = 0; i < count; i++) {
        let adopterName = getRandomItem(ADOPTER_NAMES);
        while (usedNames.has(adopterName)) {
            adopterName = getRandomItem(ADOPTER_NAMES);
        }
        usedNames.add(adopterName);

        const type = getRandomItem(['consultation', 'adoption'] as const);
        const rating = Math.random() > 0.3 ? 5 : 4;
        const content = getRandomItem(REVIEW_TEMPLATES[type]);
        const writtenAt = getRandomDate(12);
        const hasPhoto = Math.random() > 0.7;

        reviews.push({
            reviewId: `review-${breed.replace(/\s+/g, '')}-${index}-${i + 1}`,
            writtenAt,
            type,
            adopterName,
            rating,
            content,
            photos: hasPhoto ? [`https://picsum.photos/seed/review-${breed}-${index}-${i}/600/400`] : [],
            isVisible: true,
        });
    }

    return reviews.sort((a, b) => b.writtenAt.getTime() - a.writtenAt.getTime());
}

function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    return `new Date(${year}, ${month}, ${day})`;
}

function formatPet(pet: any, indent: string): string {
    return `${indent}{
${indent}    petId: '${pet.petId}',
${indent}    name: '${pet.name}',
${indent}    breed: '${pet.breed}',
${indent}    gender: '${pet.gender}',
${indent}    birthDate: ${formatDate(pet.birthDate)},
${indent}    price: ${pet.price},
${indent}    status: '${pet.status}',
${indent}    photos: [
${indent}        '${pet.photos[0]}',
${indent}        '${pet.photos[1]}',
${indent}    ],
${indent}    isActive: true,
${indent}}`;
}

function formatParentPet(pet: any, indent: string): string {
    return `${indent}{
${indent}    petId: '${pet.petId}',
${indent}    name: '${pet.name}',
${indent}    breed: '${pet.breed}',
${indent}    gender: '${pet.gender}',
${indent}    age: ${pet.age},
${indent}    photos: [
${indent}        '${pet.photos[0]}',
${indent}        '${pet.photos[1]}',
${indent}    ],
${indent}    isActive: true,
${indent}}`;
}

function formatReview(review: any, indent: string): string {
    const photoArray = review.photos.length > 0 ? `['${review.photos[0]}']` : '[]';
    return `${indent}{
${indent}    reviewId: '${review.reviewId}',
${indent}    writtenAt: ${formatDate(review.writtenAt)},
${indent}    type: '${review.type}',
${indent}    adopterName: '${review.adopterName}',
${indent}    rating: ${review.rating},
${indent}    content: '${review.content}',
${indent}    photos: ${photoArray},
${indent}    isVisible: true,
${indent}}`;
}

// 메인 실행
const filePath = path.join(__dirname, '../common/data/breeders.data.ts');
const fileContent = fs.readFileSync(filePath, 'utf-8');

// 이미 첫 번째 브리더는 수동으로 업데이트했으므로, 두 번째 브리더부터 처리
console.log('브리더 데이터 업데이트 스크립트는 수동 처리를 권장합니다.');
console.log('첫 번째 브리더 패턴을 참고하여 나머지 브리더를 업데이트하세요.');
