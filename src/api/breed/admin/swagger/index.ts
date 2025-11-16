/**
 * Breed Admin 도메인 스웨거 문서
 */
export class BreedAdminSwaggerDocs {
    static readonly createBreed = {
        summary: '품종 생성 (관리자)',
        description: `
            새로운 품종을 시스템에 추가합니다.
            
            ## 요청 본문
            - animalType: 동물 종류 ('dog' 또는 'cat')
            - breedName: 품종의 한글 이름 (예: '골든 리트리버')
            - breedNameEn: 품종의 영어 이름 (예: 'Golden Retriever')
            - description: 품종에 대한 설명
            - isPublic: 품종 공개 여부 (기본값: true)
            
            ## 권한
            - 관리자(admin) 권한이 필요합니다.
        `,
    };

    static readonly getAllBreeds = {
        summary: '모든 품종 조회 (관리자)',
        description: `
            시스템에 등록된 모든 품종 목록을 조회합니다.
            
            ## 주요 기능
            - 비공개 상태의 품종도 함께 반환됩니다.
            
            ## 권한
            - 관리자(admin) 권한이 필요합니다.
        `,
    };

    static readonly getBreedById = {
        summary: '특정 품종 조회 (관리자)',
        description: `
            ID를 사용하여 특정 품종의 상세 정보를 조회합니다.
            
            ## 권한
            - 관리자(admin) 권한이 필요합니다.
        `,
    };

    static readonly updateBreed = {
        summary: '품종 정보 수정 (관리자)',
        description: `
            기존 품종의 정보를 수정합니다.
            
            ## 수정 가능 필드
            - breedName: 품종 한글 이름
            - breedNameEn: 품종 영어 이름
            - description: 품종 설명
            - isPublic: 공개 여부
            
            ## 참고
            - animalType은 수정할 수 없습니다.
            
            ## 권한
            - 관리자(admin) 권한이 필요합니다.
        `,
    };

    static readonly deleteBreed = {
        summary: '품종 삭제 (관리자)',
        description: `
            ID를 사용하여 특정 품종을 시스템에서 삭제합니다.
            
            ## 주의사항
            - 이 작업은 되돌릴 수 없습니다.
            - 해당 품종과 연결된 데이터가 있을 경우 문제가 발생할 수 있습니다.
            
            ## 권한
            - 관리자(admin) 권한이 필요합니다.
        `,
    };
}
