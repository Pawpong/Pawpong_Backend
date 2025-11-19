/**
 * FAQ 초기 데이터
 */
export const faqData = [
    // 입양자용 FAQ
    {
        question: '입양 신청은 어떻게 하나요?',
        answer: '원하시는 브리더의 프로필을 방문하여 "상담 신청하기" 버튼을 클릭하시면 됩니다. 신청서 작성 후 브리더가 검토하여 연락드립니다.',
        category: 'adoption',
        userType: 'adopter',
        order: 1,
        isActive: true,
    },
    {
        question: '입양 비용은 어떻게 되나요?',
        answer: '브리더마다 분양가가 다르며, 품종, 혈통, 건강 상태 등에 따라 결정됩니다. 각 브리더 프로필에서 가격 범위를 확인하실 수 있습니다.',
        category: 'payment',
        userType: 'adopter',
        order: 2,
        isActive: true,
    },
    {
        question: '건강 보증은 어떻게 되나요?',
        answer: '모든 브리더는 분양 시 건강검진 결과서와 예방접종 증명서를 제공합니다. 추가적인 건강 보증 조건은 브리더마다 다를 수 있습니다.',
        category: 'service',
        userType: 'adopter',
        order: 3,
        isActive: true,
    },
    {
        question: '입양 후 문제가 생기면 어떻게 하나요?',
        answer: '입양 후 문제 발생 시 먼저 브리더에게 연락하시고, 해결이 안 될 경우 고객센터로 문의해 주세요. 플랫폼에서 중재를 도와드립니다.',
        category: 'service',
        userType: 'adopter',
        order: 4,
        isActive: true,
    },
    {
        question: '여러 브리더에게 동시에 신청할 수 있나요?',
        answer: '네, 가능합니다. 하지만 각 브리더별로 하나의 대기 중인 신청만 유지할 수 있습니다.',
        category: 'adoption',
        userType: 'adopter',
        order: 5,
        isActive: true,
    },
    {
        question: '입양 전 미리 만나볼 수 있나요?',
        answer: '대부분의 브리더가 사전 방문을 허용합니다. 상담 신청 후 브리더와 일정을 조율하시면 됩니다.',
        category: 'adoption',
        userType: 'adopter',
        order: 6,
        isActive: true,
    },

    // 브리더용 FAQ
    {
        question: '브리더 등록은 어떻게 하나요?',
        answer: '회원가입 후 브리더 인증 신청을 하시면 됩니다. 사업자등록증, 동물등록증 등의 서류 제출이 필요하며, 검토 후 승인됩니다.',
        category: 'breeder',
        userType: 'breeder',
        order: 1,
        isActive: true,
    },
    {
        question: '브리더 인증에 필요한 서류는 무엇인가요?',
        answer: '사업자등록증, 동물등록증, 시설 사진, 건강검진 결과서 등이 필요합니다. 자세한 내용은 인증 신청 페이지에서 확인하실 수 있습니다.',
        category: 'breeder',
        userType: 'breeder',
        order: 2,
        isActive: true,
    },
    {
        question: '수수료는 어떻게 되나요?',
        answer: '플랫폼 이용료는 무료이며, 성사된 입양 건에 대해서만 일정 비율의 수수료가 부과됩니다. 자세한 요율은 별도 문의 바랍니다.',
        category: 'payment',
        userType: 'breeder',
        order: 3,
        isActive: true,
    },
    {
        question: '입양 신청이 들어오면 어떻게 하나요?',
        answer: '대시보드에서 새로운 신청을 확인하실 수 있습니다. 신청서를 검토하시고 상담 일정을 잡거나 거절하실 수 있습니다.',
        category: 'adoption',
        userType: 'breeder',
        order: 4,
        isActive: true,
    },
    {
        question: '프로필은 어떻게 관리하나요?',
        answer: '마이페이지에서 언제든지 프로필, 시설 사진, 분양 가능한 개체 정보를 수정하실 수 있습니다.',
        category: 'breeder',
        userType: 'breeder',
        order: 5,
        isActive: true,
    },
    {
        question: '부적절한 신청자는 어떻게 대응하나요?',
        answer: '신청을 거절하실 수 있으며, 심각한 경우 신고 기능을 이용해 주세요. 플랫폼에서 적절한 조치를 취하겠습니다.',
        category: 'adoption',
        userType: 'breeder',
        order: 6,
        isActive: true,
    },
];
