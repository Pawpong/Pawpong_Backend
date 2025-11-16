/**
 * Breed Service 도메인 스웨거 문서
 */
export class BreedServiceSwaggerDocs {
    static readonly getBreeds = {
        summary: '특정 동물 타입의 품종 목록 조회',
        description: `
            'dog'(강아지) 또는 'cat'(고양이) 타입에 해당하는 모든 품종 목록을 조회합니다.
            
            ## Path Parameter
            - **petType**: 'dog' 또는 'cat'
            
            ## 주요 기능
            - 공개(public)된 품종만 반환합니다.
            - 가나다 순으로 정렬하여 반환합니다.
            
            ## 실패 사유
            - petType이 'dog' 또는 'cat'이 아닌 경우 400 Bad Request 에러를 반환합니다.
            
            ## 인증 불필요
            - 이 API는 인증 없이 호출할 수 있습니다.
        `,
    };
}
