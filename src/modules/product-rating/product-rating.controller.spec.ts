import { Test, TestingModule } from '@nestjs/testing';
import { ProductRatingController } from './product-rating.controller';

describe('ProductRatingController', () => {
  let controller: ProductRatingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductRatingController],
    }).compile();

    controller = module.get<ProductRatingController>(ProductRatingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
