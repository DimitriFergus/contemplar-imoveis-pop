'use client';

import { KeyRound, QrCode } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { confirmarCodigoMfa, iniciarCadastroMfa, type CadastroMfa } from '@/lib/admin/operacoes';
import { Aviso, Campo } from './ui';

export function ConfirmarMfa({ cadastrar }: { cadastrar: boolean }) {
  const router = useRouter();
  const [cadastro, setCadastro] = useState<CadastroMfa | null>(null);
  const [erro, setErro] = useState<string>();
  const [ocupado, setOcupado] = useState(false);

  async function gerar() {
    setOcupado(true);
    const r = await iniciarCadastroMfa();
    setOcupado(false);
    if ('erro' in r) setErro(r.erro);
    else {
      setErro(undefined);
      setCadastro(r);
    }
  }

  async function confirmar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const codigo = String(new FormData(e.currentTarget).get('codigo') ?? '');
    setOcupado(true);
    const r = await confirmarCodigoMfa(codigo, cadastro?.fatorId);
    if (r.erro) {
      setErro(r.erro);
      setOcupado(false);
      return;
    }
    router.replace('/admin');
  }

  if (cadastrar && !cadastro) {
    return (
      <div className="space-y-4">
        <ol className="list-decimal space-y-1 pl-5 text-[0.95rem]">
          <li>Instale um app autenticador no seu celular.</li>
          <li>Toque no botão abaixo e escaneie o QR Code com o app.</li>
          <li>Digite o código de 6 números que aparecer no app.</li>
        </ol>
        {erro && <Aviso tom="erro">{erro}</Aviso>}
        <Button size="lg" className="w-full" disabled={ocupado} onClick={gerar}>
          <QrCode aria-hidden /> {ocupado ? 'Gerando…' : 'Gerar QR Code'}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={confirmar} className="space-y-4">
      {cadastro && (
        <div className="space-y-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- QR Code em data URI */}
          <img
            src={cadastro.qrCode}
            alt="QR Code para cadastrar o app autenticador"
            width={192}
            height={192}
            className="mx-auto rounded-xl bg-white p-2 ring-1 ring-border"
          />
          <p className="text-sm text-muted-foreground">
            Não consegue escanear? Digite esta chave no app:{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs break-all text-foreground">
              {cadastro.segredo}
            </code>
          </p>
        </div>
      )}
      <Campo rotulo="Código de 6 números" id="codigo">
        <Input
          id="codigo"
          name="codigo"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          required
          autoFocus
          className="text-center font-mono text-2xl tracking-[0.3em]"
        />
      </Campo>
      {erro && <Aviso tom="erro">{erro}</Aviso>}
      <Button type="submit" size="lg" className="w-full" disabled={ocupado}>
        <KeyRound aria-hidden /> {ocupado ? 'Conferindo…' : 'Confirmar'}
      </Button>
    </form>
  );
}
