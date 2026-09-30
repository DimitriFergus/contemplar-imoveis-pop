import { Loader2 } from 'lucide-react';

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <p className="flex items-center justify-center gap-2 py-16 text-muted-foreground" role="status">
      <Loader2 className="size-5 animate-spin" aria-hidden /> {texto}
    </p>
  );
}
