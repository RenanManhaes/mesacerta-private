// Paleta central dos graficos (MCT-47). Os valores reais vivem em
// src/styles/chart-palette.css; aqui so ha referencias a variaveis CSS,
// para que SVG inline e CSS sigam a mesma cor base.
// Uma cor por grafico: use `base` e, para separar valores, `tones`.
export const chartPalette = {
  base: 'var(--chart-base)',
  tones: ['var(--chart-tone-1)', 'var(--chart-tone-2)', 'var(--chart-tone-3)'],
  track: 'var(--chart-track)',
};
