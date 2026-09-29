/** Dados estruturados (Schema.org). Escapa "<" para evitar injeção de HTML. */
export function JsonLd({ dados }: { dados: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(dados).replace(/</g, '\\u003c') }}
    />
  );
}
