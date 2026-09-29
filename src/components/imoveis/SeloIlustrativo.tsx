import { MODO_DEMO } from '@/config/site';
import { Selo } from '@/components/comum/Selo';

export function SeloIlustrativo({ exemplo, className }: { exemplo: boolean; className?: string }) {
  if (!MODO_DEMO || !exemplo) return null;
  return (
    <Selo tom="aviso" className={className}>
      Imóvel ilustrativo
    </Selo>
  );
}
