export class BaseQueryDto {
  search = '';

  page: number = 1;

  pageSize: number = 10;

  order: 'ASC' | 'DESC' = 'ASC';

  sortBy: string = 'createdAt';
}
