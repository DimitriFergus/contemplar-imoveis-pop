'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BotaoImprimir() {
  return (
    <Button type="button" variant="outline" onClick={() => window.print()}>
      <Printer className="size-5" aria-hidden /> Imprimir checklist
    </Button>
  );
}
