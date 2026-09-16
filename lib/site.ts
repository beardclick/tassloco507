export const SITE = {
  name: 'Tass Loco 507',
  tagline: 'Fashion. Car. Racing.',
  description:
    'Tienda online de piezas de auto, accesorios racing y ropa streetwear en Panamá.',
  url: 'https://tassloco507.com',
  locale: 'es-PA',
  country: 'Panamá',
  currency: 'USD',
  logo: 'https://tassloco507.com/wp-content/uploads/2020/07/tass-loco-R-674x800.png',
  logoWhite: 'https://tassloco507.com/wp-content/uploads/2020/07/tass-loco-R-674x800.png',
  email: 'tassloco507@gmail.com',
  whatsapp: '+507 6614-7424',
  whatsappLink: 'https://wa.me/50766147424',
  instagram: 'https://www.instagram.com/tassloco_507/',
  instagramHandle: '@tassloco_507',
  youtube: 'https://www.youtube.com/user/hubyhedmotor/featured',
} as const;

export interface PaymentMethod {
  id: string;
  name: string;
  short: string;
  description: string;
  details: { label: string; value: string }[];
  note: string;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'transferencia',
    name: 'Transferencia Bancaria',
    short: 'Transferencia',
    description:
      'Paga mediante transferencia o depósito bancario. Tu pedido se procesa al confirmar el pago.',
    details: [
      { label: 'Banco', value: 'Banco General' },
      { label: 'Titular', value: 'Tass Loco 507' },
      { label: 'Cuenta', value: '0000-0000-000000' },
      { label: 'Tipo', value: 'Cuenta de ahorros' },
    ],
    note: 'Envía tu comprobante por WhatsApp para agilizar el despacho.',
  },
  {
    id: 'efectivo',
    name: 'Efectivo',
    short: 'Contra entrega',
    description:
      'Paga en efectivo al recibir tu pedido. Aplican zonas de entrega dentro de Panamá.',
    details: [],
    note: 'Ten el monto exacto listo al momento de la entrega.',
  },
];

export const PROVINCIAS = [
  'Panamá',
  'Panamá Oeste',
  'Colón',
  'Chiriquí',
  'Coclé',
  'Herrera',
  'Los Santos',
  'Veraguas',
  'Bocas del Toro',
  'Darién',
];
