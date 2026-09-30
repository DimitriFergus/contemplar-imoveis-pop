'use client';

import { KeyRound, UserPlus } from 'lucide-react';
import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  alternarAtivo,
  atualizarCorretor,
  criarMembro,
  redefinirSenha,
  type EstadoEquipe,
} from '@/lib/admin/acoes-equipe';
import type { LinhaCorretor, LinhaPerfil } from '@/lib/supabase/tipos';
import { Aviso, Campo, Selecao } from './ui';

export function FormularioNovoMembro() {
  const [estado, acao, salvando] = useActionState<EstadoEquipe, FormData>(criarMembro, {});
  return (
    <form action={acao} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <Button type="submit" disabled={salvando}>
          <UserPlus aria-hidden /> {salvando ? 'Criando…' : 'Criar acesso'}
        </Button>
      </div>
    </form>
  );
}

export function CartaoMembro({
  perfil,
  corretor,
  ehVoce,
}: {
  perfil: LinhaPerfil | null;
  corretor: LinhaCorretor | null;
  ehVoce: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [trocandoSenha, setTrocandoSenha] = useState(false);
  const [estadoCorretor, acaoCorretor, salvandoCorretor] = useActionState<EstadoEquipe, FormData>(
    atualizarCorretor.bind(null, corretor?.id ?? ''),
    {},
  );
  const [estadoSenha, acaoSenha, salvandoSenha] = useActionState<EstadoEquipe, FormData>(
    redefinirSenha.bind(null, perfil?.id ?? ''),
    {},
  );

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
                onClick={() => alternarAtivo(perfil.id, !perfil.ativo)}
              >
                {perfil.ativo ? 'Desativar' : 'Reativar'}
              </Button>
            </>
          )}
        </div>
      </div>

      {editando && corretor && (
        <form action={acaoCorretor} className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-3">
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
            <Button type="submit" size="sm" disabled={salvandoCorretor}>
              Salvar
            </Button>
            {estadoCorretor.erro && <span className="text-perda">{estadoCorretor.erro}</span>}
            {estadoCorretor.ok && <span className="text-sucesso">{estadoCorretor.ok}</span>}
          </div>
        </form>
      )}

      {trocandoSenha && perfil && (
        <form action={acaoSenha} className="mt-4 flex flex-wrap items-end gap-3 border-t pt-4">
          <Campo
            rotulo="Nova senha provisória"
            id={`senha-${perfil.id}`}
            className="min-w-60 flex-1"
          >
            <Input id={`senha-${perfil.id}`} name="senha" minLength={10} autoComplete="off" />
          </Campo>
          <Button type="submit" size="sm" disabled={salvandoSenha}>
            Definir senha
          </Button>
          {estadoSenha.erro && <p className="w-full text-perda">{estadoSenha.erro}</p>}
          {estadoSenha.ok && <p className="w-full text-sucesso">{estadoSenha.ok}</p>}
        </form>
      )}
    </div>
  );
}
