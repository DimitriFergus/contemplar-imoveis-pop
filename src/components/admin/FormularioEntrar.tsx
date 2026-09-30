'use client';

import { LogIn } from 'lucide-react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { entrar, type EstadoFormulario } from '@/lib/admin/acoes-acesso';
import { Aviso, Campo } from './ui';

export function FormularioEntrar() {
  const [estado, acao, enviando] = useActionState<EstadoFormulario, FormData>(entrar, {});
  return (
    <form action={acao} className="space-y-4">
      <Campo rotulo="E-mail" id="email">
        <Input id="email" name="email" type="email" autoComplete="username" required />
      </Campo>
      <Campo rotulo="Senha" id="senha">
        <Input id="senha" name="senha" type="password" autoComplete="current-password" required />
      </Campo>
      {estado.erro && <Aviso tom="erro">{estado.erro}</Aviso>}
      <Button type="submit" size="lg" className="w-full" disabled={enviando}>
        <LogIn aria-hidden /> {enviando ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  );
}
