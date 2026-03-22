export type LavaLampTheme = 'sunset' | 'tropical' | 'aurora' | 'neon' | 'lisbon';
export type LavaLampColorTheme = LavaLampTheme;

export const LAVA_LAMP_THEMES: Record<LavaLampTheme, string[]> = {
  sunset: ['#ff7a18', '#ffb347', '#ff6b6b', '#ff4d6d', '#feca57'],
  tropical: ['#00c9a7', '#2ecc71', '#f9f871', '#00b4d8', '#ffbe0b'],
  aurora: ['#4cc9f0', '#4895ef', '#4361ee', '#7209b7', '#f72585'],
  neon: ['#ff006e', '#fb5607', '#ffbe0b', '#3a86ff', '#06ffa5'],
  lisbon: ['#0066ff', '#9cfac5', '#00d8b8', '#03cdff', '#f1ff83'],
};

export const COLOR_THEMES = LAVA_LAMP_THEMES;

export const LAVA_LAMP_THEME_LIST = Object.entries(LAVA_LAMP_THEMES).map(([id, colors]) => ({
  id: id as LavaLampTheme,
  label: id.charAt(0).toUpperCase() + id.slice(1),
  color: colors[0],
}));
