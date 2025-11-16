/**
 * StandardQuestion Admin 도메인 스웨거 문서
 */
export class StandardQuestionAdminSwaggerDocs {
    static readonly getAllStandardQuestions = {
        summary: '표준 질문 목록 조회 (관리자용)',
        description: `
            모든 표준 질문 목록을 조회합니다.
            
            ## 주요 기능
            - 비활성화된 질문을 포함한 모든 표준 질문을 반환합니다.
            - 관리자(admin) 권한이 필요합니다.
            
            ## 응답
            - 표준 질문 객체 배열 (StandardQuestionResponseDto[])
        `,
    };

    static readonly updateStandardQuestion = {
        summary: '표준 질문 수정',
        description: `
            특정 ID를 가진 표준 질문의 내용을 수정합니다.
            
            ## 수정 가능 필드
            - type: 질문 타입
            - label: 질문 내용
            - required: 필수 여부
            - options: 선택지 (선택형 질문의 경우)
            - placeholder: 플레이스홀더
            - description: 추가 설명
            
            ## 참고
            - 'id'와 'order' 필드는 수정할 수 없습니다.
            - 관리자(admin) 권한이 필요합니다.
        `,
    };

    static readonly toggleStandardQuestionStatus = {
        summary: '표준 질문 활성화/비활성화',
        description: `
            특정 ID를 가진 표준 질문의 활성화 상태를 변경합니다.
            
            ## 요청 본문
            - isActive: 'true'로 설정 시 활성화, 'false'로 설정 시 비활성화됩니다.
            
            ## 참고
            - 관리자(admin) 권한이 필요합니다.
        `,
    };

    static readonly reorderStandardQuestions = {
        summary: '표준 질문 순서 변경',
        description: `
            표준 질문들의 순서를 일괄적으로 변경합니다.
            
            ## 요청 본문
            - reorderData: 질문의 'id'와 새로운 'order'를 담은 객체 배열
            
            ## 참고
            - 배열에 포함된 모든 질문의 순서가 한 번에 업데이트됩니다.
            - 관리자(admin) 권한이 필요합니다.
        `,
    };

    static readonly reseedStandardQuestions = {
        summary: '표준 질문 재시딩',
        description: `
            모든 표준 질문을 시스템 초기 상태로 되돌립니다.
            
            ## 주의사항
            - **이 API는 기존의 모든 표준 질문 데이터를 삭제하고 초기값으로 덮어씁니다.**
            - 운영 환경에서는 극히 주의해서 사용해야 합니다.
            - 데이터 복구가 필요할 수 있으므로 실행 전 백업을 권장합니다.
            - 관리자(admin) 권한이 필요합니다.
        `,
    };
}

/**
 * StandardQuestion Admin 요청 예시
 */
export const STANDARD_QUESTION_ADMIN_REQUEST_EXAMPLES = {
    update: {
        label: '반려동물을 키워본 경험이 있으신가요?',
        required: true,
    },
    toggleStatus: {
        isActive: false,
    },
    reorder: {
        reorderData: [
            { id: 'privacyConsent', order: 2 },
            { id: 'experience', order: 1 },
        ],
    },
};

/**
 * StandardQuestion Admin 응답 예시
 */
export const STANDARD_QUESTION_ADMIN_RESPONSE_EXAMPLE = {
    singleQuestion: {
        id: 'experience',
        type: 'radio',
        label: '반려동물을 키워본 경험이 있으신가요?',
        required: true,
        order: 1,
        isActive: true,
        options: ['예', '아니오'],
        placeholder: null,
        description: '강아지, 고양이 등 모든 반려동물 경험을 포함합니다.',
    },
    questionList: [
        {
            id: 'experience',
            type: 'radio',
            label: '반려동물을 키워본 경험이 있으신가요?',
            required: true,
            order: 1,
            isActive: true,
            options: ['예', '아니오'],
            placeholder: null,
            description: '강아지, 고양이 등 모든 반려동물 경험을 포함합니다.',
        },
        {
            id: 'privacyConsent',
            type: 'checkbox',
            label: '개인정보 수집 및 이용에 동의하시나요?',
            required: true,
            order: 2,
            isActive: true,
            options: ['동의합니다'],
            placeholder: null,
            description: '개인정보는 입양 심사 목적으로만 사용됩니다.',
        },
    ],
};
