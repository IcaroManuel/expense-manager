import { Injectable, Logger } from '@nestjs/common';
import * as zlib from 'zlib';
import { PrismaService } from '../prisma/prisma.service';
import { loadNfseConfig, NfseConfig } from './dto/nfse-config';
import { createNfseHttpClient } from './nfse-http-client';
import { extractKeyAndCertFromPfx, signDpsXml } from './xml-signer';
import { buildDpsXml } from './dps-builder';

@Injectable()
export class NfseService {
  private readonly logger = new Logger(NfseService.name);
  private readonly config: NfseConfig;

  constructor(private readonly prisma: PrismaService) {
    this.config = loadNfseConfig();
  }

  async issueForCurrentMonth(): Promise<void> {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;

    const existing = await this.prisma.nfseEmission.findUnique({
      where: { year_month: { year, month } },
    });

    if (existing?.status === 'SUCCESS') {
      this.logger.log(`NFS-e de ${month}/${year} já emitida (id ${existing.id}). Pulando.`);
      return;
    }

    const numeroDps = await this.nextNumeroDps();

    const emission = await this.prisma.nfseEmission.upsert({
      where: { year_month: { year, month } },
      create: { year, month, numeroDps, status: 'PROCESSING' },
      update: { status: 'PROCESSING', numeroDps },
    });

    try {
      const xml = buildDpsXml(this.config, {
        numeroDps,
        serie: '1',
        dataCompetencia: `${year}-${String(month).padStart(2, '0')}-01`,
      });

      const keyAndCert = extractKeyAndCertFromPfx(this.config);
      const signedXml = signDpsXml(xml, keyAndCert, "//*[local-name(.)='infDPS']");

      const gzipped = zlib.gzipSync(Buffer.from(signedXml, 'utf-8'));
      const base64Dps = gzipped.toString('base64');

      const client = createNfseHttpClient(this.config);
      const response = await this.withRetry(() =>
        client.post('/nfse', { dpsXmlGZipB64: base64Dps }),
      );

      await this.prisma.nfseEmission.update({
        where: { id: emission.id },
        data: {
          status: 'SUCCESS',
          chaveAcesso: response.data?.chaveAcesso ?? null,
          rawResponse: response.data,
        },
      });

      this.logger.log(`NFS-e de ${month}/${year} emitida com sucesso.`);
    } catch (err: any) {
      await this.prisma.nfseEmission.update({
        where: { id: emission.id },
        data: {
          status: 'FAILED',
          errorMessage: err?.response?.data ? JSON.stringify(err.response.data) : err.message,
        },
      });
      this.logger.error(`Falha ao emitir NFS-e de ${month}/${year}: ${err.message}`);
      // Re-lança para o script de cron sair com código de erro e disparar alerta
      throw err;
    }
  }

  private async nextNumeroDps(): Promise<string> {
    const last = await this.prisma.nfseEmission.findFirst({
      orderBy: { numeroDps: 'desc' },
    });
    const lastNumber = last ? parseInt(last.numeroDps, 10) : 0;
    return String(lastNumber + 1);
  }

  private async withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
    let lastError: any;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        const status = err?.response?.status;
        // 409 = duplicidade (não adianta retry); 400 = payload inválido (não adianta retry)
        if (status === 409 || status === 400) throw err;
        const backoffMs = 1000 * 2 ** i;
        this.logger.warn(`Tentativa ${i + 1} falhou (${status ?? err.message}), retry em ${backoffMs}ms`);
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }
    throw lastError;
  }
}
