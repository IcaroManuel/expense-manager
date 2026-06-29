import * as fs from 'fs';
import forge from 'node-forge';
import { SignedXml } from 'xml-crypto';
import { NfseConfig } from './dto/nfse-config';

interface KeyAndCert {
  privateKeyPem: string;
  certPem: string;
}

export function extractKeyAndCertFromPfx(config: NfseConfig): KeyAndCert {
  const pfxBuffer = fs.readFileSync(config.certificado.pfxPath);
  const pfxAsn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'));
  const p12 = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, config.certificado.passphrase);

  let privateKeyPem = '';
  let certPem = '';

  for (const safeContents of p12.safeContents) {
    for (const safeBag of safeContents.safeBags) {
      if (safeBag.type === forge.pki.oids.pkcs8ShroudedKeyBag && safeBag.key) {
        privateKeyPem = forge.pki.privateKeyToPem(safeBag.key);
      }
      if (safeBag.type === forge.pki.oids.certBag && safeBag.cert) {
        certPem = forge.pki.certificateToPem(safeBag.cert);
      }
    }
  }

  if (!privateKeyPem || !certPem) {
    throw new Error(
      'Não foi possível extrair chave privada/certificado do .pfx — confira a senha e o arquivo.',
    );
  }

  return { privateKeyPem, certPem };
}

export function signDpsXml(
  xml: string,
  keyAndCert: KeyAndCert,
  referenceXPath: string,
): string {
  const sig = new SignedXml({
    privateKey: keyAndCert.privateKeyPem,
    publicCert: keyAndCert.certPem,
  });

  sig.addReference({
    xpath: referenceXPath,
    digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256',
    transforms: [
      'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
      'http://www.w3.org/2001/10/xml-exc-c14n#',
    ],
  });

  sig.signatureAlgorithm = 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256';
  sig.canonicalizationAlgorithm = 'http://www.w3.org/2001/10/xml-exc-c14n#';

  sig.computeSignature(xml);
  return sig.getSignedXml();
}
