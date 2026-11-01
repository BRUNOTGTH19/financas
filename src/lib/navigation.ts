export const SECTIONS = ['inicio', 'semanas', 'gastos', 'fixos', 'configuracoes'] as const;

export type Section = (typeof SECTIONS)[number];

export interface NavItem {
  section: Section;
  label: string;
  shortLabel: string;
}

export const NAV_ITEMS: NavItem[] = [
  { section: 'inicio', label: 'Início', shortLabel: 'Início' },
  { section: 'semanas', label: 'Semanas', shortLabel: 'Semanas' },
  { section: 'gastos', label: 'Gastos', shortLabel: 'Gastos' },
  { section: 'fixos', label: 'Fixos', shortLabel: 'Fixos' },
  { section: 'configuracoes', label: 'Ajustes', shortLabel: 'Ajustes' },
];

export function isSection(value: string | undefined): value is Section {
  return !!value && (SECTIONS as readonly string[]).includes(value);
}

export function sectionFromPath(pathname: string): Section {
  const lastSegment = pathname.split('/').filter(Boolean).at(-1);
  return isSection(lastSegment) ? lastSegment : 'inicio';
}

export function monthPath(month: string, section: Section): string {
  return `/mes/${month}/${section}`;
}
