import { listarPendencias } from '@/config/pendencias';

/** Alerta visual só em desenvolvimento, enquanto houver campos A_DEFINIR. */
export function AlertaPendencias() {
  if (process.env.NODE_ENV !== 'development') return null;
  const pendencias = listarPendencias();
  if (pendencias.length === 0) return null;
  return (
    <details
      className="fixed bottom-24 left-3 z-50 max-w-[calc(100vw-1.5rem)] rounded-xl border-2 border-dashed border-destructive bg-background p-3 text-sm shadow-lg sm:max-w-md lg:bottom-3"
      data-nao-imprimir
    >
      <summary className="cursor-pointer font-bold text-destructive">
        ⚠ {pendencias.length} campos A_DEFINIR (só aparece em desenvolvimento)
      </summary>
      <ul className="mt-2 max-h-64 list-disc space-y-1 overflow-y-auto pl-5">
        {pendencias.map((p) => (
          <li key={p.campo}>
            <strong>{p.descricao}</strong> — <code>{p.campo}</code> em <code>{p.onde}</code>
          </li>
        ))}
      </ul>
    </details>
  );
}
