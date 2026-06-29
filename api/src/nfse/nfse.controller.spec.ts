import { Test, TestingModule } from '@nestjs/testing';
import { NfseController } from './nfse.controller';

describe('NfseController', () => {
  let controller: NfseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NfseController],
    }).compile();

    controller = module.get<NfseController>(NfseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
