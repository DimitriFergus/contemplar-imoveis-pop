'use client';

import { Carregando } from '@/components/admin/Carregando';
import { CartaoMembro, FormularioNovoMembro } from '@/components/admin/Equipe';
import { Cartao, TituloPagina } from '@/components/admin/ui';
import { listarCorretores, listarPerfis } from '@/lib/admin/consultas';
import { usePainel } from '@/lib/admin/sessao';
import { useConsulta } from '@/lib/admin/useConsulta';

export default function PaginaEquipe() {
  const { supabase, usuarioId } = usePainel();
  const { dados, recarregar } = useConsulta(
    () => Promise.all([listarPerfis(supabase), listarCorretores(supabase)]),
    '',
  );
  const atualizar = () => void recarregar();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <TituloPagina
        titulo="Equipe"
        descricao="Quem acessa o painel. Corretores veem e editam só os próprios imóveis e leads."
      />
      <Cartao titulo="Cadastrar pessoa">
        <FormularioNovoMembro aoCriar={atualizar} />
      </Cartao>
      {!dados ? (
        <Carregando />
      ) : (
        (() => {
          const [perfis, corretores] = dados;
          const porId = new Map(corretores.map((c) => [c.id, c]));
          const semUsuario = corretores.filter((c) => !perfis.some((p) => p.corretor_id === c.id));
          return (
            <>
              <ul className="space-y-3">
                {perfis.map((p) => (
                  <li key={p.id}>
                    <CartaoMembro
                      perfil={p}
                      corretor={p.corretor_id ? (porId.get(p.corretor_id) ?? null) : null}
                      ehVoce={p.id === usuarioId}
                      aoAlterar={atualizar}
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
                        <CartaoMembro
                          perfil={null}
                          corretor={c}
                          ehVoce={false}
                          aoAlterar={atualizar}
                        />
                      </li>
                    ))}
                  </ul>
                </Cartao>
              )}
            </>
          );
        })()
      )}
    </div>
  );
}
