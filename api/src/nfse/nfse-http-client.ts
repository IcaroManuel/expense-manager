import * as fs from 'fs';
import * as https from 'https';
import axios, { AxiosInstance } from 'axios';
import { NfseConfig } from './dto/nfse-config';
export function createNfseHttpClient(config: NfseConfig): AxiosInstance {
  const pfx = fs.readFileSync(config.certificado.pfxPath);

  const httpsAgent = new https.Agent({
    pfx,
    passphrase: config.certificado.passphrase,
  });

  return axios.create({
    baseURL: config.ambiente.baseUrl,
    httpsAgent,
    timeout: 30_000,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
