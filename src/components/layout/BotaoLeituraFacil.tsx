'use client';

import { Type } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useArmazenado } from '@/lib/cliente/armazenamento';
import { leituraFacil } from '@/lib/cliente/estado';

/** Script executado antes da primeira pintura para aplicar a preferência salva. */
export const SCRIPT_LEITURA_FACIL = `try{if(localStorage.getItem('cp:leitura-facil')==='true')document.documentElement.classList.add('leitura-facil')}catch(e){}`;

export function BotaoLeituraFacil({ className }: { className?: string }) {
  const ativo = useArmazenado(leituraFacil);

  useEffect(() => {
    document.documentElement.classList.toggle('leitura-facil', ativo);
  }, [ativo]);

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      aria-pressed={ativo}
      onClick={() => leituraFacil.gravar(!ativo)}
    >
      <Type className="size-5" aria-hidden />
      {ativo ? 'Desativar leitura fácil' : 'Leitura fácil (letra maior)'}
    </Button>
  );
}
