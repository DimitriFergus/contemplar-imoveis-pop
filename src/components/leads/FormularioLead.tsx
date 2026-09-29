'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { BotaoWhatsApp } from '@/components/comum/BotaoWhatsApp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { rastrear } from '@/lib/analytics';
import { utmSessao } from '@/lib/cliente/estado';
import { FAIXAS } from '@/config/financiamento';
import { AGENDAMENTO, MODO_ESTATICO } from '@/config/site';
import { comOrigem, linkWhatsApp } from '@/lib/utils/whatsapp';
import { formatarPreco } from '@/lib/utils/formatar';
import type { OrigemLead } from '@/types';
import { cn } from '@/lib/utils';

export interface CampoExtra {
  nome: string;
  rotulo: string;
  tipo: 'texto' | 'select';
  opcoes?: string[];
  obrigatorio?: boolean;
  placeholder?: string;
}

interface Props {
  origem: OrigemLead;
  codigoImovel?: string;
  /** Mensagem do WhatsApp na tela de confirmação. */
  mensagemWhatsApp: string;
  textoBotao?: string;
  pedirEmail?: boolean;
  pedirRenda?: boolean;
  mensagem?: { rotulo: string; placeholder?: string; obrigatoria?: boolean; valorInicial?: string };
  camposExtras?: CampoExtra[];
  /** Campos adicionais controlados por fora (ex.: data e período da visita). */
  dadosAdicionais?: Record<string, string | undefined>;
  antesDosCampos?: ReactNode;
  /** Conteúdo exibido logo acima do botão de envio (ex.: resumo do agendamento). */
  antesDoBotao?: ReactNode;
  /** Título dos campos de contato (ex.: "3. Seus dados"). */
  tituloCampos?: ReactNode;
  className?: string;
  aoEnviar?: () => void;
}

type Erros = Partial<Record<string, string>>;

export function FormularioLead({
  origem,
  codigoImovel,
  mensagemWhatsApp,
  textoBotao = 'Enviar',
  pedirEmail = false,
  pedirRenda = false,
  mensagem,
  camposExtras = [],
  dadosAdicionais = {},
  antesDosCampos,
  antesDoBotao,
  tituloCampos,
  className,
  aoEnviar,
}: Props) {
  const id = useId();
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erros, setErros] = useState<Erros>({});
  const [erroGeral, setErroGeral] = useState('');

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const texto = (k: string) => String(form.get(k) ?? '').trim();
    const extras = camposExtras
      .map((c) => (texto(c.nome) ? `${c.rotulo}: ${texto(c.nome)}` : ''))
      .filter(Boolean);
    const corpo = {
      origem,
      nome: texto('nome'),
      whatsapp: texto('whatsapp'),
      email: texto('email') || undefined,
      rendaFamiliarFaixa: texto('renda') || undefined,
      codigoImovel,
      mensagem: [...extras, texto('mensagem')].filter(Boolean).join('\n') || undefined,
      consentimentoLGPD: form.get('consentimento') === 'on',
      site: texto('site'),
      utm: utmSessao.ler() ?? undefined,
      ...dadosAdicionais,
    };
    if (corpo.site) return; // honeypot preenchido: ignora
    if (MODO_ESTATICO) {
      // Versão estática (sem servidor): valida aqui e envia o contato pelo WhatsApp.
      const errosLocais: Erros = {};
      if (corpo.nome.length < 2) errosLocais.nome = 'Informe seu nome';
      const digitos = corpo.whatsapp.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
      if (!/^[1-9]{2}9?\d{8}$/.test(digitos))
        errosLocais.whatsapp = 'Informe um WhatsApp válido com DDD';
      if (!corpo.consentimentoLGPD)
        errosLocais.consentimentoLGPD = 'É preciso concordar com a Política de Privacidade';
      setErros(errosLocais);
      if (Object.keys(errosLocais).length) return;
      const faixa = FAIXAS.find((f) => f.id === corpo.rendaFamiliarFaixa);
      const linhas = [
        `Olá! Meu nome é ${corpo.nome}.`,
        codigoImovel ? `Imóvel: ${codigoImovel}` : '',
        dadosAdicionais.dataVisitaPreferida
          ? `Visita: ${dadosAdicionais.dataVisitaPreferida.split('-').reverse().join('/')}${(() => {
              const p = AGENDAMENTO.periodos.find(
                (x) => x.valor === dadosAdicionais.periodoPreferido,
              );
              return p ? ` – ${p.rotulo} (${p.horario})` : '';
            })()}`
          : '',
        faixa ? `Faixa de renda: ${faixa.nome}` : '',
        corpo.email ? `E-mail: ${corpo.email}` : '',
        corpo.mensagem ?? '',
      ].filter(Boolean);
      window.open(linkWhatsApp(comOrigem(linhas.join('\n'), corpo.utm)), '_blank', 'noopener');
      rastrear('envio_lead', { origem, codigo: codigoImovel, canal: 'whatsapp' });
      setEnviado(true);
      aoEnviar?.();
      return;
    }
    setEnviando(true);
    setErros({});
    setErroGeral('');
    try {
      const resp = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      });
      const dados = (await resp.json().catch(() => ({}))) as { erros?: Erros; mensagem?: string };
      if (!resp.ok) {
        setErros(dados.erros ?? {});
        setErroGeral(
          dados.mensagem ?? 'Não foi possível enviar. Tente novamente ou fale pelo WhatsApp.',
        );
        return;
      }
      rastrear('envio_lead', { origem, codigo: codigoImovel });
      setEnviado(true);
      aoEnviar?.();
    } catch {
      setErroGeral('Sem conexão no momento. Verifique sua internet ou fale pelo WhatsApp.');
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div
        className={cn('rounded-2xl bg-sucesso-suave p-6 text-center', className)}
        role="status"
        data-testid="confirmacao-lead"
      >
        <CheckCircle2 className="mx-auto size-12 text-sucesso" aria-hidden />
        <h3 className="mt-3 text-xl font-bold">
          {MODO_ESTATICO ? 'Quase lá!' : 'Recebemos seu contato!'}
        </h3>
        <p className="mt-2 text-muted-foreground">
          {MODO_ESTATICO
            ? 'Abrimos o WhatsApp com a sua mensagem pronta. É só tocar em enviar. Se não abriu, use o botão abaixo:'
            : 'Um corretor vai falar com você pelo WhatsApp em breve, no horário de atendimento. Se preferir, fale agora:'}
        </p>
        <BotaoWhatsApp
          mensagem={mensagemWhatsApp}
          local={`confirmacao_${origem}`}
          codigoImovel={codigoImovel}
          rotulo="Falar agora no WhatsApp"
          size="lg"
          className="mt-4 w-full sm:w-auto"
        />
      </div>
    );
  }

  const erroDe = (campo: string) =>
    erros[campo] ? (
      <p id={`${id}-${campo}-erro`} className="mt-1 text-sm font-semibold text-destructive">
        {erros[campo]}
      </p>
    ) : null;
  const props = (campo: string) => ({
    'aria-invalid': Boolean(erros[campo]) || undefined,
    'aria-describedby': erros[campo] ? `${id}-${campo}-erro` : undefined,
  });

  return (
    <form onSubmit={enviar} className={cn('space-y-4', className)} noValidate={false}>
      {antesDosCampos}
      {tituloCampos && <h3 className="pt-1 text-lg font-bold">{tituloCampos}</h3>}
      <div>
        <label htmlFor={`${id}-nome`} className="mb-1 block font-semibold">
          Seu nome
        </label>
        <Input
          id={`${id}-nome`}
          name="nome"
          autoComplete="name"
          required
          minLength={2}
          maxLength={120}
          {...props('nome')}
        />
        {erroDe('nome')}
      </div>
      <div>
        <label htmlFor={`${id}-whatsapp`} className="mb-1 block font-semibold">
          WhatsApp com DDD
        </label>
        <Input
          id={`${id}-whatsapp`}
          name="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(00) 90000-0000"
          required
          {...props('whatsapp')}
        />
        {erroDe('whatsapp')}
      </div>
      {pedirEmail && (
        <div>
          <label htmlFor={`${id}-email`} className="mb-1 block font-semibold">
            E-mail <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <Input
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            {...props('email')}
          />
          {erroDe('email')}
        </div>
      )}
      {pedirRenda && (
        <div>
          <label htmlFor={`${id}-renda`} className="mb-1 block font-semibold">
            Renda familiar mensal{' '}
            <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <select id={`${id}-renda`} name="renda" defaultValue="">
            <option value="">Selecione</option>
            {FAIXAS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.rendaMaxima === null
                  ? `Acima de ${formatarPreco(f.rendaMinima)}`
                  : f.rendaMinima > 0
                    ? `De ${formatarPreco(f.rendaMinima)} a ${formatarPreco(f.rendaMaxima)}`
                    : `Até ${formatarPreco(f.rendaMaxima)}`}
              </option>
            ))}
            <option value="prefiro_nao_informar">Prefiro não informar</option>
          </select>
        </div>
      )}
      {camposExtras.map((c) => (
        <div key={c.nome}>
          <label htmlFor={`${id}-${c.nome}`} className="mb-1 block font-semibold">
            {c.rotulo}{' '}
            {!c.obrigatorio && (
              <span className="font-normal text-muted-foreground">(opcional)</span>
            )}
          </label>
          {c.tipo === 'select' ? (
            <select id={`${id}-${c.nome}`} name={c.nome} required={c.obrigatorio} defaultValue="">
              <option value="">Selecione</option>
              {c.opcoes?.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id={`${id}-${c.nome}`}
              name={c.nome}
              required={c.obrigatorio}
              placeholder={c.placeholder}
              maxLength={200}
            />
          )}
        </div>
      ))}
      {mensagem && (
        <div>
          <label htmlFor={`${id}-mensagem`} className="mb-1 block font-semibold">
            {mensagem.rotulo}{' '}
            {!mensagem.obrigatoria && (
              <span className="font-normal text-muted-foreground">(opcional)</span>
            )}
          </label>
          <textarea
            id={`${id}-mensagem`}
            name="mensagem"
            rows={3}
            maxLength={1500}
            required={mensagem.obrigatoria}
            defaultValue={mensagem.valorInicial}
            placeholder={mensagem.placeholder}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base"
          />
        </div>
      )}
      {/* Honeypot anti-robô: invisível para pessoas */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-site`}>Não preencha este campo</label>
        <input id={`${id}-site`} name="site" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="consentimento"
            required
            className="mt-1 size-5 shrink-0"
            {...props('consentimentoLGPD')}
          />
          <span className="text-[0.95rem]">
            Concordo que a Contemplar Imóveis use meus dados para retornar este contato, conforme a{' '}
            <Link
              href="/politica-de-privacidade"
              className="font-semibold text-primary underline"
              target="_blank"
            >
              Política de Privacidade
            </Link>
            .
          </span>
        </label>
        {erroDe('consentimentoLGPD')}
      </div>
      {erroGeral && (
        <p className="rounded-lg bg-destructive/10 p-3 font-semibold text-destructive" role="alert">
          {erroGeral}
        </p>
      )}
      {antesDoBotao}
      <Button type="submit" size="lg" variant="destaque" className="w-full" disabled={enviando}>
        {enviando && <Loader2 className="size-5 animate-spin" aria-hidden />}
        {enviando ? 'Enviando…' : textoBotao}
      </Button>
    </form>
  );
}
