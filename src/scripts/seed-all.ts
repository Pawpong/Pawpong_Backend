#!/usr/bin/env ts-node
/**
 * 통합 데이터 시딩 스크립트
 *
 * 실행 방법:
 * yarn seed:all              # 모든 데이터 시딩
 * yarn seed:breeders         # 브리더 데이터만 시딩
 * yarn seed:districts        # 지역 데이터만 시딩
 * yarn seed:questions        # 표준 질문 데이터만 시딩
 * yarn seed:breeds           # 품종 데이터만 시딩
 * yarn seed:banners          # 배너 데이터만 시딩
 * yarn seed:faqs             # FAQ 데이터만 시딩
 */

import { connect, connection } from 'mongoose';
import { MOCK_BREEDERS } from '../common/data/breeders.data';
import { KOREA_DISTRICTS } from '../common/data/districts.data';
import { STANDARD_QUESTIONS } from '../common/data/standard-questions.data';
import { KOREA_BREEDS } from '../common/data/breeds.data';
import { bannerData } from '../common/data/banner.data';
import { faqData } from '../common/data/faq.data';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pawpong';

interface SeedOptions {
    breeders?: boolean;
    districts?: boolean;
    questions?: boolean;
    breeds?: boolean;
    banners?: boolean;
    faqs?: boolean;
    force?: boolean; // 기존 데이터 삭제 후 재삽입
}

/**
 * MongoDB 연결
 */
async function connectDB() {
    try {
        console.log('[MongoDB] 연결 중...');
        await connect(MONGODB_URI);
        console.log('[MongoDB] 연결 성공\n');
    } catch (error) {
        console.error('[MongoDB] 연결 실패:', error);
        process.exit(1);
    }
}

/**
 * MongoDB 연결 종료
 */
async function disconnectDB() {
    try {
        await connection.close();
        console.log('\n[MongoDB] 연결 종료');
    } catch (error) {
        console.error('[MongoDB] 연결 종료 실패:', error);
    }
}

/**
 * 브리더 데이터 시딩
 */
async function seedBreeders(force: boolean = false) {
    const db = connection.db!;
    const breedersCollection = db.collection('breeders');

    try {
        const existingCount = await breedersCollection.countDocuments();

        if (existingCount > 0 && !force) {
            console.log(`[Breeders] 데이터가 이미 존재합니다 (${existingCount}개)`);
            console.log('[Breeders] 강제 삽입하려면 --force 옵션을 사용하세요');
            return;
        }

        if (force && existingCount > 0) {
            console.log(`[Breeders] 기존 데이터 삭제 중... (${existingCount}개)`);
            const deleteResult = await breedersCollection.deleteMany({});
            console.log(`[Breeders] ${deleteResult.deletedCount}개 삭제 완료`);
        }

        console.log(`[Breeders] 데이터 삽입 중... (${MOCK_BREEDERS.length}개)`);
        const insertResult = await breedersCollection.insertMany(MOCK_BREEDERS);
        console.log(`[Breeders] ${insertResult.insertedCount}개 삽입 완료`);
    } catch (error) {
        console.error('[Breeders] 시딩 실패:', error);
        throw error;
    }
}

/**
 * 지역 데이터 시딩
 */
async function seedDistricts(force: boolean = false) {
    const db = connection.db!;
    const districtsCollection = db.collection('districts');

    try {
        const existingCount = await districtsCollection.countDocuments();

        if (existingCount > 0 && !force) {
            console.log(`[Districts] 데이터가 이미 존재합니다 (${existingCount}개)`);
            console.log('[Districts] 강제 삽입하려면 --force 옵션을 사용하세요');
            return;
        }

        if (force && existingCount > 0) {
            console.log(`[Districts] 기존 데이터 삭제 중... (${existingCount}개)`);
            const deleteResult = await districtsCollection.deleteMany({});
            console.log(`[Districts] ${deleteResult.deletedCount}개 삭제 완료`);
        }

        console.log(`[Districts] 데이터 삽입 중... (${KOREA_DISTRICTS.length}개)`);
        const insertResult = await districtsCollection.insertMany(KOREA_DISTRICTS);
        console.log(`[Districts] ${insertResult.insertedCount}개 삽입 완료`);
    } catch (error) {
        console.error('[Districts] 시딩 실패:', error);
        throw error;
    }
}

/**
 * 표준 질문 데이터 시딩
 */
async function seedStandardQuestions(force: boolean = false) {
    const db = connection.db!;
    const questionsCollection = db.collection('standardquestions');

    try {
        const existingCount = await questionsCollection.countDocuments();

        if (existingCount > 0 && !force) {
            console.log(`[Questions] 데이터가 이미 존재합니다 (${existingCount}개)`);
            console.log('[Questions] 강제 삽입하려면 --force 옵션을 사용하세요');
            return;
        }

        if (force && existingCount > 0) {
            console.log(`[Questions] 기존 데이터 삭제 중... (${existingCount}개)`);
            const deleteResult = await questionsCollection.deleteMany({});
            console.log(`[Questions] ${deleteResult.deletedCount}개 삭제 완료`);
        }

        console.log(`[Questions] 데이터 삽입 중... (${STANDARD_QUESTIONS.length}개)`);
        const insertResult = await questionsCollection.insertMany(STANDARD_QUESTIONS);
        console.log(`[Questions] ${insertResult.insertedCount}개 삽입 완료`);
    } catch (error) {
        console.error('[Questions] 시딩 실패:', error);
        throw error;
    }
}

/**
 * 품종 데이터 시딩
 */
async function seedBreeds(force: boolean = false) {
    const db = connection.db!;
    const breedsCollection = db.collection('breeds');

    try {
        const existingCount = await breedsCollection.countDocuments();

        if (existingCount > 0 && !force) {
            console.log(`[Breeds] 데이터가 이미 존재합니다 (${existingCount}개)`);
            console.log('[Breeds] 강제 삽입하려면 --force 옵션을 사용하세요');
            return;
        }

        if (force && existingCount > 0) {
            console.log(`[Breeds] 기존 데이터 삭제 중... (${existingCount}개)`);
            const deleteResult = await breedsCollection.deleteMany({});
            console.log(`[Breeds] ${deleteResult.deletedCount}개 삭제 완료`);
        }

        console.log(`[Breeds] 데이터 삽입 중... (${KOREA_BREEDS.length}개)`);
        const insertResult = await breedsCollection.insertMany(KOREA_BREEDS);
        console.log(`[Breeds] ${insertResult.insertedCount}개 삽입 완료`);
    } catch (error) {
        console.error('[Breeds] 시딩 실패:', error);
        throw error;
    }
}

/**
 * 배너 데이터 시딩
 */
async function seedBanners(force: boolean = false) {
    const db = connection.db!;
    const bannersCollection = db.collection('banners');

    try {
        const existingCount = await bannersCollection.countDocuments();

        if (existingCount > 0 && !force) {
            console.log(`[Banners] 데이터가 이미 존재합니다 (${existingCount}개)`);
            console.log('[Banners] 강제 삽입하려면 --force 옵션을 사용하세요');
            return;
        }

        if (force && existingCount > 0) {
            console.log(`[Banners] 기존 데이터 삭제 중... (${existingCount}개)`);
            const deleteResult = await bannersCollection.deleteMany({});
            console.log(`[Banners] ${deleteResult.deletedCount}개 삭제 완료`);
        }

        console.log(`[Banners] 데이터 삽입 중... (${bannerData.length}개)`);
        const insertResult = await bannersCollection.insertMany(bannerData);
        console.log(`[Banners] ${insertResult.insertedCount}개 삽입 완료`);
    } catch (error) {
        console.error('[Banners] 시딩 실패:', error);
        throw error;
    }
}

/**
 * FAQ 데이터 시딩
 */
async function seedFaqs(force: boolean = false) {
    const db = connection.db!;
    const faqsCollection = db.collection('faqs');

    try {
        const existingCount = await faqsCollection.countDocuments();

        if (existingCount > 0 && !force) {
            console.log(`[FAQs] 데이터가 이미 존재합니다 (${existingCount}개)`);
            console.log('[FAQs] 강제 삽입하려면 --force 옵션을 사용하세요');
            return;
        }

        if (force && existingCount > 0) {
            console.log(`[FAQs] 기존 데이터 삭제 중... (${existingCount}개)`);
            const deleteResult = await faqsCollection.deleteMany({});
            console.log(`[FAQs] ${deleteResult.deletedCount}개 삭제 완료`);
        }

        console.log(`[FAQs] 데이터 삽입 중... (${faqData.length}개)`);
        const insertResult = await faqsCollection.insertMany(faqData);
        console.log(`[FAQs] ${insertResult.insertedCount}개 삽입 완료`);
    } catch (error) {
        console.error('[FAQs] 시딩 실패:', error);
        throw error;
    }
}

/**
 * 메인 시딩 함수
 */
async function seed(options: SeedOptions) {
    try {
        await connectDB();

        const { breeders = true, districts = true, questions = true, breeds = true, banners = true, faqs = true, force = false } = options;

        console.log('[Seed] 데이터 시딩 시작...\n');
        console.log('='.repeat(50));

        if (breeders) {
            console.log('\n[Seed] 브리더 데이터 시딩');
            console.log('-'.repeat(50));
            await seedBreeders(force);
        }

        if (districts) {
            console.log('\n[Seed] 지역 데이터 시딩');
            console.log('-'.repeat(50));
            await seedDistricts(force);
        }

        if (questions) {
            console.log('\n[Seed] 표준 질문 데이터 시딩');
            console.log('-'.repeat(50));
            await seedStandardQuestions(force);
        }

        if (breeds) {
            console.log('\n[Seed] 품종 데이터 시딩');
            console.log('-'.repeat(50));
            await seedBreeds(force);
        }

        if (banners) {
            console.log('\n[Seed] 배너 데이터 시딩');
            console.log('-'.repeat(50));
            await seedBanners(force);
        }

        if (faqs) {
            console.log('\n[Seed] FAQ 데이터 시딩');
            console.log('-'.repeat(50));
            await seedFaqs(force);
        }

        console.log('\n' + '='.repeat(50));
        console.log('[Seed] 데이터 시딩 완료!');

        await disconnectDB();
        process.exit(0);
    } catch (error) {
        console.error('\n[Seed] 시딩 중 오류 발생:', error);
        await disconnectDB();
        process.exit(1);
    }
}

// CLI 인자 파싱
const args = process.argv.slice(2);
const hasOnlyFlag = args.some(arg => arg.startsWith('--only-'));

const options: SeedOptions = {
    breeders: !hasOnlyFlag,
    districts: !hasOnlyFlag,
    questions: !hasOnlyFlag,
    breeds: !hasOnlyFlag,
    banners: !hasOnlyFlag,
    faqs: !hasOnlyFlag,
    force: args.includes('--force'),
};

// 개별 시딩 옵션
if (args.includes('--only-breeders')) {
    options.breeders = true;
    options.districts = false;
    options.questions = false;
    options.breeds = false;
    options.banners = false;
    options.faqs = false;
}

if (args.includes('--only-districts')) {
    options.breeders = false;
    options.districts = true;
    options.questions = false;
    options.breeds = false;
    options.banners = false;
    options.faqs = false;
}

if (args.includes('--only-questions')) {
    options.breeders = false;
    options.districts = false;
    options.questions = true;
    options.breeds = false;
    options.banners = false;
    options.faqs = false;
}

if (args.includes('--only-breeds')) {
    options.breeders = false;
    options.districts = false;
    options.questions = false;
    options.breeds = true;
    options.banners = false;
    options.faqs = false;
}

if (args.includes('--only-banners')) {
    options.breeders = false;
    options.districts = false;
    options.questions = false;
    options.breeds = false;
    options.banners = true;
    options.faqs = false;
}

if (args.includes('--only-faqs')) {
    options.breeders = false;
    options.districts = false;
    options.questions = false;
    options.breeds = false;
    options.banners = false;
    options.faqs = true;
}

// 도움말
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Pawpong 데이터 시딩 스크립트

사용법:
  yarn seed:all                    # 모든 데이터 시딩
  yarn seed:all --force            # 기존 데이터 삭제 후 재시딩
  yarn seed:all --only-breeders    # 브리더 데이터만 시딩
  yarn seed:all --only-districts   # 지역 데이터만 시딩
  yarn seed:all --only-questions   # 표준 질문 데이터만 시딩
  yarn seed:all --only-breeds      # 품종 데이터만 시딩
  yarn seed:all --only-banners     # 배너 데이터만 시딩
  yarn seed:all --only-faqs        # FAQ 데이터만 시딩

옵션:
  --force              기존 데이터를 삭제하고 재삽입
  --only-breeders      브리더 데이터만 시딩
  --only-districts     지역 데이터만 시딩
  --only-questions     표준 질문 데이터만 시딩
  --only-breeds        품종 데이터만 시딩
  --only-banners       배너 데이터만 시딩
  --only-faqs          FAQ 데이터만 시딩
  --help, -h           도움말 표시
    `);
    process.exit(0);
}

// 스크립트 실행
seed(options);
