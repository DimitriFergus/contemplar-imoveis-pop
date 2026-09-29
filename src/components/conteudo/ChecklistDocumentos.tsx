import { DOCUMENTOS } from '@/content/jornada';
import { BotaoImprimir } from './BotaoImprimir';

/** Checklist de documentos com versão para impressão (CSS @media print). */
export function ChecklistDocumentos() {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3" data-nao-imprimir>
        <p className="text-muted-foreground">
          Marque o que você já tem. Dá para imprimir e levar na mão.
        </p>
        <BotaoImprimir />
      </div>
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
