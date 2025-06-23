export class NewCreateProductDto {
  name: string;

  productOptions: ProductOptionDto[];
}

export class ProductOptionDto {
  id: string;
  name: string;
  values: string[];
  optionValues?: ProductOptionValue[] | null;
}

export interface ProductOptionValue {
  id?: string | null;
  name: string;
  productOptionId?: string | null;
}
