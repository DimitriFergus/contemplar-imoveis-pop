import type { Metadata } from 'next';
import { CartaoMembro, FormularioNovoMembro } from '@/components/admin/Equipe';
import { Cartao, TituloPagina } from '@/components/admin/ui';
import { listarCorretores, listarPerfis } from '@/lib/admin/consultas';
import { exigirSessao } from '@/lib/admin/sessao';

export const metadata: Metadata = { title: 'Equipe' };

export default async function PaginaEquipe() {
  const { supabase, usuarioId } = await exigirSessao({ apenasAdmin: true });
  const [perfis, corretores] = await Promise.all([
    listarPerfis(supabase),
    listarCorretores(supabase),
  ]);
  const porId = new Map(corretores.map((c) => [c.id, c]));
  const semUsuario = corretores.filter((c) => !perfis.some((p) => p.corretor_id === c.id));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <TituloPagina
        titulo="Equipe"
        descricao="Quem acessa o painel. Corretores veem e editam só os próprios imóveis e leads."
      />
      <Cartao titulo="Cadastrar pessoa">
        <FormularioNovoMembro />
      </Cartao>
      <ul className="space-y-3">
        {perfis.map((p) => (
          <li key={p.id}>
            <CartaoMembro
              perfil={p}
              corretor={p.corretor_id ? (porId.get(p.corretor_id) ?? null) : null}
              ehVoce={p.id === usuarioId}
            />
          </li>
        ))}
      </ul>
      {semUsuario.length > 0 && (
        <Cartao
          titulo="Corretores sem acesso ao painel"
          descricao="Aparecem nos anúncios, mas ninguém entra com eles (ex.: o corretor de exemplo)."
        >
          <ul className="space-y-3">
            {semUsuario.map((c) => (
              <li key={c.id}>
                <CartaoMembro perfil={null} corretor={c} ehVoce={false} />
              </li>
            ))}
          </ul>
        </Cartao>
      )}
    </div>
  );
}
