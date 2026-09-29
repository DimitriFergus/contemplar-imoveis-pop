/**
 * Leitor e escritor de CSV (RFC 4180) sem dependências.
 * Aceita separador ";" (padrão do Excel em português) ou ",", detectado pelo cabeçalho.
 */

export function detectarSeparador(primeiraLinha: string): ';' | ',' {
  const pontoEVirgula = (primeiraLinha.match(/;/g) ?? []).length;
  const virgula = (primeiraLinha.match(/,/g) ?? []).length;
  return pontoEVirgula >= virgula ? ';' : ',';
}

export function lerCSV(conteudo: string, separador?: ';' | ','): string[][] {
  const texto = conteudo.replace(/^﻿/, '');
  const sep = separador ?? detectarSeparador(texto.split(/\r?\n/, 1)[0] ?? '');
  const linhas: string[][] = [];
  let linha: string[] = [];
  let campo = '';
  let entreAspas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (entreAspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          entreAspas = false;
        }
      } else {
        campo += c;
      }
      continue;
    }
    if (c === '"') entreAspas = true;
    else if (c === sep) {
      linha.push(campo);
      campo = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      linha.push(campo);
      linhas.push(linha);
      linha = [];
      campo = '';
    } else campo += c;
  }
  if (campo !== '' || linha.length > 0) {
    linha.push(campo);
    linhas.push(linha);
  }
  return linhas.filter((l) => l.some((v) => v.trim() !== ''));
}

/** Converte em objetos usando a primeira linha como cabeçalho. Guarda o número da linha original. */
export function lerCSVComoObjetos(
  conteudo: string,
): { linha: number; dados: Record<string, string> }[] {
  const [cabecalho, ...linhas] = lerCSV(conteudo);
  if (!cabecalho) return [];
  const chaves = cabecalho.map((c) => c.trim());
  return linhas.map((valores, idx) => ({
    linha: idx + 2,
    dados: Object.fromEntries(chaves.map((chave, i) => [chave, (valores[i] ?? '').trim()])),
  }));
}

function escapar(valor: string, sep: string): string {
  return /["\n\r]/.test(valor) || valor.includes(sep) ? `"${valor.replace(/"/g, '""')}"` : valor;
}

export function escreverCSV(cabecalho: string[], linhas: string[][], sep: ';' | ',' = ';'): string {
  return (
    [cabecalho, ...linhas].map((l) => l.map((v) => escapar(v, sep)).join(sep)).join('\r\n') + '\r\n'
  );
}
