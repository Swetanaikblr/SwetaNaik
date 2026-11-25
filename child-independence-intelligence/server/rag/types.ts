import type { LearningMaterial } from '../../src/types';

export type IngestStatus = 'indexed' | 'not_searchable' | 'failed';

/** A learning material as stored on the server, with its indexing status. */
export interface StoredMaterial extends LearningMaterial {
  ingest: {
    status: IngestStatus;
    chunkCount: number;
    indexedAt: string;
    note?: string;
  };
}

/** One retrievable passage of a material. */
export interface Chunk {
  id: string; // `${materialId}#${index}`
  materialId: string;
  subjectId: string;
  materialTitle: string;
  chapter: string;
  section: string; // nearest heading above the passage, '' if none
  index: number;
  text: string;
}

export interface RetrievedChunk extends Chunk {
  score: number;
}
