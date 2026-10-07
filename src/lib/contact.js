// Canal de atendimento comercial (WhatsApp). Fonte única: landing e avisos de limite.
export const SALES_WHATSAPP = '5511970858297';

export function contactUrl(text) {
  return SALES_WHATSAPP ? `https://wa.me/${SALES_WHATSAPP}?text=${encodeURIComponent(text)}` : '#';
}
