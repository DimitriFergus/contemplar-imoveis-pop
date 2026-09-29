import { CUSTOS_POR_MUNICIPIO } from './custos-aquisicao';
import { FAIXAS, TETO_FAIXA_1_2_MUNICIPIO } from './financiamento';
import { CIDADE_BASE_DEFINIDA, CONTATO, EMPRESA, estaDefinido } from './site';

export interface Pendencia {
  campo: string;
  onde: string;
  descricao: string;
}

/** Lista o que ainda está como A_DEFINIR. Usada no alerta visual (desenvolvimento). */
export function listarPendencias(): Pendencia[] {
  const p: Pendencia[] = [];
  const conferir = (valor: string, campo: string, onde: string, descricao: string) => {
    if (!estaDefinido(valor)) p.push({ campo, onde, descricao });
  };
  conferir(
    EMPRESA.nomeEmpresarial,
    'EMPRESA.nomeEmpresarial',
    'src/config/site.ts',
    'Nome empresarial (razão social)',
  );
  conferir(EMPRESA.cnpj, 'EMPRESA.cnpj', 'src/config/site.ts', 'CNPJ');
  conferir(EMPRESA.creciPJ, 'EMPRESA.creciPJ', 'src/config/site.ts', 'CRECI da pessoa jurídica');
  conferir(EMPRESA.endereco, 'EMPRESA.endereco', 'src/config/site.ts', 'Endereço comercial');
  conferir(CONTATO.whatsapp, 'CONTATO.whatsapp', 'src/config/site.ts', 'Número do WhatsApp');
  conferir(
    CONTATO.telefoneExibicao,
    'CONTATO.telefoneExibicao',
    'src/config/site.ts',
    'Telefone exibido',
  );
  conferir(CONTATO.email, 'CONTATO.email', 'src/config/site.ts', 'E-mail de contato');
  if (!CIDADE_BASE_DEFINIDA)
    p.push({
      campo: 'CIDADE_BASE / UF_BASE / BAIRROS_EXEMPLO / CENTRO_MAPA',
      onde: 'src/config/site.ts',
      descricao: 'Cidade base, bairros e centro do mapa',
    });
  if (!TETO_FAIXA_1_2_MUNICIPIO.definido)
    p.push({
      campo: 'TETO_FAIXA_1_2_MUNICIPIO',
      onde: 'src/config/financiamento.ts',
      descricao: 'Teto MCMV Faixas 1 e 2 do município',
    });
  if (CUSTOS_POR_MUNICIPIO.some((c) => !c.itbi.definido))
    p.push({
      campo: 'CUSTOS_POR_MUNICIPIO (ITBI e cartório)',
      onde: 'src/config/custos-aquisicao.ts',
      descricao: 'Alíquota de ITBI e custos de cartório do município',
    });
  if (FAIXAS.some((f) => f.id === 'sbpe'))
    p.push({
      campo: 'Taxa SBPE de referência',
      onde: 'src/config/financiamento.ts',
      descricao: 'Confirmar taxa de mercado com os bancos parceiros',
    });
  return p;
}
