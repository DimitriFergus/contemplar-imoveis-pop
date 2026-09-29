import { BotaoWhatsApp } from '@/components/comum/BotaoWhatsApp';
import { formatarPreco } from '@/lib/utils/formatar';
import { mensagemImovel } from '@/lib/utils/whatsapp';
import type { Foto } from '@/types';
import { AgendarVisita } from './AgendarVisita';
import { BotaoComparar } from './BotaoComparar';
import { BotaoCompartilhar } from './BotaoCompartilhar';
import { BotaoFavoritar } from './BotaoFavoritar';
import { PrecoParcela } from './PrecoParcela';

interface Props {
  id: string;
  codigo: string;
  titulo: string;
  preco: number;
  parcela: number;
  disponivel: boolean;
  bairro: string;
  foto: Foto | null;
  modo: 'lateral' | 'barra';
}

/** Cartão de ações: lateral fixa no desktop e barra fixa no rodapé do celular. */
export function AcoesImovel({
  id,
  codigo,
  titulo,
  preco,
  parcela,
  disponivel,
  bairro,
  foto,
  modo,
}: Props) {
  const imovel = { codigo, titulo, preco, bairro, foto };
  const mensagem = mensagemImovel({ codigo, titulo });
  const textoCompartilhar = `${titulo} — ${formatarPreco(preco)} (cód. ${codigo})`;
  if (modo === 'lateral') {
    return (
      <div className="rounded-2xl border bg-card p-5 shadow-card">
        <PrecoParcela preco={preco} parcela={parcela} />
        <p className="mt-1 text-sm text-muted-foreground">Cód. {codigo}</p>
        <div className="mt-4 flex flex-col gap-2.5">
          <BotaoWhatsApp
            mensagem={mensagem}
            local="anuncio_lateral"
            codigoImovel={codigo}
            rotulo="Tenho interesse (WhatsApp)"
            size="lg"
          />
          {disponivel && <AgendarVisita {...imovel} mensagemWhatsApp={mensagem} />}
          <div className="grid grid-cols-2 gap-2">
            <BotaoFavoritar id={id} codigo={codigo} variante="texto" />
            <BotaoCompartilhar titulo={titulo} texto={textoCompartilhar} codigo={codigo} />
          </div>
          <BotaoComparar id={id} codigo={codigo} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-3 py-2.5 shadow-[0_-4px_16px_rgb(0_0_0/0.08)] backdrop-blur lg:hidden"
      data-nao-imprimir
    >
      <div className="mx-auto flex max-w-xl items-center gap-2">
        <BotaoWhatsApp
          mensagem={mensagem}
          local="anuncio_rodape"
          codigoImovel={codigo}
          rotulo="WhatsApp"
          className="min-w-0 flex-1 px-3"
        />
        {disponivel && (
          <AgendarVisita
            {...imovel}
            mensagemWhatsApp={mensagem}
            tamanho="default"
            rotulo="Agendar"
            className="min-w-0 flex-1 px-3"
          />
        )}
        <BotaoFavoritar id={id} codigo={codigo} className="shrink-0 bg-muted shadow-none" />
      </div>
    </div>
  );
}
