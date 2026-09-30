'use client';

import { Eye, Plus, Save, Send, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AJUDA_STATUS_PAINEL, ROTULO_STATUS_PAINEL } from '@/lib/admin/rotulos';
import { enviarFotosPendentes } from '@/lib/admin/fotos-pendentes';
import { salvarImovel } from '@/lib/admin/operacoes';
import { usePainel } from '@/lib/admin/sessao';
import { SITUACOES_IMOVEL, TIPOS_IMOVEL, TIPOS_PROXIMIDADE } from '@/lib/constantes';
import {
  ROTULO_CONDICAO,
  ROTULO_PROXIMIDADE,
  ROTULO_SITUACAO,
  ROTULO_TIPO,
  type ChaveCondicao,
} from '@/lib/rotulos';
import { imovelFormularioSchema, STATUS_PAINEL, type StatusPainel } from '@/lib/schemas/imovel';
import type { TipoProximidade } from '@/types';
import { paraEntrada, type RascunhoImovel } from '@/lib/admin/rascunho-imovel';
import { GerenciadorFotos } from './GerenciadorFotos';
import { AreaTexto, Aviso, Campo, Cartao, Selecao } from './ui';

/** Mensagens do Zod em português simples para campos numéricos vazios. */
function mensagem(m: string) {
  if (/expected number, received undefined|received undefined/i.test(m)) return 'Obrigatório';
  if (/expected number, received NaN|NaN/i.test(m)) return 'Digite só números';
  if (/expected string, received undefined/i.test(m)) return 'Obrigatório';
  if (/too small.*>=?\s*(\d+) characters/i.test(m))
    return `Muito curto (mínimo ${m.match(/(\d+) characters/)?.[1]} letras)`;
  if (/too big.*<=?\s*(\d+) characters/i.test(m))
    return `Muito longo (máximo ${m.match(/(\d+) characters/)?.[1]} letras)`;
  if (/invalid url/i.test(m)) return 'Endereço (link) inválido';
  if (/expected number to be >0/i.test(m)) return 'Precisa ser maior que zero';
  if (/expected number to be >=\s*(-?\d+)/i.test(m))
    return `Mínimo ${m.match(/>=\s*(-?\d+)/)?.[1]}`;
  if (/expected number to be <=\s*(-?\d+)/i.test(m))
    return `Máximo ${m.match(/<=\s*(-?\d+)/)?.[1]}`;
  if (/expected int/i.test(m)) return 'Use número inteiro, sem vírgula';
  if (/expected string to have >=\s*(\d+)/i.test(m))
    return `Muito curto (mínimo ${m.match(/>=\s*(\d+)/)?.[1]} letras)`;
  return m;
}

/** Nome dos campos na lista "Confira em vermelho: ...". */
const ROTULO_CAMPO: Record<string, string> = {
  titulo: 'Título',
  descricao: 'Descrição',
  previsaoEntrega: 'Previsão de entrega',
  preco: 'Preço',
  condominioMensal: 'Condomínio',
  iptuAnual: 'IPTU',
  bairro: 'Bairro',
  cidade: 'Cidade',
  uf: 'UF',
  lat: 'Latitude',
  lng: 'Longitude',
  raioMetros: 'Raio no mapa',
  quartos: 'Quartos',
  suites: 'Suítes',
  banheiros: 'Banheiros',
  vagas: 'Vagas',
  areaUtilM2: 'Área útil',
  areaTerrenoM2: 'Terreno',
  caracteristicas: 'Destaques do imóvel',
  lazer: 'Lazer',
  fotos: 'Fotos',
  alt: 'Descrição da foto',
  proximidades: 'Perto do imóvel',
  nome: 'Perto do imóvel (nome)',
  distanciaMetros: 'Perto do imóvel (metros)',
  videoUrl: 'Link do vídeo',
  tour360Url: 'Link do tour 360°',
  corretorResponsavelId: 'Corretor responsável',
};

interface Props {
  id: string | null;
  codigo?: string;
  slug?: string;
  inicial: RascunhoImovel;
  corretores: { id: string; nome: string }[];
  ehAdmin: boolean;
  /** Chamado depois de salvar um imóvel existente (para recarregar o histórico). */
  aoSalvar?: () => void;
}

export function FormularioImovel({
  id,
  codigo,
  slug,
  inicial,
  corretores,
  ehAdmin,
  aoSalvar,
}: Props) {
  const router = useRouter();
  const sessao = usePainel();
  const [r, setR] = useState(inicial);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<{ tom: 'sucesso' | 'erro'; texto: string } | null>(
    null,
  );
  const [salvando, setSalvando] = useState(false);
  const [alterado, setAlterado] = useState(false);

  const mudar = <K extends keyof RascunhoImovel>(campo: K, valor: RascunhoImovel[K]) => {
    setR((a) => ({ ...a, [campo]: valor }));
    setAlterado(true);
  };
  const erro = (campo: string) => erros[campo];
  const aria = (campo: string, idCampo: string) => ({
    'aria-invalid': Boolean(erros[campo]) || undefined,
    'aria-describedby': erros[campo] ? `${idCampo}-erro` : undefined,
  });

  function mostrarErros(issues: { path: PropertyKey[]; message: string }[]) {
    const novos: Record<string, string> = {};
    for (const i of issues) {
      const caminho = i.path.map(String);
      const texto = mensagem(i.message);
      novos[caminho.join('.') || 'geral'] ??= texto;
      // Erro de um item da lista (ex.: caracteristicas.0) aparece no campo da lista.
      if (caminho.length > 1 && caminho[0] !== 'localizacaoAproximada')
        novos[caminho[0]!] ??= `${ROTULO_CAMPO[caminho[0]!] ?? caminho[0]}: ${texto}`;
    }
    setErros(novos);
    const campos = [
      ...new Set(
        issues.map(
          (i) => ROTULO_CAMPO[String(i.path.at(-1))] ?? ROTULO_CAMPO[String(i.path[0])] ?? 'Outros',
        ),
      ),
    ];
    setResultado({ tom: 'erro', texto: `Confira em vermelho: ${campos.join(', ')}.` });
    requestAnimationFrame(() => {
      const alvo = document.querySelector<HTMLElement>(
        'form [aria-invalid="true"], form [role="alert"]',
      );
      alvo?.scrollIntoView({ block: 'center' });
      alvo?.focus({ preventScroll: true });
    });
  }

  function salvar(statusForcado?: StatusPainel) {
    const dados = { ...r, status: statusForcado ?? r.status };
    const entrada = paraEntrada(dados);
    const validacao = imovelFormularioSchema.safeParse(entrada);
    if (!validacao.success) {
      mostrarErros(validacao.error.issues);
      return;
    }
    setErros({});
    void (async () => {
      setSalvando(true);
      try {
        const falhou = (resp: { mensagem: string; erros?: Record<string, string> }) => {
          if (resp.erros && Object.keys(resp.erros).length)
            mostrarErros(
              Object.entries(resp.erros).map(([k, v]) => ({ path: k.split('.'), message: v })),
            );
          else setResultado({ tom: 'erro', texto: resp.mensagem });
        };

        if (id === null) {
          // Imóvel novo, tudo no mesmo clique: cria o imóvel, envia as fotos para a pasta
          // dele (o Storage só aceita fotos de imóvel existente) e grava fotos + status.
          const novo = await salvarImovel(sessao, null, {
            ...validacao.data,
            status: 'rascunho',
            fotos: [],
          });
          if (!novo.ok) return falhou(novo);
          setAlterado(false);
          let falhas = 0;
          if (validacao.data.fotos.length) {
            setResultado({ tom: 'sucesso', texto: 'Enviando as fotos…' });
            const envio = await enviarFotosPendentes(novo.id, validacao.data.fotos);
            falhas = envio.falhas;
            const final = await salvarImovel(sessao, novo.id, {
              ...validacao.data,
              fotos: envio.fotos,
              status: envio.fotos.length ? validacao.data.status : 'rascunho',
            });
            if (!final.ok) falhas = validacao.data.fotos.length;
          }
          router.replace(
            `/admin/imoveis/editar?id=${novo.id}&novo=1${falhas ? `&falhas=${falhas}` : ''}`,
          );
          return;
        }

        const resp = await salvarImovel(sessao, id, validacao.data);
        if (!resp.ok) return falhou(resp);
        setAlterado(false);
        setR(dados);
        setResultado({
          tom: 'sucesso',
          texto:
            dados.status === 'rascunho'
              ? 'Rascunho salvo.'
              : 'Salvo! O site já foi atualizado com as mudanças.',
        });
        aoSalvar?.();
      } finally {
        setSalvando(false);
      }
    })();
  }

  const precisaPrevisao = r.situacao === 'na_planta' || r.situacao === 'em_construcao';

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        salvar();
      }}
      className="space-y-6"
    >
      <Cartao titulo="Informações principais">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            rotulo="Título do anúncio"
            id="titulo"
            erro={erro('titulo')}
            ajuda={`${r.titulo.length}/90 letras. Ex.: Casa 2 quartos com quintal no Parque Montenegro`}
            obrigatorio
            className="sm:col-span-2"
          >
            <Input
              id="titulo"
              value={r.titulo}
              maxLength={90}
              onChange={(e) => mudar('titulo', e.target.value)}
              {...aria('titulo', 'titulo')}
            />
          </Campo>
          <Campo rotulo="Tipo" id="tipo" obrigatorio>
            <Selecao
              id="tipo"
              value={r.tipo}
              onChange={(e) => mudar('tipo', e.target.value as RascunhoImovel['tipo'])}
            >
              {TIPOS_IMOVEL.map((t) => (
                <option key={t} value={t}>
                  {ROTULO_TIPO[t]}
                </option>
              ))}
            </Selecao>
          </Campo>
          <Campo rotulo="Situação" id="situacao" obrigatorio>
            <Selecao
              id="situacao"
              value={r.situacao}
              onChange={(e) => mudar('situacao', e.target.value as RascunhoImovel['situacao'])}
            >
              {SITUACOES_IMOVEL.map((s) => (
                <option key={s} value={s}>
                  {ROTULO_SITUACAO[s]}
                </option>
              ))}
            </Selecao>
          </Campo>
          {precisaPrevisao && (
            <Campo
              rotulo="Previsão de entrega"
              id="previsaoEntrega"
              erro={erro('previsaoEntrega')}
              obrigatorio
            >
              <Input
                id="previsaoEntrega"
                type="month"
                value={r.previsaoEntrega}
                onChange={(e) => mudar('previsaoEntrega', e.target.value)}
                {...aria('previsaoEntrega', 'previsaoEntrega')}
              />
            </Campo>
          )}
          <Campo
            rotulo="Descrição"
            id="descricao"
            erro={erro('descricao')}
            ajuda="Conte como é o imóvel, o que tem por perto e as condições. Mínimo de 40 letras."
            obrigatorio
            className="sm:col-span-2"
          >
            <AreaTexto
              id="descricao"
              rows={6}
              value={r.descricao}
              onChange={(e) => mudar('descricao', e.target.value)}
              {...aria('descricao', 'descricao')}
            />
          </Campo>
        </div>
      </Cartao>

      <Cartao titulo="Valores">
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo rotulo="Preço (R$)" id="preco" erro={erro('preco')} obrigatorio>
            <Input
              id="preco"
              inputMode="decimal"
              placeholder="180000"
              value={r.preco}
              onChange={(e) => mudar('preco', e.target.value)}
              {...aria('preco', 'preco')}
            />
          </Campo>
          <Campo
            rotulo="Condomínio por mês (R$)"
            id="condominioMensal"
            erro={erro('condominioMensal')}
            ajuda="Deixe vazio se não tiver."
          >
            <Input
              id="condominioMensal"
              inputMode="decimal"
              value={r.condominioMensal}
              onChange={(e) => mudar('condominioMensal', e.target.value)}
              {...aria('condominioMensal', 'condominioMensal')}
            />
          </Campo>
          <Campo rotulo="IPTU por ano (R$)" id="iptuAnual" erro={erro('iptuAnual')}>
            <Input
              id="iptuAnual"
              inputMode="decimal"
              value={r.iptuAnual}
              onChange={(e) => mudar('iptuAnual', e.target.value)}
              {...aria('iptuAnual', 'iptuAnual')}
            />
          </Campo>
        </div>
      </Cartao>

      <Cartao
        titulo="Localização"
        descricao="O site mostra só a região aproximada (círculo no mapa), nunca o endereço exato."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo rotulo="Bairro" id="bairro" erro={erro('bairro')} obrigatorio>
            <Input
              id="bairro"
              value={r.bairro}
              onChange={(e) => mudar('bairro', e.target.value)}
              {...aria('bairro', 'bairro')}
            />
          </Campo>
          <Campo rotulo="Cidade" id="cidade" erro={erro('cidade')} obrigatorio>
            <Input
              id="cidade"
              value={r.cidade}
              onChange={(e) => mudar('cidade', e.target.value)}
              {...aria('cidade', 'cidade')}
            />
          </Campo>
          <Campo rotulo="UF" id="uf" erro={erro('uf')} obrigatorio>
            <Input
              id="uf"
              maxLength={2}
              value={r.uf}
              onChange={(e) => mudar('uf', e.target.value.toUpperCase())}
              {...aria('uf', 'uf')}
            />
          </Campo>
          <Campo
            rotulo="Latitude"
            id="lat"
            erro={erro('localizacaoAproximada.lat')}
            ajuda="No Google Maps, clique com o botão direito no local e copie os números. Pode colar os dois aqui."
            obrigatorio
          >
            <Input
              id="lat"
              inputMode="decimal"
              placeholder="-3.795"
              value={r.lat}
              onChange={(e) => {
                const v = e.target.value;
                const par = v.match(/^\s*(-?\d+[.,]\d+)\s*[,;]\s*(-?\d+[.,]\d+)\s*$/);
                if (par?.[1] && par[2]) {
                  setR((a) => ({ ...a, lat: par[1]!, lng: par[2]! }));
                  setAlterado(true);
                } else mudar('lat', v);
              }}
              {...aria('localizacaoAproximada.lat', 'lat')}
            />
          </Campo>
          <Campo rotulo="Longitude" id="lng" erro={erro('localizacaoAproximada.lng')} obrigatorio>
            <Input
              id="lng"
              inputMode="decimal"
              placeholder="-38.587"
              value={r.lng}
              onChange={(e) => mudar('lng', e.target.value)}
              {...aria('localizacaoAproximada.lng', 'lng')}
            />
          </Campo>
          <Campo
            rotulo="Raio no mapa (metros)"
            id="raioMetros"
            erro={erro('localizacaoAproximada.raioMetros')}
            ajuda="Mínimo 150 m."
            obrigatorio
          >
            <Input
              id="raioMetros"
              inputMode="numeric"
              value={r.raioMetros}
              onChange={(e) => mudar('raioMetros', e.target.value)}
              {...aria('localizacaoAproximada.raioMetros', 'raioMetros')}
            />
          </Campo>
        </div>
      </Cartao>

      <Cartao titulo="Características">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {(
            [
              ['quartos', 'Quartos'],
              ['suites', 'Suítes'],
              ['banheiros', 'Banheiros'],
              ['vagas', 'Vagas'],
              ['areaUtilM2', 'Área útil (m²)'],
              ['areaTerrenoM2', 'Terreno (m²)'],
            ] as const
          ).map(([campo, rotulo]) => (
            <Campo
              key={campo}
              rotulo={rotulo}
              id={campo}
              erro={erro(campo)}
              obrigatorio={campo !== 'areaTerrenoM2'}
            >
              <Input
                id={campo}
                inputMode="decimal"
                value={r[campo]}
                onChange={(e) => mudar(campo, e.target.value)}
                {...aria(campo, campo)}
              />
            </Campo>
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Campo
            rotulo="Destaques do imóvel"
            id="caracteristicas"
            erro={erro('caracteristicas')}
            ajuda="Um por linha. Ex.: quintal, portão eletrônico, cozinha americana"
          >
            <AreaTexto
              id="caracteristicas"
              rows={4}
              value={r.caracteristicas}
              onChange={(e) => mudar('caracteristicas', e.target.value)}
            />
          </Campo>
          <Campo
            rotulo="Lazer do condomínio"
            id="lazer"
            erro={erro('lazer')}
            ajuda="Um por linha. Deixe vazio se não tiver."
          >
            <AreaTexto
              id="lazer"
              rows={4}
              value={r.lazer}
              onChange={(e) => mudar('lazer', e.target.value)}
            />
          </Campo>
        </div>
      </Cartao>

      <Cartao titulo="Formas de pagamento aceitas">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(r.condicoes) as ChaveCondicao[]).map((chave) => (
            <label
              key={chave}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3"
            >
              <input
                type="checkbox"
                className="size-5 accent-primary"
                checked={r.condicoes[chave]}
                onChange={(e) => mudar('condicoes', { ...r.condicoes, [chave]: e.target.checked })}
              />
              {ROTULO_CONDICAO[chave]}
            </label>
          ))}
        </div>
      </Cartao>

      <Cartao
        titulo="Fotos"
        descricao="Arraste para mudar a ordem. A primeira foto é a capa do anúncio."
      >
        <GerenciadorFotos
          imovelId={id}
          fotos={r.fotos}
          onChange={(fotos) => mudar('fotos', fotos)}
          erros={erros}
        />
      </Cartao>

      <Cartao titulo="Perto do imóvel" descricao="Escolas, postos de saúde, mercados e ônibus.">
        <div className="space-y-3">
          {r.proximidades.map((p, i) => (
            <div
              key={i}
              className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[10rem_1fr_9rem_auto]"
            >
              <Selecao
                aria-label={`Tipo do local ${i + 1}`}
                value={p.tipo}
                onChange={(e) =>
                  mudar(
                    'proximidades',
                    r.proximidades.map((x, n) =>
                      n === i ? { ...x, tipo: e.target.value as TipoProximidade } : x,
                    ),
                  )
                }
              >
                {TIPOS_PROXIMIDADE.map((t) => (
                  <option key={t} value={t}>
                    {ROTULO_PROXIMIDADE[t]}
                  </option>
                ))}
              </Selecao>
              <Input
                aria-label={`Nome do local ${i + 1}`}
                placeholder="Nome do local"
                value={p.nome}
                aria-invalid={Boolean(erro(`proximidades.${i}.nome`)) || undefined}
                onChange={(e) =>
                  mudar(
                    'proximidades',
                    r.proximidades.map((x, n) => (n === i ? { ...x, nome: e.target.value } : x)),
                  )
                }
              />
              <Input
                aria-label={`Distância do local ${i + 1} em metros`}
                placeholder="Metros"
                inputMode="numeric"
                value={p.distanciaMetros}
                aria-invalid={Boolean(erro(`proximidades.${i}.distanciaMetros`)) || undefined}
                onChange={(e) =>
                  mudar(
                    'proximidades',
                    r.proximidades.map((x, n) =>
                      n === i ? { ...x, distanciaMetros: e.target.value } : x,
                    ),
                  )
                }
              />
              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                aria-label={`Remover local ${i + 1}`}
                onClick={() =>
                  mudar(
                    'proximidades',
                    r.proximidades.filter((_, n) => n !== i),
                  )
                }
              >
                <Trash2 aria-hidden />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              mudar('proximidades', [
                ...r.proximidades,
                { tipo: 'escola', nome: '', distanciaMetros: '' },
              ])
            }
          >
            <Plus aria-hidden /> Adicionar local
          </Button>
          {erro('proximidades') && (
            <p className="text-sm font-medium text-destructive" role="alert">
              {erro('proximidades')}. Preencha o nome e a distância em metros, ou remova o local.
            </p>
          )}
        </div>
      </Cartao>

      <Cartao titulo="Vídeo e tour (opcional)">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Link do vídeo (YouTube)" id="videoUrl" erro={erro('videoUrl')}>
            <Input
              id="videoUrl"
              type="url"
              value={r.videoUrl}
              onChange={(e) => mudar('videoUrl', e.target.value)}
              {...aria('videoUrl', 'videoUrl')}
            />
          </Campo>
          <Campo rotulo="Link do tour 360°" id="tour360Url" erro={erro('tour360Url')}>
            <Input
              id="tour360Url"
              type="url"
              value={r.tour360Url}
              onChange={(e) => mudar('tour360Url', e.target.value)}
              {...aria('tour360Url', 'tour360Url')}
            />
          </Campo>
        </div>
      </Cartao>

      <Cartao titulo="Publicação">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Status" id="status" ajuda={AJUDA_STATUS_PAINEL[r.status]}>
            <Selecao
              id="status"
              value={r.status}
              onChange={(e) => mudar('status', e.target.value as StatusPainel)}
            >
              {STATUS_PAINEL.map((s) => (
                <option key={s} value={s}>
                  {ROTULO_STATUS_PAINEL[s]}
                </option>
              ))}
            </Selecao>
          </Campo>
          {ehAdmin && (
            <Campo
              rotulo="Corretor responsável"
              id="corretorResponsavelId"
              erro={erro('corretorResponsavelId')}
            >
              <Selecao
                id="corretorResponsavelId"
                value={r.corretorResponsavelId}
                onChange={(e) => mudar('corretorResponsavelId', e.target.value)}
              >
                {corretores.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </Selecao>
            </Campo>
          )}
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 sm:col-span-2">
            <input
              type="checkbox"
              className="size-5 accent-primary"
              checked={r.destaque}
              onChange={(e) => mudar('destaque', e.target.checked)}
            />
            Mostrar em &quot;Imóveis em destaque&quot; na página inicial
          </label>
        </div>
      </Cartao>

      {/* Barra fixa de ações */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-card/95 px-4 py-3 shadow-[0_-4px_16px_rgb(0_0_0/0.06)] backdrop-blur lg:left-60">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2">
          <div className="mr-auto min-w-0 text-sm" aria-live="polite">
            {resultado ? (
              <span
                className={
                  resultado.tom === 'erro'
                    ? 'font-semibold text-perda'
                    : 'font-semibold text-sucesso'
                }
              >
                {resultado.texto}
              </span>
            ) : alterado ? (
              <span className="text-muted-foreground">Alterações não salvas</span>
            ) : codigo ? (
              <span className="text-muted-foreground">Cód. {codigo}</span>
            ) : null}
          </div>
          {id && slug && (
            <Button asChild variant="outline">
              <Link href={`/admin/imoveis/previa?id=${id}`}>
                <Eye aria-hidden /> Pré-visualizar
              </Link>
            </Button>
          )}
          <Button
            type="submit"
            variant={r.status === 'rascunho' ? 'outline' : 'default'}
            disabled={salvando}
          >
            <Save aria-hidden />
            {salvando ? 'Salvando…' : r.status === 'rascunho' ? 'Salvar rascunho' : 'Salvar'}
          </Button>
          {r.status === 'rascunho' && (
            <Button
              type="button"
              variant="destaque"
              disabled={salvando}
              onClick={() => salvar('publicado')}
            >
              <Send aria-hidden /> Publicar
            </Button>
          )}
        </div>
      </div>
      {erros.geral && <Aviso tom="erro">{erros.geral}</Aviso>}
    </form>
  );
}
