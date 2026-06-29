import { create } from 'xmlbuilder2';
import { NfseConfig } from './dto/nfse-config';

export interface DpsIdentificacao {
  numeroDps: string; // sequencial único por prestador — você controla isso no seu banco
  serie: string; // ex: "1"
  dataCompetencia: string; // YYYY-MM-DD (mês de referência do serviço)
}

export function buildDpsXml(config: NfseConfig, ident: DpsIdentificacao): string {
  const cnpjPrestador = config.prestador.cnpj.replace(/\D/g, '');
  const cnpjTomador = config.tomador.cnpj.replace(/\D/g, '');

  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('DPS', { xmlns: 'http://www.sped.fazenda.gov.br/nfse' })
    .ele('infDPS', {
      Id: `DPS${config.prestador.codigoMunicipio}${cnpjPrestador}${ident.serie}${ident.numeroDps}`,
    })
    .ele('tpAmb').txt(config.ambiente.tipo === 'producao' ? '1' : '2').up()
    .ele('dhEmi').txt(new Date().toISOString()).up()
    .ele('verAplic').txt('1.00').up()
    .ele('serie').txt(ident.serie).up()
    .ele('nDPS').txt(ident.numeroDps).up()
    .ele('dCompet').txt(ident.dataCompetencia).up()
    .ele('tpEmit').txt('1').up() // 1 = emissão pelo prestador
    .ele('cLocEmi').txt(config.prestador.codigoMunicipio).up()
    .ele('prest')
      .ele('CNPJ').txt(cnpjPrestador).up()
      .ele('xNome').txt(config.prestador.razaoSocial).up()
      .ele('cMunFG').txt(config.prestador.codigoMunicipio).up()
    .up()
    .ele('toma')
      .ele('CNPJ').txt(cnpjTomador).up()
      .ele('xNome').txt(config.tomador.razaoSocial).up()
      .ele('cMunFG').txt(config.tomador.codigoMunicipio).up()
    .up()
    .ele('serv')
      .ele('cTribNac').txt(config.servico.codigoServico).up()
      .ele('xDescServ').txt(config.servico.discriminacao).up()
    .up()
    .ele('valores')
      .ele('vServPrest')
        .ele('vServ').txt(config.servico.valor.toFixed(2)).up()
      .up()
      .ele('trib')
        .ele('tribMun')
          .ele('tribISSQN').txt('1').up() // 1 = operação tributável
          .ele('pAliq').txt((config.servico.aliquotaIss ?? 0).toFixed(2)).up()
        .up()
      .up()
    .up();

  return doc.end({ prettyPrint: false });
}
