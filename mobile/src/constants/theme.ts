import { Platform } from 'react-native';

// Mesma identidade visual do front-end web da Fase 3 (tons de papel, verde
// profundo e coral), adaptada para telas pequenas.
export const Colors = {
  ink: '#1d2825',
  muted: '#68726e',
  paper: '#f5f3ed',
  white: '#fffdf9',
  line: '#d9ddd5',
  sage: '#b8c9b3',
  sageSoft: '#e4ebe1',
  deep: '#31544d',
  coral: '#d8684c',
  coralSoft: '#f8e3dc',
  danger: '#b3412a',
} as const;

export const Fonts = {
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }),
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui, sans-serif' }),
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

// Em tablets e na web o conteúdo fica centralizado com largura máxima.
export const MaxContentWidth = 720;
