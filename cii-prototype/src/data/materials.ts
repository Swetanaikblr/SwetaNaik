import type { Material } from '../types';

export const SEED_MATERIALS: Material[] = [
  { id: 'm1', title: 'Maths workbook: fractions (sample)', format: 'Textbook', importStatus: 'Imported', availableToChild: true, sampleContentId: 'fractions', isSample: true },
  { id: 'm2', title: 'Reading list: fables (sample)', format: 'Reading list', importStatus: 'Imported', availableToChild: true, sampleContentId: 'fables', isSample: true },
  { id: 'm3', title: 'Science notes: water cycle (sample)', format: 'Notes', importStatus: 'Imported', availableToChild: false, sampleContentId: 'waterCycle', isSample: true },
  { id: 'm4', title: 'Class handout (sample)', format: 'PDF', fileType: 'application/pdf', importStatus: 'Failed', availableToChild: false, isSample: true },
];

export const SUPPORTED_TYPES = ['application/pdf', 'text/plain', 'text/markdown', 'image/png', 'image/jpeg'];
