export interface PastelSet {
  id: string;
  name: string;
  themeLabel: string;
  dotColor: string; // Retained for backward compat / accent
  canvasBg: string; // Tailwind background & text classes
  canvasBorder: string; // Tailwind border classes
  swatchHex: string; // Hex for the color swatch preview dot
  badgeClass: string; // Pill badge for current active pastel variant
  accentText: string;
  description: string;
  headerRuleColor: string; // Classic red/rose header rule across the top
  ruleColor: string; // Classic cyan/blue horizontal ruling lines
  marginColor: string; // Classic faint vertical red/coral margin line
  paperColorHex: string; // Authentic pastel cardstock background color
}

export const PASTEL_COLOR_SETS: PastelSet[] = [
  {
    id: 'lavender',
    name: 'Lavender',
    themeLabel: 'Pastel Lavender 3×5 Card',
    dotColor: '#a855f7',
    canvasBg: 'bg-[#faf7fe] dark:bg-[#1e152a] text-slate-800 dark:text-slate-100',
    canvasBorder: 'border-purple-300/80 dark:border-purple-800/80 shadow-[0_10px_30px_-5px_rgba(168,85,247,0.12)]',
    swatchHex: '#c084fc',
    badgeClass: 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    accentText: 'text-purple-600 dark:text-purple-400',
    description: 'Soft lavender 3×5 note card with classic red headline & blue rules',
    headerRuleColor: '#f43f5e',
    ruleColor: 'rgba(99, 102, 241, 0.28)',
    marginColor: 'rgba(244, 63, 94, 0.4)',
    paperColorHex: '#faf7fe',
  },
  {
    id: 'amber',
    name: 'Warm Amber',
    themeLabel: 'Pastel Canary Amber 3×5 Card',
    dotColor: '#f59e0b',
    canvasBg: 'bg-[#fffdf4] dark:bg-[#251e12] text-slate-800 dark:text-slate-100',
    canvasBorder: 'border-amber-300/80 dark:border-amber-800/80 shadow-[0_10px_30px_-5px_rgba(245,158,11,0.12)]',
    swatchHex: '#fbbf24',
    badgeClass: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    accentText: 'text-amber-600 dark:text-amber-400',
    description: 'Classic canary yellow 3×5 ruled index card',
    headerRuleColor: '#f43f5e',
    ruleColor: 'rgba(59, 130, 246, 0.3)',
    marginColor: 'rgba(244, 63, 94, 0.4)',
    paperColorHex: '#fffdf4',
  },
  {
    id: 'peach',
    name: 'Soft Peach',
    themeLabel: 'Pastel Peach 3×5 Card',
    dotColor: '#fb923c',
    canvasBg: 'bg-[#fff8f3] dark:bg-[#281b14] text-slate-800 dark:text-slate-100',
    canvasBorder: 'border-orange-300/80 dark:border-orange-800/80 shadow-[0_10px_30px_-5px_rgba(249,115,22,0.12)]',
    swatchHex: '#fdba74',
    badgeClass: 'bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    accentText: 'text-orange-600 dark:text-orange-400',
    description: 'Warm apricot peach 3×5 index card with red headline',
    headerRuleColor: '#f43f5e',
    ruleColor: 'rgba(59, 130, 246, 0.28)',
    marginColor: 'rgba(244, 63, 94, 0.4)',
    paperColorHex: '#fff8f3',
  },
  {
    id: 'teal',
    name: 'Pastel Teal',
    themeLabel: 'Pastel Seafoam Teal 3×5 Card',
    dotColor: '#14b8a6',
    canvasBg: 'bg-[#f2fbf9] dark:bg-[#102421] text-slate-800 dark:text-slate-100',
    canvasBorder: 'border-teal-300/80 dark:border-teal-800/80 shadow-[0_10px_30px_-5px_rgba(20,184,166,0.12)]',
    swatchHex: '#5eead4',
    badgeClass: 'bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    accentText: 'text-teal-600 dark:text-teal-400',
    description: 'Refreshing seafoam mint green 3×5 index card',
    headerRuleColor: '#f43f5e',
    ruleColor: 'rgba(13, 148, 136, 0.3)',
    marginColor: 'rgba(244, 63, 94, 0.4)',
    paperColorHex: '#f2fbf9',
  },
  {
    id: 'pink',
    name: 'Blush Pink',
    themeLabel: 'Pastel Blush Pink 3×5 Card',
    dotColor: '#ec4899',
    canvasBg: 'bg-[#fef4f7] dark:bg-[#28151f] text-slate-800 dark:text-slate-100',
    canvasBorder: 'border-pink-300/80 dark:border-pink-800/80 shadow-[0_10px_30px_-5px_rgba(236,72,153,0.12)]',
    swatchHex: '#f472b6',
    badgeClass: 'bg-pink-100 dark:bg-pink-900/60 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800',
    accentText: 'text-pink-600 dark:text-pink-400',
    description: 'Rose blush pink 3×5 stationery index card',
    headerRuleColor: '#e11d48',
    ruleColor: 'rgba(59, 130, 246, 0.28)',
    marginColor: 'rgba(225, 29, 72, 0.4)',
    paperColorHex: '#fef4f7',
  },
  {
    id: 'baby-blue',
    name: 'Baby Blue',
    themeLabel: 'Pastel Baby Blue 3×5 Card',
    dotColor: '#38bdf8',
    canvasBg: 'bg-[#f2f8fe] dark:bg-[#121f2d] text-slate-800 dark:text-slate-100',
    canvasBorder: 'border-sky-300/80 dark:border-sky-800/80 shadow-[0_10px_30px_-5px_rgba(56,189,248,0.12)]',
    swatchHex: '#7dd3fc',
    badgeClass: 'bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    accentText: 'text-sky-600 dark:text-sky-400',
    description: 'Classic powder blue ruled 3×5 note card',
    headerRuleColor: '#f43f5e',
    ruleColor: 'rgba(37, 99, 235, 0.3)',
    marginColor: 'rgba(244, 63, 94, 0.4)',
    paperColorHex: '#f2f8fe',
  },
  {
    id: 'matcha',
    name: 'Matcha Sage',
    themeLabel: 'Pastel Matcha Sage 3×5 Card',
    dotColor: '#10b981',
    canvasBg: 'bg-[#f3faf5] dark:bg-[#14251a] text-slate-800 dark:text-slate-100',
    canvasBorder: 'border-emerald-300/80 dark:border-emerald-800/80 shadow-[0_10px_30px_-5px_rgba(16,185,129,0.12)]',
    swatchHex: '#6ee7b7',
    badgeClass: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    description: 'Serene botanical matcha green 3×5 note card',
    headerRuleColor: '#f43f5e',
    ruleColor: 'rgba(5, 150, 105, 0.28)',
    marginColor: 'rgba(244, 63, 94, 0.4)',
    paperColorHex: '#f3faf5',
  },
];

export function getRandomPastelSet(excludeId?: string): PastelSet {
  const candidates = excludeId
    ? PASTEL_COLOR_SETS.filter((s) => s.id !== excludeId)
    : PASTEL_COLOR_SETS;
  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}
