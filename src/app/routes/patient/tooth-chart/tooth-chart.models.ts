export interface SurfaceFlags {
  foreignWork: boolean;
  replaceExisting: boolean;
  xrayOnly: boolean;
}

export interface SurfaceState {
  caries: string | null;
  treatmentNeed: string;
  fillingMaterial: string;
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
  translationKey?: string;
}

export type ToothDataMap = {
  [toothNumber: number]: ToothData;
};

export const CARIES_COLORS: { [key: string]: string } = {
  undetermined: '#9e9e9e',
  1: '#90caf9',
  2: '#42a5f5',
  3: '#ef5350',
  4: '#d32f2f',
  5: '#590303',
};

export const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
export const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export const FINDINGS: Finding[] = [
  { id: 'without_finding', name: 'Without Finding', icon: '✓' },
  { id: 'gap_closure', name: 'Gap Closure', icon: ')(' },
  { id: 'missing', name: 'Missing', icon: '✗' },
  { id: 'eights_missing', name: '8s Missing', icon: '8' },
  { id: 'erupting', name: 'Erupting', icon: '↑' },
  { id: 'destroyed', name: 'Destroyed', icon: '💥' },
  { id: 'root_remnant', name: 'Root Remnant', icon: '🦷' },
  { id: 'deciduous_tooth', name: 'Deciduous Tooth', icon: '🍼' },
  { id: 'double_formation', name: 'Double Formation', icon: '👥' },
  { id: 'sealing', name: 'Sealing', icon: '🔒' },
  { id: 'vitality_test', name: 'Vitality Test', icon: '+?' },
  { id: 'percussion_test', name: 'Percussion Test', icon: 'P+?' },
  { id: 'wedge_shaped_defect', name: 'Wedge-shaped Defect', icon: '📐' },
  { id: 'loosening', name: 'Loosening Grade I-III', icon: 'I,II,III' },
  { id: 'empty1', name: '', icon: '' },
  { id: 'replaced', name: 'Replaced', icon: '🔄' },
  { id: 'focus', name: 'Focus', icon: '🔴' },
  { id: 'ur', name: 'UR', icon: 'UR' },
  { id: 'complete_upper', name: 'Complete Upper', icon: '⬜' },
  { id: 'hemisection', name: 'Hemisection', icon: '½' },
  { id: 'sr', name: 'SR', icon: 'SR' },
  { id: 'complete_lower', name: 'Complete Lower', icon: '⬜' },
  { id: 'abrasion', name: 'Abrasion', icon: '///' },
  { id: 'erosion', name: 'Erosion', icon: '~~~' },
  { id: 'implant', name: 'Implant', icon: '🔩' },
  { id: 'brackets', name: 'Brackets', icon: '⚙️' },
  { id: 'retainer', name: 'Retainer', icon: '↔️' },
  { id: 'crown', name: 'Crown', icon: '👑' },
  { id: 'recession', name: 'Recession', icon: '📉' },
  { id: 'tooth_migration', name: 'Tooth Migration', icon: '→' },
  { id: 'partial_crown', name: 'Partial Crown', icon: '½👑' },
  { id: 'rotation', name: 'Rotation', icon: '🔄' },
  { id: 'tilting', name: 'Tilting', icon: '📐' },
  { id: 'bridge_element', name: 'Bridge Element', icon: '🌉' },
  { id: 'root_number', name: 'Root Number', icon: '🦷' },
  { id: 'empty2', name: '', icon: '' },
  { id: 'telescope', name: 'Telescope', icon: '🔭' },
  { id: 'wsr', name: 'WSR', icon: 'WSR' },
  { id: 'empty3', name: '', icon: '' },
  { id: 'post_buildup', name: 'Post Buildup', icon: '📌' },
  { id: 'splinting', name: 'Splinting', icon: '🔗' },
  { id: 'empty4', name: '', icon: '' },
  { id: 'veneer', name: 'Veneer', icon: '💎' },
  { id: 'conical_tooth', name: 'Conical Tooth (C)', icon: 'Z' },
  { id: 'empty5', name: '', icon: '' },
];
