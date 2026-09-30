'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trocarSenha, type Resultado } from '@/lib/admin/operacoes';
import { Aviso, Campo } from './ui';

export function FormularioSenha() {
  const [estado, setEstado] = useState<Resultado>({});
  const [salvando, setSalvando] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formulario = e.currentTarget;
    const form = new FormData(formulario);
    setSalvando(true);
    const r = await trocarSenha(String(form.get('senha')), String(form.get('confirmacao')));
    setSalvando(false);
    setEstado(r);
    if (r.ok) formulario.reset();
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
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
