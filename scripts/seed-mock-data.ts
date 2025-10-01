import { NestFactory } from '@nestjs/core';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '../src/app.module';
import { Breeder } from '../src/schema/breeder.schema';

/**
 * 목 데이터 시드 스크립트
 * 개발 및 테스트용 브리더 데이터를 대량 생성합니다.
 */
async function seedMockData() {
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

    // 30개의 다양한 브리더 데이터 생성
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
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
            : 0;

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
                completedAdoptions: Math.floor(reviews.filter(r => r.type === 'adoption').length * 1.2),
                averageRating: Math.round(avgRating * 10) / 10,
                totalReviews: reviews.length,
                profileViews: Math.floor(Math.random() * 1000) + 100,
                lastUpdated: new Date()
            }
        };

        mockBreeders.push(breeder);
    }

    // 기존 소량 데이터도 추가 (호환성 유지)
    const legacyBreeders = [
        {
            email: 'happy.dog.breeder@example.com',
            password: '$2b$10$example.hash.for.password123', // 실제로는 bcrypt 해시
            name: '해피독 브리더',
            phone: '010-1234-5678',
            profileImage: 'https://example.com/profiles/happy-dog.jpg',
            petType: 'dog',
            detailBreed: '말티즈',
            priceDisplay: 'range',
            priceRange: {
                min: 800000,
                max: 1500000
            },
            status: 'active',
            lastLoginAt: new Date(),
            verification: {
                status: 'approved',
                plan: 'basic',
                level: 'new',
                submittedAt: new Date('2024-01-15'),
                reviewedAt: new Date('2024-01-20'),
                documents: ['https://example.com/docs/cert1.pdf']
            },
            profile: {
                description: '20년 경력의 말티즈 전문 브리더입니다. 건강하고 사랑스러운 아이들을 분양하고 있어요. 🐕✨',
                location: {
                    city: '경기도',
                    district: '파주시',
                    address: '문산읍 000로 123'
                },
                representativePhotos: [
                    'https://example.com/photos/happy-dog-1.jpg',
                    'https://example.com/photos/happy-dog-2.jpg',
                    'https://example.com/photos/happy-dog-3.jpg'
                ],
                priceRange: {
                    min: 800000,
                    max: 1500000
                },
                specialization: ['dog'],
                experienceYears: 20
            },
            parentPets: [
                {
                    petId: 'parent-maltese-001',
                    name: '하늘이',
                    type: 'dog',
                    breed: '말티즈',
                    age: 3,
                    gender: 'female',
                    photos: ['https://example.com/parents/sky.jpg'],
                    healthInfo: {
                        vaccinated: true,
                        neutered: false,
                        healthChecked: true
                    },
                    isActive: true
                },
                {
                    petId: 'parent-maltese-002',
                    name: '구름이',
                    type: 'dog',
                    breed: '말티즈',
                    age: 4,
                    gender: 'male',
                    photos: ['https://example.com/parents/cloud.jpg'],
                    healthInfo: {
                        vaccinated: true,
                        neutered: false,
                        healthChecked: true
                    },
                    isActive: true
                }
            ],
            availablePets: [
                {
                    petId: 'maltese-puppy-001',
                    name: '별이',
                    type: 'dog',
                    breed: '말티즈',
                    birthDate: new Date('2024-03-15'),
                    gender: 'female',
                    photos: ['https://example.com/puppies/star.jpg'],
                    price: 1200000,
                    status: 'available',
                    size: 'small',
                    healthInfo: {
                        vaccinated: true,
                        neutered: false,
                        healthChecked: true
                    },
                    parentInfo: {
                        mother: 'parent-maltese-001',
                        father: 'parent-maltese-002'
                    },
                    isActive: true
                },
                {
                    petId: 'maltese-puppy-002',
                    name: '달이',
                    type: 'dog',
                    breed: '말티즈',
                    birthDate: new Date('2024-03-15'),
                    gender: 'male',
                    photos: ['https://example.com/puppies/moon.jpg'],
                    price: 1000000,
                    status: 'available',
                    size: 'small',
                    healthInfo: {
                        vaccinated: true,
                        neutered: false,
                        healthChecked: true
                    },
                    parentInfo: {
                        mother: 'parent-maltese-001',
                        father: 'parent-maltese-002'
                    },
                    isActive: true
                }
            ],
            reviews: [
                {
                    reviewId: 'review-001',
                    adopterId: 'adopter-001',
                    adopterName: '김입양',
                    applicationId: 'app-001',
                    type: 'adoption',
                    rating: 5,
                    content: '정말 건강하고 예쁜 아이를 분양받았어요! 브리더님도 너무 친절하시고 사후관리까지 완벽했습니다.',
                    photos: ['https://example.com/reviews/review1.jpg'],
                    writtenAt: new Date('2024-02-10'),
                    isVisible: true
                },
                {
                    reviewId: 'review-002',
                    adopterId: 'adopter-002',
                    adopterName: '이사랑',
                    applicationId: 'app-002',
                    type: 'consultation',
                    rating: 4,
                    content: '상담 과정에서 궁금한 점들을 자세히 설명해주셨어요. 다음에 꼭 분양받고 싶습니다.',
                    photos: [],
                    writtenAt: new Date('2024-02-15'),
                    isVisible: true
                }
            ],
            stats: {
                totalApplications: 15,
                totalFavorites: 42,
                completedAdoptions: 8,
                averageRating: 4.5,
                totalReviews: 12,
                profileViews: 234,
                lastUpdated: new Date()
            }
        },
        {
            email: 'elite.cat.breeder@example.com',
            password: '$2b$10$example.hash.for.password456',
            name: '프리미엄 캣 브리더',
            phone: '010-9876-5432',
            profileImage: 'https://example.com/profiles/elite-cat.jpg',
            petType: 'cat',
            detailBreed: '러시안 블루',
            priceDisplay: 'range',
            priceRange: {
                min: 1500000,
                max: 3000000
            },
            status: 'active',
            lastLoginAt: new Date(),
            verification: {
                status: 'approved',
                plan: 'premium',
                level: 'elite',
                submittedAt: new Date('2023-12-01'),
                reviewedAt: new Date('2023-12-05'),
                documents: ['https://example.com/docs/cert2.pdf', 'https://example.com/docs/cert3.pdf']
            },
            profile: {
                description: '엘리트 브리더로 인증받은 러시안 블루 전문 브리더입니다. 국제 혈통서와 함께 최고 품질의 고양이를 분양합니다. 🐱💎',
                location: {
                    city: '서울특별시',
                    district: '강남구',
                    address: '논현동 000로 456'
                },
                representativePhotos: [
                    'https://example.com/photos/elite-cat-1.jpg',
                    'https://example.com/photos/elite-cat-2.jpg',
                    'https://example.com/photos/elite-cat-3.jpg'
                ],
                priceRange: {
                    min: 1500000,
                    max: 3000000
                },
                specialization: ['cat'],
                experienceYears: 15
            },
            parentPets: [
                {
                    petId: 'parent-russian-001',
                    name: '사파이어',
                    type: 'cat',
                    breed: '러시안 블루',
                    age: 4,
                    gender: 'female',
                    photos: ['https://example.com/parents/sapphire.jpg'],
                    healthInfo: {
                        vaccinated: true,
                        neutered: false,
                        healthChecked: true
                    },
                    isActive: true
                },
                {
                    petId: 'parent-russian-002',
                    name: '아쿠아',
                    type: 'cat',
                    breed: '러시안 블루',
                    age: 5,
                    gender: 'male',
                    photos: ['https://example.com/parents/aqua.jpg'],
                    healthInfo: {
                        vaccinated: true,
                        neutered: false,
                        healthChecked: true
                    },
                    isActive: true
                }
            ],
            availablePets: [
                {
                    petId: 'russian-kitten-001',
                    name: '미스트',
                    type: 'cat',
                    breed: '러시안 블루',
                    birthDate: new Date('2024-02-20'),
                    gender: 'female',
                    photos: ['https://example.com/kittens/mist.jpg'],
                    price: 2500000,
                    status: 'available',
                    furLength: 'short',
                    healthInfo: {
                        vaccinated: true,
                        neutered: false,
                        healthChecked: true
                    },
                    parentInfo: {
                        mother: 'parent-russian-001',
                        father: 'parent-russian-002'
                    },
                    isActive: true
                },
                {
                    petId: 'russian-kitten-002',
                    name: '실버',
                    type: 'cat',
                    breed: '러시안 블루',
                    birthDate: new Date('2024-02-20'),
                    gender: 'male',
                    photos: ['https://example.com/kittens/silver.jpg'],
                    price: 2200000,
                    status: 'reserved',
                    furLength: 'short',
                    healthInfo: {
                        vaccinated: true,
                        neutered: false,
                        healthChecked: true
                    },
                    parentInfo: {
                        mother: 'parent-russian-001',
                        father: 'parent-russian-002'
                    },
                    isActive: true,
                    reservedAt: new Date('2024-03-01')
                }
            ],
            reviews: [
                {
                    reviewId: 'review-003',
                    adopterId: 'adopter-003',
                    adopterName: '박고양',
                    applicationId: 'app-003',
                    type: 'adoption',
                    rating: 5,
                    content: '엘리트 브리더답게 정말 완벽한 아이를 분양받았습니다. 혈통서부터 건강상태까지 모든 것이 최고였어요!',
                    photos: ['https://example.com/reviews/review3.jpg'],
                    writtenAt: new Date('2024-01-25'),
                    isVisible: true
                }
            ],
            stats: {
                totalApplications: 28,
                totalFavorites: 89,
                completedAdoptions: 15,
                averageRating: 4.8,
                totalReviews: 18,
                profileViews: 456,
                lastUpdated: new Date()
            }
        },
        {
            email: 'golden.retriever.farm@example.com',
            password: '$2b$10$example.hash.for.password789',
            name: '골든 리트리버 팜',
            phone: '010-5555-7777',
            profileImage: 'https://example.com/profiles/golden-farm.jpg',
            petType: 'dog',
            detailBreed: '골든 리트리버',
            priceDisplay: 'consultation',
            priceRange: {
                min: 1000000,
                max: 2000000
            },
            status: 'active',
            lastLoginAt: new Date(),
            verification: {
                status: 'approved',
                plan: 'basic',
                level: 'new',
                submittedAt: new Date('2024-02-01'),
                reviewedAt: new Date('2024-02-10'),
                documents: ['https://example.com/docs/cert4.pdf']
            },
            profile: {
                description: '넓은 농장에서 자유롭게 키우는 골든 리트리버들입니다. 성격 좋고 건강한 아이들만 분양해요! 🐕‍🦺🌾',
                location: {
                    city: '충청남도',
                    district: '천안시',
                    address: '동남구 000로 789'
                },
                representativePhotos: [
                    'https://example.com/photos/golden-farm-1.jpg',
                    'https://example.com/photos/golden-farm-2.jpg'
                ],
                priceRange: {
                    min: 1000000,
                    max: 2000000
                },
                specialization: ['dog'],
                experienceYears: 10
            },
            parentPets: [
                {
                    petId: 'parent-golden-001',
                    name: '써니',
                    type: 'dog',
                    breed: '골든 리트리버',
                    age: 5,
                    gender: 'female',
                    photos: ['https://example.com/parents/sunny.jpg'],
                    healthInfo: {
                        vaccinated: true,
                        neutered: false,
                        healthChecked: true
                    },
                    isActive: true
                }
            ],
            availablePets: [
                {
                    petId: 'golden-puppy-001',
                    name: '레이',
                    type: 'dog',
                    breed: '골든 리트리버',
                    birthDate: new Date('2024-01-10'),
                    gender: 'male',
                    photos: ['https://example.com/puppies/ray.jpg'],
                    price: 1500000,
                    status: 'available',
                    size: 'large',
                    healthInfo: {
                        vaccinated: true,
                        neutered: false,
                        healthChecked: true
                    },
                    parentInfo: {
                        mother: 'parent-golden-001'
                    },
                    isActive: true
                }
            ],
            reviews: [],
            stats: {
                totalApplications: 8,
                totalFavorites: 23,
                completedAdoptions: 3,
                averageRating: 4.2,
                totalReviews: 5,
                profileViews: 123,
                lastUpdated: new Date()
            }
        },
        {
            email: 'persian.cat.house@example.com',
            password: '$2b$10$example.hash.for.password000',
            name: '페르시안 캣 하우스',
            phone: '010-3333-9999',
            profileImage: 'https://example.com/profiles/persian-house.jpg',
            petType: 'cat',
            detailBreed: '페르시안',
            priceDisplay: 'range',
            priceRange: {
                min: 2000000,
                max: 4000000
            },
            status: 'active',
            lastLoginAt: new Date(),
            verification: {
                status: 'approved',
                plan: 'premium',
                level: 'elite',
                submittedAt: new Date('2023-11-15'),
                reviewedAt: new Date('2023-11-20'),
                documents: ['https://example.com/docs/cert5.pdf']
            },
            profile: {
                description: '페르시안 고양이 전문 브리더입니다. 장모종의 아름다운 털과 온순한 성격을 자랑하는 최고급 혈통을 분양합니다. 🐱👑',
                location: {
                    city: '부산광역시',
                    district: '해운대구',
                    address: '우동 000로 321'
                },
                representativePhotos: [
                    'https://example.com/photos/persian-house-1.jpg',
                    'https://example.com/photos/persian-house-2.jpg',
                    'https://example.com/photos/persian-house-3.jpg'
                ],
                priceRange: {
                    min: 2000000,
                    max: 4000000
                },
                specialization: ['cat'],
                experienceYears: 25
            },
            parentPets: [
                {
                    petId: 'parent-persian-001',
                    name: '프린세스',
                    type: 'cat',
                    breed: '페르시안',
                    age: 6,
                    gender: 'female',
                    photos: ['https://example.com/parents/princess.jpg'],
                    healthInfo: {
                        vaccinated: true,
                        neutered: false,
                        healthChecked: true
                    },
                    isActive: true
                }
            ],
            availablePets: [
                {
                    petId: 'persian-kitten-001',
                    name: '엔젤',
                    type: 'cat',
                    breed: '페르시안',
                    birthDate: new Date('2024-04-01'),
                    gender: 'female',
                    photos: ['https://example.com/kittens/angel.jpg'],
                    price: 3500000,
                    status: 'available',
                    furLength: 'long',
                    healthInfo: {
                        vaccinated: true,
                        neutered: false,
                        healthChecked: true
                    },
                    parentInfo: {
                        mother: 'parent-persian-001'
                    },
                    isActive: true
                }
            ],
            reviews: [
                {
                    reviewId: 'review-004',
                    adopterId: 'adopter-004',
                    adopterName: '최페르시안',
                    applicationId: 'app-004',
                    type: 'adoption',
                    rating: 5,
                    content: '25년 경력이 느껴지는 완벽한 분양이었습니다. 아이도 정말 예쁘고 건강해요!',
                    photos: ['https://example.com/reviews/review4.jpg'],
                    writtenAt: new Date('2024-01-30'),
                    isVisible: true
                }
            ],
            stats: {
                totalApplications: 35,
                totalFavorites: 156,
                completedAdoptions: 22,
                averageRating: 4.9,
                totalReviews: 25,
                profileViews: 678,
                lastUpdated: new Date()
            }
        },
        {
            email: 'new.breeder.test@example.com',
            password: '$2b$10$example.hash.for.password111',
            name: '신규 브리더',
            phone: '010-1111-2222',
            petType: 'dog',
            detailBreed: '포메라니안',
            priceDisplay: 'range',
            priceRange: {
                min: 500000,
                max: 1000000
            },
            status: 'active',
            lastLoginAt: new Date(),
            verification: {
                status: 'pending',
                plan: 'basic',
                level: 'new',
                submittedAt: new Date(),
                documents: []
            },
            stats: {
                totalApplications: 0,
                totalFavorites: 0,
                completedAdoptions: 0,
                averageRating: 0,
                totalReviews: 0,
                profileViews: 0,
                lastUpdated: new Date()
            }
        }
    ];

    // 데이터 삽입
    try {
        const result = await breederModel.insertMany(mockBreeders);
        console.log(`✅ ${result.length}개의 브리더 목 데이터가 성공적으로 생성되었습니다.`);
        
        // 생성된 데이터 요약 출력
        const approvedCount = mockBreeders.filter(b => b.verification.status === 'approved').length;
        const dogCount = mockBreeders.filter(b => b.petType === 'dog').length;
        const catCount = mockBreeders.filter(b => b.petType === 'cat').length;
        const eliteCount = mockBreeders.filter(b => b.verification.level === 'elite').length;
        const totalPets = mockBreeders.reduce((sum, b) => sum + b.availablePets.length, 0);
        const availablePets = mockBreeders.reduce((sum, b) => sum + b.availablePets.filter((p: any) => p.status === 'available').length, 0);
        const totalReviews = mockBreeders.reduce((sum, b) => sum + b.reviews.length, 0);
        
        console.log('\n📊 생성된 데이터 요약:');
        console.log(`- 총 브리더: ${result.length}명`);
        console.log(`- 승인된 브리더: ${approvedCount}명`);
        console.log(`- 강아지 브리더: ${dogCount}명`);
        console.log(`- 고양이 브리더: ${catCount}명`);
        console.log(`- 엘리트 브리더: ${eliteCount}명`);
        console.log(`- 총 등록된 개체: ${totalPets}마리`);
        console.log(`- 분양 가능한 개체: ${availablePets}마리`);
        console.log(`- 총 후기 수: ${totalReviews}개`);
        
        // 지역별 분포
        const locationCount: any = {};
        mockBreeders.forEach(b => {
            const city = b.profile?.location?.city;
            if (city) {
                locationCount[city] = (locationCount[city] || 0) + 1;
            }
        });
        console.log('\n🗺️ 지역별 분포:');
        Object.entries(locationCount).forEach(([city, count]) => {
            console.log(`- ${city}: ${count}명`);
        });
        
        // 품종별 분포
        const breedCount: any = {};
        mockBreeders.forEach(b => {
            const breed = b.detailBreed;
            breedCount[breed] = (breedCount[breed] || 0) + 1;
        });
        console.log('\n🐕🐱 품종별 분포:');
        Object.entries(breedCount).forEach(([breed, count]) => {
            console.log(`- ${breed}: ${count}명`);
        });
        
        const legacyResult = await breederModel.insertMany(legacyBreeders);
        console.log(`✅ ${legacyResult.length}개의 기존 브리더 데이터가 추가되었습니다.`);
        
    } catch (error) {
        console.error('❌ 목 데이터 생성 중 오류 발생:', error);
    }

    await app.close();
}

// 스크립트 실행
if (require.main === module) {
    seedMockData()
        .then(() => {
            console.log('🎉 목 데이터 시드 작업이 완료되었습니다.');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ 시드 작업 실패:', error);
            process.exit(1);
        });
}

export { seedMockData };