'use client';

import { Save } from 'lucide-react';
import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { atualizarLead, type EstadoLead } from '@/lib/admin/acoes-leads';
import { ROTULO_ETAPA } from '@/lib/admin/rotulos';
import { ETAPAS_LEAD, type EtapaLead } from '@/lib/supabase/tipos';
import { AreaTexto, Aviso, Campo, Selecao } from './ui';
import { Input } from '@/components/ui/input';

export function FormularioLeadPainel({
  id,
  etapa,
  observacoes,
  motivoPerda,
  corretorId,
  corretores,
}: {
  id: string;
  etapa: EtapaLead;
  observacoes: string;
  motivoPerda: string;
  corretorId: string;
  corretores: { id: string; nome: string }[] | null;
}) {
  const [estado, acao, salvando] = useActionState<EstadoLead, FormData>(
    atualizarLead.bind(null, id),
    {},
  );
  const [etapaAtual, setEtapaAtual] = useState(etapa);

  return (
    <form action={acao} className="space-y-4">
      <Campo rotulo="Etapa do funil" id="etapa">
        <Selecao
          id="etapa"
          name="etapa"
          value={etapaAtual}
          onChange={(e) => setEtapaAtual(e.target.value as EtapaLead)}
        >
          {ETAPAS_LEAD.map((e) => (
            <option key={e} value={e}>
              {ROTULO_ETAPA[e]}
            </option>
          ))}
        </Selecao>
      </Campo>
      {etapaAtual === 'perdido' && (
        <Campo rotulo="Motivo da perda" id="motivo_perda" obrigatorio>
          <Input
            id="motivo_perda"
            name="motivo_perda"
            defaultValue={motivoPerda}
            placeholder="Ex.: crédito não aprovado"
          />
        </Campo>
      )}
      {corretores && (
        <Campo rotulo="Corretor responsável" id="corretor_id">
          <Selecao id="corretor_id" name="corretor_id" defaultValue={corretorId}>
            <option value="">Sem corretor</option>
            {corretores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Selecao>
        </Campo>
      )}
      <Campo rotulo="Observações" id="observacoes" ajuda="Anotações internas do atendimento.">
        <AreaTexto id="observacoes" name="observacoes" rows={6} defaultValue={observacoes} />
      </Campo>
      {estado.erro && <Aviso tom="erro">{estado.erro}</Aviso>}
      {estado.ok && <Aviso tom="sucesso">{estado.ok}</Aviso>}
      <Button type="submit" className="w-full" disabled={salvando}>
        <Save aria-hidden /> {salvando ? 'Salvando…' : 'Salvar'}
      </Button>
    </form>
  );
}
