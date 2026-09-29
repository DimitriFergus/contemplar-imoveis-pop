import { CONTATO, MENSAGENS_WHATSAPP, estaDefinido } from '@/config/site';
import { descreverOrigem, type UTM } from './utm';

export function preencher(modelo: string, valores: Record<string, string>): string {
  return modelo.replace(/\{(\w+)\}/g, (_, chave: string) => valores[chave] ?? '');
}

/** Acrescenta a origem da campanha (UTM) à mensagem, quando houver. */
export function comOrigem(mensagem: string, utm?: UTM | null): string {
  const origem = descreverOrigem(utm);
  return origem ? mensagem + preencher(MENSAGENS_WHATSAPP.sufixoOrigem, { origem }) : mensagem;
}

export function mensagemImovel(
  imovel: { codigo: string; titulo: string },
  utm?: UTM | null,
): string {
  return comOrigem(
    preencher(MENSAGENS_WHATSAPP.imovel, { codigo: imovel.codigo, titulo: imovel.titulo }),
    utm,
  );
}

/**
 * Link do WhatsApp com mensagem pré-preenchida. Se o número ainda não foi configurado,
 * abre o WhatsApp para a pessoa escolher o contato (e o site mostra alerta em desenvolvimento).
 */
export function linkWhatsApp(mensagem: string, numero: string = CONTATO.whatsapp): string {
  const texto = encodeURIComponent(mensagem);
  const digitos = numero.replace(/\D/g, '');
  return estaDefinido(numero) && digitos.length >= 12
    ? `https://wa.me/${digitos}?text=${texto}`
    : `https://wa.me/?text=${texto}`;
}
