import { Test, TestingModule } from '@nestjs/testing';
import { NfseService } from './nfse.service';

describe('NfseService', () => {
  let service: NfseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NfseService],
    }).compile();

    service = module.get<NfseService>(NfseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
