import { PaginationResponseDto } from '../../../common/dto/pagination/pagination-response.dto';
import { BreederCardResponseDto } from './breeder-card-response.dto';

export class BreederExploreResponseDto extends PaginationResponseDto<BreederCardResponseDto> {}
