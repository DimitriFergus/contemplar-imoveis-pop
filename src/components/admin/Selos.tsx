import {
  COR_ETAPA,
  COR_STATUS_PAINEL,
  ROTULO_ETAPA,
  ROTULO_STATUS_PAINEL,
} from '@/lib/admin/rotulos';
import type { StatusPainel } from '@/lib/schemas/imovel';
import type { EtapaLead } from '@/lib/supabase/tipos';
import { cn } from '@/lib/utils';

export function SeloStatus({ status }: { status: StatusPainel }) {
  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold', COR_STATUS_PAINEL[status])}>
      {ROTULO_STATUS_PAINEL[status]}
    </span>
  );
}

export function SeloEtapa({ etapa }: { etapa: EtapaLead }) {
  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold', COR_ETAPA[etapa])}>
      {ROTULO_ETAPA[etapa]}
    </span>
  );
}
