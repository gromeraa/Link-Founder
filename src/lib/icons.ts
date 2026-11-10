import {
  Github, Building2, Sparkles, Smartphone, Palette, Code2, BookOpen, Briefcase,
  Film, Music, ShoppingBag, GraduationCap, Newspaper, Wrench, Globe, Heart, Star,
  Folder, Rocket, Camera, LayoutTemplate, Database, Cloud, Gamepad2, Type, PenTool,
  Bot, Landmark, Stethoscope, Plane, type LucideIcon,
} from 'lucide-react';
import type { ColorName } from './types';

/**
 * Ícones disponíveis para coleções.
 * Para adicionar outro: importe de 'lucide-react' (https://lucide.dev/icons) e inclua aqui.
 */
export const ICONS: Record<string, LucideIcon> = {
  folder: Folder,
  github: Github,
  code: Code2,
  building: Building2,
  briefcase: Briefcase,
  sparkles: Sparkles,
  bot: Bot,
  smartphone: Smartphone,
  layout: LayoutTemplate,
  palette: Palette,
  pen: PenTool,
  type: Type,
  book: BookOpen,
  graduation: GraduationCap,
  newspaper: Newspaper,
  wrench: Wrench,
  database: Database,
  cloud: Cloud,
  globe: Globe,
  rocket: Rocket,
  camera: Camera,
  film: Film,
  music: Music,
  gamepad: Gamepad2,
  shopping: ShoppingBag,
  landmark: Landmark,
  health: Stethoscope,
  travel: Plane,
  heart: Heart,
  star: Star,
};

export function iconFor(name: string): LucideIcon {
  return ICONS[name] ?? Folder;
}

/** Cores de sistema da Apple (claro / escuro). */
export const COLORS: Record<ColorName, { light: string; dark: string; label: string }> = {
  blue: { light: '#007AFF', dark: '#0A84FF', label: 'Azul' },
  indigo: { light: '#5856D6', dark: '#5E5CE6', label: 'Índigo' },
  purple: { light: '#AF52DE', dark: '#BF5AF2', label: 'Roxo' },
  pink: { light: '#FF2D55', dark: '#FF375F', label: 'Rosa' },
  red: { light: '#FF3B30', dark: '#FF453A', label: 'Vermelho' },
  orange: { light: '#FF9500', dark: '#FF9F0A', label: 'Laranja' },
  yellow: { light: '#FFCC00', dark: '#FFD60A', label: 'Amarelo' },
  green: { light: '#34C759', dark: '#30D158', label: 'Verde' },
  teal: { light: '#30B0C7', dark: '#40C8E0', label: 'Turquesa' },
  gray: { light: '#8E8E93', dark: '#98989D', label: 'Cinza' },
};

export const COLOR_NAMES = Object.keys(COLORS) as ColorName[];
