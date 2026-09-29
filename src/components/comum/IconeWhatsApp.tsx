/** Ícone genérico de balão de conversa com telefone (desenho próprio, sem marca registrada). */
export function IconeWhatsApp({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 20.5l1.3-4A8.5 8.5 0 1 1 8 19.3z" />
      <path
        d="M9 8.8c.2-.5.5-.6.8-.6h.5c.2 0 .4.1.5.4l.7 1.6c.1.2 0 .5-.1.6l-.5.6c.6 1.1 1.4 1.9 2.5 2.5l.6-.5c.2-.2.4-.2.6-.1l1.6.7c.3.1.4.3.4.5v.5c0 .3-.1.6-.6.8-.6.3-1.6.4-3-.3a8 8 0 0 1-3.8-3.8c-.6-1.3-.5-2.3-.2-2.9z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}
