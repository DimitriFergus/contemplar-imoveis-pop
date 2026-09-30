'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trocarSenha, type EstadoFormulario } from '@/lib/admin/acoes-acesso';
import { Aviso, Campo } from './ui';

export function FormularioSenha() {
  const [estado, acao, salvando] = useActionState<EstadoFormulario, FormData>(trocarSenha, {});
  return (
    <form action={acao} className="space-y-4">
      <Campo rotulo="Nova senha" id="senha" ajuda="Mínimo de 10 caracteres.">
        <Input id="senha" name="senha" type="password" autoComplete="new-password" required />
      </Campo>
      <Campo rotulo="Repita a nova senha" id="confirmacao">
        <Input
          id="confirmacao"
          name="confirmacao"
          type="password"
          autoComplete="new-password"
          required
        />
      </Campo>
      {estado.erro && <Aviso tom="erro">{estado.erro}</Aviso>}
      {estado.ok && <Aviso tom="sucesso">{estado.ok}</Aviso>}
      <Button type="submit" disabled={salvando}>
        {salvando ? 'Salvando…' : 'Trocar senha'}
      </Button>
    </form>
  );
}
