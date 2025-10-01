import { NestFactory } from '@nestjs/core';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '../src/app.module';
import { Breeder } from '../src/schema/breeder.schema';

/**
 * 대량 목 데이터 시드 스크립트
 * 다양한 속성을 가진 30개의 브리더 데이터를 생성합니다.
 */
async function seedLargeMockData() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const breederModel: Model<Breeder> = app.get(getModelToken(Breeder.name));

    console.log('🌱 대량 목 데이터 생성을 시작합니다...');

    // 기존 데이터 삭제
    await breederModel.deleteMany({});
    console.log('기존 데이터를 삭제했습니다.');

    // 다양한 데이터를 위한 배열들
    const dogBreeds = [
        { breed: '말티즈', size: 'small' },
        { breed: '비숑프리제', size: 'small' },
        { breed: '포메라니안', size: 'small' },
        { breed: '치와와', size: 'small' },
        { breed: '시바견', size: 'medium' },
        { breed: '웰시코기', size: 'medium' },
        { breed: '비글', size: 'medium' },
        { breed: '슈나우저', size: 'medium' },
        { breed: '골든 리트리버', size: 'large' },
        { breed: '래브라도', size: 'large' },
        { breed: '허스키', size: 'large' },
        { breed: '진돗개', size: 'large' }
    ];

    const catBreeds = [
        { breed: '러시안 블루', furLength: 'short' },
        { breed: '브리티시 숏헤어', furLength: 'short' },
        { breed: '아메리칸 숏헤어', furLength: 'short' },
        { breed: '스코티시 폴드', furLength: 'short' },
        { breed: '페르시안', furLength: 'long' },
        { breed: '메인쿤', furLength: 'long' },
        { breed: '노르웨이 숲', furLength: 'long' },
        { breed: '라가머피', furLength: 'long' }
    ];

    const locations = [
        { city: '서울특별시', district: '강남구' },
        { city: '서울특별시', district: '강서구' },
        { city: '서울특별시', district: '마포구' },
        { city: '경기도', district: '수원시' },
        { city: '경기도', district: '성남시' },
        { city: '경기도', district: '파주시' },
        { city: '부산광역시', district: '해운대구' },
        { city: '부산광역시', district: '수영구' },
        { city: '대구광역시', district: '중구' },
        { city: '인천광역시', district: '연수구' },
        { city: '광주광역시', district: '서구' },
        { city: '대전광역시', district: '유성구' },
        { city: '울산광역시', district: '남구' },
        { city: '충청남도', district: '천안시' },
        { city: '충청북도', district: '청주시' },
        { city: '전라남도', district: '목포시' },
        { city: '전라북도', district: '전주시' },
        { city: '경상남도', district: '창원시' },
        { city: '경상북도', district: '포항시' },
        { city: '강원도', district: '춘천시' }
    ];

    const breederNames = [
        '해피독 브리더', '사랑펫 브리더', '천사의 날개', '꿈나무 브리딩', '행복한 가족',
        '프리미엄 펫', '엘리트 브리더', '특급 브리딩', '최고의 선택', '믿음직한 브리더',
        '천국의 아이들', '사랑스런 친구들', '건강한 생명', '순수혈통', '명품 브리딩',
        '따뜻한 마음', '소중한 만남', '아름다운 인연', '행운의 브리더', '기적의 생명',
        '달콤한 꿈', '황금빛 미래', '은빛 천사', '다이아몬드 펫', '크리스탈 브리딩',
        '무지개 브리더', '별빛 반려동물', '햇살 브리딩', '바람개비 펫', '구름 위 천사'
    ];

    const mockBreeders: any[] = [];

    for (let i = 0; i < 30; i++) {
        const isdog = Math.random() > 0.4; // 60% 강아지, 40% 고양이
        const petInfo = isdog 
            ? dogBreeds[Math.floor(Math.random() * dogBreeds.length)]
            : catBreeds[Math.floor(Math.random() * catBreeds.length)];
        
        const location = locations[Math.floor(Math.random() * locations.length)];
        const breederName = breederNames[i] || `브리더${i + 1}`;
        const isElite = Math.random() > 0.7; // 30% 엘리트
        const isApproved = Math.random() > 0.1; // 90% 승인
        const priceDisplayType = Math.random() > 0.3 ? 'range' : 'consultation'; // 70% 범위 공개

        // 가격 범위 설정
        let priceRange;
        if (isdog) {
            const dogInfo = petInfo as { breed: string; size: string };
            if (dogInfo.size === 'small') {
                priceRange = { min: 500000 + Math.floor(Math.random() * 500000), max: 1000000 + Math.floor(Math.random() * 1000000) };
            } else if (dogInfo.size === 'medium') {
                priceRange = { min: 800000 + Math.floor(Math.random() * 700000), max: 1500000 + Math.floor(Math.random() * 1500000) };
            } else {
                priceRange = { min: 1000000 + Math.floor(Math.random() * 1000000), max: 2000000 + Math.floor(Math.random() * 2000000) };
            }
        } else {
            priceRange = { min: 1000000 + Math.floor(Math.random() * 1500000), max: 2500000 + Math.floor(Math.random() * 2000000) };
        }

        // 분양 가능한 개체 생성 (1-4마리)
        const petCount = Math.floor(Math.random() * 4) + 1;
        const availablePets: any[] = [];
        const statuses = ['available', 'reserved', 'adopted'];
        
        for (let j = 0; j < petCount; j++) {
            const petNames = isdog 
                ? ['별이', '달이', '해피', '럭키', '코코', '모카', '초코', '라떼', '바니', '루비']
                : ['나비', '민트', '루나', '벨라', '소피', '릴리', '레오', '맥스', '미미', '통통'];
            
            const randomStatus = Math.random() > 0.3 ? 'available' : statuses[Math.floor(Math.random() * statuses.length)];
            const birthDate = new Date();
            birthDate.setMonth(birthDate.getMonth() - Math.floor(Math.random() * 24)); // 0-24개월 전

            const pet = {
                petId: `${isdog ? 'dog' : 'cat'}-${i}-${j}`,
                name: petNames[j] || `${isdog ? '강아지' : '고양이'}${j + 1}`,
                type: isdog ? 'dog' : 'cat',
                breed: petInfo.breed,
                birthDate: birthDate,
                gender: Math.random() > 0.5 ? 'male' : 'female',
                photos: [`https://example.com/pets/${isdog ? 'dog' : 'cat'}-${i}-${j}.jpg`],
                price: Math.floor(priceRange.min + Math.random() * (priceRange.max - priceRange.min)),
                status: randomStatus,
                healthInfo: {
                    vaccinated: Math.random() > 0.2,
                    neutered: Math.random() > 0.7,
                    healthChecked: Math.random() > 0.1
                },
                isActive: true
            };

            // 크기나 털길이 추가
            if (isdog) {
                const dogInfo = petInfo as { breed: string; size: string };
                pet['size'] = dogInfo.size;
            } else {
                const catInfo = petInfo as { breed: string; furLength: string };
                pet['furLength'] = catInfo.furLength;
            }

            availablePets.push(pet);
        }

        // 부모견/부모묘 생성 (0-3마리)
        const parentCount = Math.floor(Math.random() * 4);
        const parentPets: any[] = [];
        
        for (let k = 0; k < parentCount; k++) {
            const parentNames = isdog 
                ? ['하늘이', '구름이', '바람이', '햇살이', '별빛이', '무지개']
                : ['미르', '별이', '달님', '해님', '꽃님', '나무'];
            
            parentPets.push({
                petId: `parent-${isdog ? 'dog' : 'cat'}-${i}-${k}`,
                name: parentNames[k] || `부모${k + 1}`,
                type: isdog ? 'dog' : 'cat',
                breed: petInfo.breed,
                age: Math.floor(Math.random() * 8) + 2, // 2-10세
                gender: Math.random() > 0.5 ? 'male' : 'female',
                photos: [`https://example.com/parents/${isdog ? 'dog' : 'cat'}-${i}-${k}.jpg`],
                healthInfo: {
                    vaccinated: true,
                    neutered: Math.random() > 0.5,
                    healthChecked: true
                },
                isActive: true
            });
        }

        // 후기 생성 (0-8개)
        const reviewCount = Math.floor(Math.random() * 9);
        const reviews: any[] = [];
        const reviewContents = [
            '정말 건강하고 예쁜 아이를 분양받았어요!',
            '브리더님이 너무 친절하시고 사후관리도 완벽했습니다.',
            '상담 과정에서 궁금한 점들을 자세히 설명해주셨어요.',
            '아이가 정말 건강하고 성격도 좋아요.',
            '분양 후에도 지속적으로 관리해주셔서 감사해요.',
            '최고의 브리더님이라고 생각합니다.',
            '다음에도 꼭 이곳에서 분양받고 싶어요.',
            '처음 분양받는 거였는데 친절하게 도와주셨어요.'
        ];

        for (let r = 0; r < reviewCount; r++) {
            const reviewDate = new Date();
            reviewDate.setDate(reviewDate.getDate() - Math.floor(Math.random() * 365));
            
            reviews.push({
                reviewId: `review-${i}-${r}`,
                adopterId: `adopter-${Math.floor(Math.random() * 1000)}`,
                adopterName: `입양자${r + 1}`,
                applicationId: `app-${i}-${r}`,
                type: Math.random() > 0.4 ? 'adoption' : 'consultation',
                rating: Math.floor(Math.random() * 2) + 4, // 4-5점
                content: reviewContents[Math.floor(Math.random() * reviewContents.length)],
                photos: Math.random() > 0.5 ? [`https://example.com/reviews/review-${i}-${r}.jpg`] : [],
                writtenAt: reviewDate,
                isVisible: true
            });
        }

        // 통계 계산
        const avgRating = reviews.length > 0 
            ? reviews.reduce((sum, review: any) => sum + review.rating, 0) / reviews.length 
            : 0;
        const availableCount = availablePets.filter((pet: any) => pet.status === 'available').length;

        const breeder = {
            email: `breeder${i + 1}@example.com`,
            password: '$2b$10$example.hash.for.password',
            name: breederName,
            phone: `010-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
            profileImage: `https://example.com/profiles/breeder-${i + 1}.jpg`,
            petType: isdog ? 'dog' : 'cat',
            detailBreed: petInfo.breed,
            priceDisplay: priceDisplayType,
            priceRange: priceRange,
            status: 'active',
            lastLoginAt: new Date(),
            verification: {
                status: isApproved ? 'approved' : (Math.random() > 0.5 ? 'pending' : 'reviewing'),
                plan: isElite ? 'premium' : 'basic',
                level: isElite ? 'elite' : 'new',
                submittedAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
                reviewedAt: isApproved ? new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) : undefined,
                documents: [`https://example.com/docs/cert-${i + 1}.pdf`]
            },
            profile: {
                description: `${Math.floor(Math.random() * 20) + 5}년 경력의 ${petInfo.breed} 전문 브리더입니다. 건강하고 사랑스러운 아이들을 분양하고 있어요! ${isdog ? '🐕' : '🐱'}✨`,
                location: {
                    city: location.city,
                    district: location.district,
                    address: `${Math.floor(Math.random() * 999) + 1}로 ${Math.floor(Math.random() * 99) + 1}`
                },
                representativePhotos: [
                    `https://example.com/photos/rep-${i + 1}-1.jpg`,
                    `https://example.com/photos/rep-${i + 1}-2.jpg`,
                    Math.random() > 0.3 ? `https://example.com/photos/rep-${i + 1}-3.jpg` : null
                ].filter(Boolean),
                priceRange: priceRange,
                specialization: [isdog ? 'dog' : 'cat'],
                experienceYears: Math.floor(Math.random() * 20) + 5
            },
            parentPets: parentPets,
            availablePets: availablePets,
            reviews: reviews,
            stats: {
                totalApplications: Math.floor(Math.random() * 50) + reviewCount,
                totalFavorites: Math.floor(Math.random() * 200) + reviews.length * 5,
                completedAdoptions: Math.floor(reviews.filter((r: any) => r.type === 'adoption').length * 1.2),
                averageRating: Math.round(avgRating * 10) / 10,
                totalReviews: reviews.length,
                profileViews: Math.floor(Math.random() * 1000) + 100,
                lastUpdated: new Date()
            }
        };

        mockBreeders.push(breeder);
    }

    // 데이터 삽입
    try {
        const result = await breederModel.insertMany(mockBreeders);
        console.log(`✅ ${result.length}개의 브리더 목 데이터가 성공적으로 생성되었습니다.`);
        
        // 생성된 데이터 요약 출력
        const approvedCount = mockBreeders.filter((b: any) => b.verification.status === 'approved').length;
        const dogCount = mockBreeders.filter((b: any) => b.petType === 'dog').length;
        const catCount = mockBreeders.filter((b: any) => b.petType === 'cat').length;
        const eliteCount = mockBreeders.filter((b: any) => b.verification.level === 'elite').length;
        const totalPets = mockBreeders.reduce((sum, b: any) => sum + b.availablePets.length, 0);
        const availablePets = mockBreeders.reduce((sum, b: any) => sum + b.availablePets.filter((p: any) => p.status === 'available').length, 0);
        const totalReviews = mockBreeders.reduce((sum, b: any) => sum + b.reviews.length, 0);
        
        console.log('\n📊 생성된 데이터 요약:');
        console.log(`- 승인된 브리더: ${approvedCount}명`);
        console.log(`- 강아지 브리더: ${dogCount}명`);
        console.log(`- 고양이 브리더: ${catCount}명`);
        console.log(`- 엘리트 브리더: ${eliteCount}명`);
        console.log(`- 총 등록된 개체: ${totalPets}마리`);
        console.log(`- 분양 가능한 개체: ${availablePets}마리`);
        console.log(`- 총 후기 수: ${totalReviews}개`);
        
        // 지역별 분포
        const locationCount: any = {};
        mockBreeders.forEach((b: any) => {
            const city = b.profile.location.city;
            locationCount[city] = (locationCount[city] || 0) + 1;
        });
        console.log('\n🗺️ 지역별 분포:');
        Object.entries(locationCount).forEach(([city, count]) => {
            console.log(`- ${city}: ${count}명`);
        });
        
    } catch (error) {
        console.error('❌ 목 데이터 생성 중 오류 발생:', error);
    }

    await app.close();
}

// 스크립트 실행
if (require.main === module) {
    seedLargeMockData()
        .then(() => {
            console.log('🎉 대량 목 데이터 시드 작업이 완료되었습니다.');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ 시드 작업 실패:', error);
            process.exit(1);
        });
}

export { seedLargeMockData };