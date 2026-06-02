export interface Military {
  id: string;
  name: string; // Nome Completo
  rank: string; // Posto/Graduação (Sd, Cb, Sgt, Ten, Cap...)
  unit: string; // OBM (Lotação)
  birthDate: string; // ISO format YYYY-MM-DD
  bmNumber: string; // Númeo BM for email
}

export interface FilterState {
  search: string;
  units: string[]; // Changed to array for multi-select
  month: number; // 0-11
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  LIST = 'LIST',
  GENERATOR = 'GENERATOR',
}

export const RANKS = [
  'Sd BM', 'Cb BM', '3º Sgt BM', '2º Sgt BM', '1º Sgt BM', 'SubTen BM',
  '2º Ten BM', '1º Ten BM', 'Cap BM', 'Maj BM', 'Ten-Cel BM', 'Cel BM'
];

export const UNITS = [
  '1ª Cia Op', '2ª Cia Op', '3ª Cia Op', 'PEMAD', 'BEMAD', 'COB'
];