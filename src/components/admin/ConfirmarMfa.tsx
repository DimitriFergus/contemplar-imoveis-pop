'use client';

import { KeyRound, QrCode } from 'lucide-react';
import { useActionState, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  confirmarCodigoMfa,
  iniciarCadastroMfa,
  type CadastroMfa,
  type EstadoFormulario,
} from '@/lib/admin/acoes-acesso';
import { Aviso, Campo } from './ui';

export function ConfirmarMfa({ cadastrar }: { cadastrar: boolean }) {
  const [cadastro, setCadastro] = useState<CadastroMfa | null>(null);
  const [erroCadastro, setErroCadastro] = useState<string>();
  const [gerando, iniciar] = useTransition();
  const [estado, acao, enviando] = useActionState<EstadoFormulario, FormData>(
    confirmarCodigoMfa,
    {},
  );

  if (cadastrar && !cadastro) {
    return (
      <div className="space-y-4">
        <ol className="list-decimal space-y-1 pl-5 text-[0.95rem]">
          <li>Instale um app autenticador no seu celular.</li>
          <li>Toque no botão abaixo e escaneie o QR Code com o app.</li>
          <li>Digite o código de 6 números que aparecer no app.</li>
        </ol>
        {erroCadastro && <Aviso tom="erro">{erroCadastro}</Aviso>}
        <Button
          size="lg"
          className="w-full"
          disabled={gerando}
          onClick={() =>
            iniciar(async () => {
              const r = await iniciarCadastroMfa();
              if ('erro' in r) setErroCadastro(r.erro);
              else setCadastro(r);
            })
          }
        >
          <QrCode aria-hidden /> {gerando ? 'Gerando…' : 'Gerar QR Code'}
        </Button>
      </div>
    );
  }

  return (
    <form action={acao} className="space-y-4">
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
          <input type="hidden" name="fatorId" value={cadastro.fatorId} />
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
      {estado.erro && <Aviso tom="erro">{estado.erro}</Aviso>}
      <Button type="submit" size="lg" className="w-full" disabled={enviando}>
        <KeyRound aria-hidden /> {enviando ? 'Conferindo…' : 'Confirmar'}
      </Button>
    </form>
  );
}
