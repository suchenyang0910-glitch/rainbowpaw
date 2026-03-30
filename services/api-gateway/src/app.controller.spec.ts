import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: { products: jest.Mock };

  beforeEach(async () => {
    appService = { products: jest.fn() };
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: appService }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('products() should call AppService.products()', () => {
    const fake = [{ id: 'p1' }];
    appService.products.mockReturnValue(fake);
    expect(appController.products()).toBe(fake);
    expect(appService.products).toHaveBeenCalledTimes(1);
  });
});
