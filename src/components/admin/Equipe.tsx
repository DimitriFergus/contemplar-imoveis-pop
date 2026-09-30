'use client';

import { KeyRound, UserPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { atualizarCorretor, chamarEquipe, type Resultado } from '@/lib/admin/operacoes';
import { usePainel } from '@/lib/admin/sessao';
import type { LinhaCorretor, LinhaPerfil } from '@/lib/supabase/tipos';
import { Aviso, Campo, Selecao } from './ui';

function useEnvio(aoConcluir?: () => void) {
  const [estado, setEstado] = useState<Resultado>({});
  const [ocupado, setOcupado] = useState(false);
  const executar = async (operacao: () => Promise<Resultado>) => {
    setOcupado(true);
    const r = await operacao();
    setOcupado(false);
    setEstado(r);
    if (r.ok) aoConcluir?.();
    return r;
  };
  return { estado, ocupado, executar };
}

export function FormularioNovoMembro({ aoCriar }: { aoCriar: () => void }) {
  const sessao = usePainel();
  const { estado, ocupado, executar } = useEnvio(aoCriar);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formulario = e.currentTarget;
    const r = await executar(() =>
      chamarEquipe(sessao, 'criar', Object.fromEntries(new FormData(formulario))),
    );
    if (r.ok) formulario.reset();
  }

  return (
    <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Campo rotulo="Nome completo" id="novo-nome" obrigatorio>
        <Input id="novo-nome" name="nome" required />
      </Campo>
      <Campo rotulo="E-mail (login)" id="novo-email" obrigatorio>
        <Input id="novo-email" name="email" type="email" required autoComplete="off" />
      </Campo>
      <Campo
        rotulo="Senha provisória"
        id="novo-senha"
        ajuda="Mínimo de 10 caracteres. A pessoa troca depois."
        obrigatorio
      >
        <Input
          id="novo-senha"
          name="senha"
          type="text"
          required
          autoComplete="off"
          minLength={10}
        />
      </Campo>
      <Campo rotulo="Papel" id="novo-papel">
        <Selecao id="novo-papel" name="papel" defaultValue="corretor">
          <option value="corretor">Corretor</option>
          <option value="admin">Administrador (exige app autenticador)</option>
        </Selecao>
      </Campo>
      <Campo rotulo="CRECI" id="novo-creci">
        <Input id="novo-creci" name="creci" placeholder="Ex.: 12345-F" />
      </Campo>
      <Campo rotulo="WhatsApp" id="novo-whatsapp">
        <Input id="novo-whatsapp" name="whatsapp" inputMode="tel" placeholder="(85) 99999-9999" />
      </Campo>
      <div className="space-y-3 sm:col-span-2 lg:col-span-3">
        {estado.erro && <Aviso tom="erro">{estado.erro}</Aviso>}
        {estado.ok && <Aviso tom="sucesso">{estado.ok}</Aviso>}
        <Button type="submit" disabled={ocupado}>
          <UserPlus aria-hidden /> {ocupado ? 'Criando…' : 'Criar acesso'}
        </Button>
      </div>
    </form>
  );
}

export function CartaoMembro({
  perfil,
  corretor,
  ehVoce,
  aoAlterar,
}: {
  perfil: LinhaPerfil | null;
  corretor: LinhaCorretor | null;
  ehVoce: boolean;
  aoAlterar: () => void;
}) {
  const sessao = usePainel();
  const [editando, setEditando] = useState(false);
  const [trocandoSenha, setTrocandoSenha] = useState(false);
  const corretorEnvio = useEnvio(aoAlterar);
  const senhaEnvio = useEnvio();
  const ativoEnvio = useEnvio(aoAlterar);

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold">
            {perfil?.nome ?? corretor?.nome}
            {ehVoce && <span className="font-normal text-muted-foreground"> (você)</span>}
          </p>
          {perfil && <p className="text-sm break-all text-muted-foreground">{perfil.email}</p>}
          <p className="mt-1 flex flex-wrap gap-2 text-xs">
            {perfil && (
              <span className="rounded-full bg-info-suave px-2 py-0.5 font-semibold text-primary">
                {perfil.papel === 'admin' ? 'Administrador' : 'Corretor'}
              </span>
            )}
            {perfil && !perfil.ativo && (
              <span className="rounded-full bg-perda-suave px-2 py-0.5 font-semibold text-perda">
                Desativado
              </span>
            )}
            {corretor && (
              <span className="rounded-full bg-muted px-2 py-0.5 ring-1 ring-border">
                CRECI {corretor.creci === 'A_DEFINIR' ? 'a definir' : corretor.creci}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {corretor && (
            <Button size="sm" variant="outline" onClick={() => setEditando((v) => !v)}>
              Dados do anúncio
            </Button>
          )}
          {perfil && !ehVoce && (
            <>
              <Button size="sm" variant="outline" onClick={() => setTrocandoSenha((v) => !v)}>
                <KeyRound aria-hidden /> Senha
              </Button>
              <Button
                size="sm"
                variant={perfil.ativo ? 'destructive' : 'default'}
                disabled={ativoEnvio.ocupado}
                onClick={() =>
                  ativoEnvio.executar(() =>
                    chamarEquipe(sessao, perfil.ativo ? 'desativar' : 'ativar', { id: perfil.id }),
                  )
                }
              >
                {perfil.ativo ? 'Desativar' : 'Reativar'}
              </Button>
            </>
          )}
        </div>
      </div>
      {ativoEnvio.estado.erro && (
        <Aviso tom="erro" className="mt-3">
          {ativoEnvio.estado.erro}
        </Aviso>
      )}

      {editando && corretor && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void corretorEnvio.executar(() =>
              atualizarCorretor(sessao, corretor.id, {
                nome: String(f.get('nome') ?? ''),
                creci: String(f.get('creci') ?? ''),
                whatsapp: String(f.get('whatsapp') ?? ''),
              }),
            );
          }}
          className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-3"
        >
          <Campo rotulo="Nome no anúncio" id={`nome-${corretor.id}`}>
            <Input id={`nome-${corretor.id}`} name="nome" defaultValue={corretor.nome} />
          </Campo>
          <Campo rotulo="CRECI" id={`creci-${corretor.id}`}>
            <Input id={`creci-${corretor.id}`} name="creci" defaultValue={corretor.creci} />
          </Campo>
          <Campo rotulo="WhatsApp" id={`whats-${corretor.id}`}>
            <Input
              id={`whats-${corretor.id}`}
              name="whatsapp"
              defaultValue={corretor.whatsapp === 'A_DEFINIR' ? '' : corretor.whatsapp}
            />
          </Campo>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
            <Button type="submit" size="sm" disabled={corretorEnvio.ocupado}>
              Salvar
            </Button>
            {corretorEnvio.estado.erro && (
              <span className="text-perda">{corretorEnvio.estado.erro}</span>
            )}
            {corretorEnvio.estado.ok && (
              <span className="text-sucesso">{corretorEnvio.estado.ok}</span>
            )}
          </div>
        </form>
      )}

      {trocandoSenha && perfil && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const senha = String(new FormData(e.currentTarget).get('senha') ?? '');
            void senhaEnvio.executar(() => chamarEquipe(sessao, 'senha', { id: perfil.id, senha }));
          }}
          className="mt-4 flex flex-wrap items-end gap-3 border-t pt-4"
        >
          <Campo
            rotulo="Nova senha provisória"
            id={`senha-${perfil.id}`}
            className="min-w-60 flex-1"
          >
            <Input id={`senha-${perfil.id}`} name="senha" minLength={10} autoComplete="off" />
          </Campo>
          <Button type="submit" size="sm" disabled={senhaEnvio.ocupado}>
            Definir senha
          </Button>
          {senhaEnvio.estado.erro && <p className="w-full text-perda">{senhaEnvio.estado.erro}</p>}
          {senhaEnvio.estado.ok && <p className="w-full text-sucesso">{senhaEnvio.estado.ok}</p>}
        </form>
      )}
    </div>
  );
}
