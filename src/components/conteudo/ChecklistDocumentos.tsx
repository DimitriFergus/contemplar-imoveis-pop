import { FileDown } from 'lucide-react';
import { BASE_PATH } from '@/config/site';
import { Button } from '@/components/ui/button';
import { DOCUMENTOS } from '@/content/jornada';
import { BotaoImprimir } from './BotaoImprimir';

/** PDF gerado no build por scripts/gerar-pdf-checklist.ts. */
export const ARQUIVO_PDF_CHECKLIST = `${BASE_PATH}/documentos/checklist-compra-contemplar.pdf`;

/** Checklist de documentos com PDF para baixar e versão para impressão (CSS @media print). */
export function ChecklistDocumentos() {
  return (
    <div>
      <div
        className="mb-5 flex flex-col gap-4 rounded-2xl bg-info-suave p-4 sm:flex-row sm:items-center sm:justify-between"
        data-nao-imprimir
      >
        <div>
          <p className="font-bold text-primary">Leve esta lista impressa</p>
          <p className="text-[0.95rem] text-foreground">
            O PDF traz os documentos, os valores para separar (entrada, ITBI e cartório), o passo a
            passo e espaço para anotações.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button asChild size="lg" variant="destaque">
            <a href={ARQUIVO_PDF_CHECKLIST} download="checklist-compra-contemplar.pdf">
              <FileDown className="size-5" aria-hidden /> Baixar PDF para imprimir
              <span className="sr-only"> (arquivo PDF, 2 páginas)</span>
            </a>
          </Button>
          <BotaoImprimir />
        </div>
      </div>
      <p className="mb-4 text-muted-foreground" data-nao-imprimir>
        Ou marque aqui mesmo o que você já tem:
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {DOCUMENTOS.map((g) => (
          <fieldset key={g.titulo} className="rounded-2xl border bg-card p-5" data-imprimir-quebra>
            <legend className="px-1 text-lg font-bold">{g.titulo}</legend>
            <ul className="mt-2 space-y-1">
              {g.itens.map((item) => (
                <li key={item}>
                  <label className="flex min-h-11 cursor-pointer items-start gap-3 py-1.5">
                    <input type="checkbox" className="mt-1 size-5 shrink-0" />
                    <span>{item}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Lista de referência. O banco pode pedir outros documentos conforme o seu caso.
      </p>
    </div>
  );
}
