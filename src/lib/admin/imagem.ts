/**
 * Compressão das fotos no navegador antes do envio: maior lado com no máximo 1920 px e
 * formato WebP. Assim o upload é rápido mesmo no 4G e o Storage não guarda fotos de 8 MB.
 */
export const LADO_MAXIMO_FOTO = 1920;
const QUALIDADE = 0.82;

export async function comprimirFoto(arquivo: File): Promise<Blob> {
  if (!arquivo.type.startsWith('image/')) throw new Error('O arquivo não é uma imagem.');
  const bitmap = await createImageBitmap(arquivo, { imageOrientation: 'from-image' });
  const escala = Math.min(1, LADO_MAXIMO_FOTO / Math.max(bitmap.width, bitmap.height));
  const largura = Math.round(bitmap.width * escala);
  const altura = Math.round(bitmap.height * escala);

  const canvas = document.createElement('canvas');
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível processar a imagem.');
  ctx.drawImage(bitmap, 0, 0, largura, altura);
  bitmap.close();

  const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/webp', QUALIDADE));
  if (!blob || blob.type !== 'image/webp')
    throw new Error('Seu navegador não converte fotos para WebP. Use o Chrome, Edge ou Firefox.');
  return blob;
}
