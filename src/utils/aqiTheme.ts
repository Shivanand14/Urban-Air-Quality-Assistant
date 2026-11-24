import type { CpcbCategory } from '../types/breathewise.ts';

export interface CpcbVisualStyle {
  label: CpcbCategory;
  range: string;
  accentHex: string;
  barBgClass: string;
  surfaceBgClass: string;
  borderClass: string;
  textClass: string;
  chartStroke: string;
  chartFill: string;
}

export function getCpcbVisualStyle(category: CpcbCategory): CpcbVisualStyle {
  switch (category) {
    case 'Good':
      return {
        label: 'Good',
        range: '0–50',
        accentHex: '#16A34A',
        barBgClass: 'bg-green-600',
        surfaceBgClass: 'bg-green-50/70',
        borderClass: 'border-green-200',
        textClass: 'text-green-800',
        chartStroke: '#16A34A',
        chartFill: '#22C55E',
      };
    case 'Satisfactory':
      return {
        label: 'Satisfactory',
        range: '51–100',
        accentHex: '#65A30D',
        barBgClass: 'bg-lime-600',
        surfaceBgClass: 'bg-lime-50/70',
        borderClass: 'border-lime-200',
        textClass: 'text-lime-800',
        chartStroke: '#65A30D',
        chartFill: '#84CC16',
      };
    case 'Moderate':
      return {
        label: 'Moderate',
        range: '101–200',
        accentHex: '#CA8A04',
        barBgClass: 'bg-yellow-500',
        surfaceBgClass: 'bg-yellow-50/80',
        borderClass: 'border-yellow-200',
        textClass: 'text-yellow-900',
        chartStroke: '#CA8A04',
        chartFill: '#EAB308',
      };
    case 'Poor':
      return {
        label: 'Poor',
        range: '201–300',
        accentHex: '#EA580C',
        barBgClass: 'bg-orange-600',
        surfaceBgClass: 'bg-orange-50/80',
        borderClass: 'border-orange-200',
        textClass: 'text-orange-900',
        chartStroke: '#EA580C',
        chartFill: '#F97316',
      };
    case 'Very Poor':
      return {
        label: 'Very Poor',
        range: '301–400',
        accentHex: '#DC2626',
        barBgClass: 'bg-red-600',
        surfaceBgClass: 'bg-red-50/80',
        borderClass: 'border-red-200',
        textClass: 'text-red-900',
        chartStroke: '#DC2626',
        chartFill: '#EF4444',
      };
    case 'Severe':
      return {
        label: 'Severe',
        range: '401–500',
        accentHex: '#881337',
        barBgClass: 'bg-rose-900',
        surfaceBgClass: 'bg-rose-50/90',
        borderClass: 'border-rose-300',
        textClass: 'text-rose-950',
        chartStroke: '#881337',
        chartFill: '#9F1239',
      };
  }
}

export const CPCB_SCALE_BANDS: Array<{
  category: CpcbCategory;
  range: string;
  colorHex: string;
  impact: string;
}> = [
  {
    category: 'Good',
    range: '0–50',
    colorHex: '#16A34A',
    impact: 'Minimal impact; suitable for normal outdoor play and exercise.',
  },
  {
    category: 'Satisfactory',
    range: '51–100',
    colorHex: '#65A30D',
    impact: 'Minor breathing discomfort possible only for sensitive individuals.',
  },
  {
    category: 'Moderate',
    range: '101–200',
    colorHex: '#CA8A04',
    impact: 'Breathing discomfort possible for children, elderly adults, and asthma patients.',
  },
  {
    category: 'Poor',
    range: '201–300',
    colorHex: '#EA580C',
    impact: 'Breathing discomfort on prolonged exposure; move vigorous exercise indoors.',
  },
  {
    category: 'Very Poor',
    range: '301–400',
    colorHex: '#DC2626',
    impact: 'Respiratory illness risk on prolonged exposure; seal windows and run HEPA filtration.',
  },
  {
    category: 'Severe',
    range: '401–500',
    colorHex: '#881337',
    impact: 'Affects healthy people and severely impacts sensitive groups; avoid outdoor exertion.',
  },
];
