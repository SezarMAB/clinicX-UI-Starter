export interface SurfaceFlags {
  fremdarbeit: boolean;
  ersetzen: boolean;
  roentgen: boolean;
}

export interface SurfaceState {
  caries: string | null;
  behandlungsbedarf: string;
  fuellmaterial: string;
  flags: SurfaceFlags;
}

export interface ToothData {
  surfaces: {
    [key: string]: SurfaceState;
  };
  findings: string[];
}

export interface Finding {
  id: string;
  name: string;
  icon: string;
}

export type ToothDataMap = {
  [toothNumber: number]: ToothData;
};

export const CARIES_COLORS: { [key: string]: string } = {
  unbestimmt: '#9e9e9e',
  1: '#90caf9',
  2: '#42a5f5',
  3: '#ef5350',
  4: '#d32f2f',
  5: '#590303',
};

export const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
export const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export const FINDINGS: Finding[] = [
  { id: 'ohne_befund', name: 'Ohne Befund', icon: '✓' },
  { id: 'lueckenschluss', name: 'Lückenschluss', icon: ')(' },
  { id: 'fehlt', name: 'fehlt', icon: '✗' },
  { id: 'achter_fehlen', name: '8er fehlen', icon: '8' },
  { id: 'durchbruch', name: 'im Durchbruch', icon: '↑' },
  { id: 'zerstoert', name: 'zerstört', icon: '💥' },
  { id: 'wurzelrest', name: 'Wurzelrest', icon: '🦷' },
  { id: 'milchzahn', name: 'Milchzahn', icon: '🍼' },
  { id: 'doppelte_anlage', name: 'doppelte Anlage', icon: '👥' },
  { id: 'versiegelung', name: 'Versiegelung', icon: '🔒' },
  { id: 'vitalitaet', name: 'Vitalitätsprüfung', icon: '+?' },
  { id: 'perkussion', name: 'Perkussionstest', icon: 'P+?' },
  { id: 'keilfoermig', name: 'Keilförmiger Def.', icon: '📐' },
  { id: 'lockerung', name: 'Lockerungsgrad I-III', icon: 'I,II,III' },
  { id: 'empty1', name: '', icon: '' },
  { id: 'ersetzt', name: 'ersetzt', icon: '🔄' },
  { id: 'herd', name: 'Herd', icon: '🔴' },
  { id: 'ur', name: 'UR', icon: 'UR' },
  { id: 'totale_ok', name: 'Totale OK', icon: '⬜' },
  { id: 'hemisektion', name: 'Hemisektion', icon: '½' },
  { id: 'sr', name: 'SR', icon: 'SR' },
  { id: 'totale_uk', name: 'Totale UK', icon: '⬜' },
  { id: 'abrasion', name: 'Abrasion', icon: '///' },
  { id: 'erosion', name: 'Erosion', icon: '~~~' },
  { id: 'implantat', name: 'Implantat', icon: '🔩' },
  { id: 'brackets', name: 'Brackets', icon: '⚙️' },
  { id: 'retainer', name: 'Retainer', icon: '↔️' },
  { id: 'krone', name: 'Krone', icon: '👑' },
  { id: 'rezession', name: 'Rezession', icon: '📉' },
  { id: 'zahnwanderung', name: 'Zahnwanderung', icon: '→' },
  { id: 'teilkrone', name: 'Teilkrone', icon: '½👑' },
  { id: 'drehung', name: 'Drehung', icon: '🔄' },
  { id: 'kippung', name: 'Kippung', icon: '📐' },
  { id: 'brueckenglied', name: 'Brückenglied', icon: '🌉' },
  { id: 'wurzelzahl', name: 'Wurzelzahl', icon: '🦷' },
  { id: 'empty2', name: '', icon: '' },
  { id: 'teleskop', name: 'Teleskop', icon: '🔭' },
  { id: 'wsr', name: 'WSR', icon: 'WSR' },
  { id: 'empty3', name: '', icon: '' },
  { id: 'stiftaufbau', name: 'Stiftaufbau', icon: '📌' },
  { id: 'verbblockung', name: 'Verbblockung', icon: '🔗' },
  { id: 'empty4', name: '', icon: '' },
  { id: 'veneer', name: 'Veneer', icon: '💎' },
  { id: 'zapfenzahn', name: 'Zapfenzahn (Z)', icon: 'Z' },
  { id: 'empty5', name: '', icon: '' },
];
