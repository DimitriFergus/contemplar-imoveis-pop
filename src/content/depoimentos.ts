export interface Depoimento {
  nome: string;
  contexto: string;
  texto: string;
  /** true = depoimento de exemplo (exibido como ilustrativo no modo demonstração). */
  ilustrativo: boolean;
}

/**
 * Depoimentos ILUSTRATIVOS para a fase de demonstração. Substituir por depoimentos reais,
 * com autorização por escrito de cada cliente (LGPD e direito de imagem).
 */
export const DEPOIMENTOS: Depoimento[] = [
  {
    nome: 'Cliente A. (ilustrativo)',
    contexto: 'Primeiro apartamento, usou FGTS',
    texto:
      'A gente achava que não ia conseguir. Fizemos a simulação, entendemos quanto dava por mês e a equipe explicou cada documento pelo WhatsApp.',
    ilustrativo: true,
  },
  {
    nome: 'Cliente B. (ilustrativo)',
    contexto: 'Casa com quintal, Minha Casa, Minha Vida',
    texto:
      'Gostei de ver o custo total antes: ITBI, cartório, tudo. Não tivemos surpresa na hora de assinar.',
    ilustrativo: true,
  },
  {
    nome: 'Cliente C. (ilustrativo)',
    contexto: 'Autônoma, renda comprovada por extrato',
    texto:
      'Eu trabalho por conta própria e tinha medo de ser reprovada. Me orientaram sobre como comprovar a renda e deu certo.',
    ilustrativo: true,
  },
];
