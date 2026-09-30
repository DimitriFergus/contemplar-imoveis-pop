'use client';

import { BUCKET_FOTOS } from '@/lib/supabase/config';
import { clienteNavegador } from '@/lib/supabase/navegador';
import type { Foto } from '@/types';

/**
 * Envio das fotos para o Storage. O Storage só aceita fotos de um imóvel que já existe
 * (pasta = id do imóvel), então no cadastro de um imóvel novo as fotos ficam guardadas no
 * navegador (endereço blob:) e são enviadas logo depois que o imóvel é criado, no mesmo clique.
 */
const pendentes = new Map<string, Blob>();

export function guardarFotoPendente(blob: Blob): string {
  const url = URL.createObjectURL(blob);
  pendentes.set(url, blob);
  return url;
}

/** Envia uma foto (já em WebP) para a pasta do imóvel e devolve o endereço público. */
export async function enviarFoto(imovelId: string, blob: Blob): Promise<string> {
  const supabase = clienteNavegador();
  const caminho = `${imovelId}/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage.from(BUCKET_FOTOS).upload(caminho, blob, {
    contentType: 'image/webp',
    cacheControl: '31536000',
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET_FOTOS).getPublicUrl(caminho).data.publicUrl;
}

/** Envia as fotos guardadas no navegador; as que já estão no Storage seguem como estão. */
export async function enviarFotosPendentes(
  imovelId: string,
  fotos: Foto[],
): Promise<{ fotos: Foto[]; falhas: number }> {
  const enviadas: Foto[] = [];
  let falhas = 0;
  for (const foto of fotos) {
    const blob = pendentes.get(foto.arquivo);
    if (!blob) {
      enviadas.push(foto);
      continue;
    }
    try {
      enviadas.push({ ...foto, arquivo: await enviarFoto(imovelId, blob) });
      pendentes.delete(foto.arquivo);
      URL.revokeObjectURL(foto.arquivo);
    } catch {
      falhas++;
    }
  }
  return { fotos: enviadas, falhas };
}
