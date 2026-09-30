'use client';

import { LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { entrar } from '@/lib/admin/operacoes';
import { Aviso, Campo } from './ui';

export function FormularioEntrar() {
  const router = useRouter();
  const [erro, setErro] = useState<string>();
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setEnviando(true);
    const r = await entrar(String(form.get('email') ?? ''), String(form.get('senha') ?? ''));
    if (r.erro) {
      setErro(r.erro);
      setEnviando(false);
      return;
    }
    router.replace('/admin');
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <Campo rotulo="E-mail" id="email">
        <Input id="email" name="email" type="email" autoComplete="username" required />
      </Campo>
      <Campo rotulo="Senha" id="senha">
        <Input id="senha" name="senha" type="password" autoComplete="current-password" required />
      </Campo>
      {erro && <Aviso tom="erro">{erro}</Aviso>}
      <Button type="submit" size="lg" className="w-full" disabled={enviando}>
        <LogIn aria-hidden /> {enviando ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  );
}
