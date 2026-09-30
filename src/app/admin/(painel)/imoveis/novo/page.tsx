import type { Metadata } from 'next';
import Link from 'next/link';
import { FormularioImovel } from '@/components/admin/FormularioImovel';
import { rascunhoVazio } from '@/lib/admin/rascunho-imovel';
import { Aviso, TituloPagina } from '@/components/admin/ui';
import { CIDADE_BASE, UF_BASE } from '@/config/site';
import { listarCorretores } from '@/lib/admin/consultas';
import { exigirSessao } from '@/lib/admin/sessao';

export const metadata: Metadata = { title: 'Cadastrar imóvel' };

export default async function PaginaNovoImovel() {
  const { supabase, ehAdmin, perfil } = await exigirSessao();
  const corretores = await listarCorretores(supabase);
  const corretorPadrao = perfil.corretor_id ?? corretores[0]?.id ?? '';

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
      {!corretorPadrao ? (
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
