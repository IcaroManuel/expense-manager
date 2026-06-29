export interface NfseConfig {
  ambiente: {
    // 'homologacao' usa Produção Restrita; 'producao' usa o ambiente real
    tipo: 'homologacao' | 'producao';
    baseUrl: string; // ex: https://adn.producaorestrita.nfse.gov.br ou produção
  };
  certificado: {
    pfxPath: string; // caminho absoluto do arquivo .pfx (A1)
    passphrase: string;
  };
  prestador: {
    cnpj: string; // só números
    inscricaoMunicipal?: string;
    codigoMunicipio: string; // código IBGE do município (ex: Fortaleza = 2304400)
    razaoSocial: string;
  };
  tomador: {
    cnpj: string; // CNPJ do tomador fixo (ex: Avine)
    razaoSocial: string;
    codigoMunicipio: string;
  };
  servico: {
    codigoServico: string; // código do item da lista de serviços (LC 116) usado no contrato
    discriminacao: string; // descrição do serviço prestado
    valor: number; // valor fixo mensal
    aliquotaIss?: number; // se souber a alíquota do município
  };
  job: {
    diaDoMes: number; // dia em que a nota deve ser emitida (ex: 5)
  };
}

export function loadNfseConfig(): NfseConfig {
  const required = (name: string): string => {
    const v = process.env[name];
    if (!v) throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
    return v;
  };

  return {
    ambiente: {
      tipo: (process.env.NFSE_AMBIENTE as 'homologacao' | 'producao') || 'homologacao',
      baseUrl: required('NFSE_BASE_URL'),
    },
    certificado: {
      pfxPath: required('NFSE_PFX_PATH'),
      passphrase: required('NFSE_PFX_PASSPHRASE'),
    },
    prestador: {
      cnpj: required('NFSE_PRESTADOR_CNPJ'),
      inscricaoMunicipal: process.env.NFSE_PRESTADOR_IM,
      codigoMunicipio: required('NFSE_PRESTADOR_MUNICIPIO'),
      razaoSocial: required('NFSE_PRESTADOR_RAZAO_SOCIAL'),
    },
    tomador: {
      cnpj: required('NFSE_TOMADOR_CNPJ'),
      razaoSocial: required('NFSE_TOMADOR_RAZAO_SOCIAL'),
      codigoMunicipio: required('NFSE_TOMADOR_MUNICIPIO'),
    },
    servico: {
      codigoServico: required('NFSE_SERVICO_CODIGO'),
      discriminacao: required('NFSE_SERVICO_DESCRICAO'),
      valor: Number(required('NFSE_SERVICO_VALOR')),
      aliquotaIss: process.env.NFSE_SERVICO_ALIQUOTA
        ? Number(process.env.NFSE_SERVICO_ALIQUOTA)
        : undefined,
    },
    job: {
      diaDoMes: Number(process.env.NFSE_JOB_DIA || 5),
    },
  };
}
