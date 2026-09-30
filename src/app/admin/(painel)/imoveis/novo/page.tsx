'use client';

import Link from 'next/link';
import { Carregando } from '@/components/admin/Carregando';
import { FormularioImovel } from '@/components/admin/FormularioImovel';
import { Aviso, TituloPagina } from '@/components/admin/ui';
import { CIDADE_BASE, UF_BASE } from '@/config/site';
import { listarCorretores } from '@/lib/admin/consultas';
import { rascunhoVazio } from '@/lib/admin/rascunho-imovel';
import { usePainel } from '@/lib/admin/sessao';
import { useConsulta } from '@/lib/admin/useConsulta';

export default function PaginaNovoImovel() {
  const { supabase, ehAdmin, perfil } = usePainel();
  const { dados: corretores } = useConsulta(() => listarCorretores(supabase), '');
  const corretorPadrao = perfil.corretor_id ?? corretores?.[0]?.id ?? '';

  return (
    <div className="mx-auto max-w-5xl pb-28">
      <p className="mb-2 text-sm">
        <Link href="/admin/imoveis" className="text-primary underline">
          ← Imóveis
        </Link>
      </p>
      <TituloPagina
        titulo="Cadastrar imóvel"
        descricao="Preencha os dados e salve como rascunho. Depois envie as fotos e publique."
      />
      {!corretores ? (
        <Carregando />
      ) : !corretorPadrao ? (
        <Aviso tom="aviso">
          Nenhum corretor cadastrado.{' '}
          {ehAdmin ? 'Cadastre um em Equipe.' : 'Fale com o administrador.'}
        </Aviso>
      ) : (
        <FormularioImovel
          id={null}
          inicial={rascunhoVazio({ cidade: CIDADE_BASE, uf: UF_BASE, corretorId: corretorPadrao })}
          corretores={corretores.map((c) => ({ id: c.id, nome: c.nome }))}
          ehAdmin={ehAdmin}
        />
      )}
    </div>
  );
}
