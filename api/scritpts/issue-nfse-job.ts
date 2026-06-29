import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { NfseService } from 'src/nfse/nfse.service';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  try {
    const nfseService = app.get(NfseService);
    await nfseService.issueForCurrentMonth();
    process.exitCode = 0;
  } catch (err) {
    console.error('Job de emissão de NFS-e falhou:', err);
    process.exitCode = 1;
    await app.close();
  }
}

run();
