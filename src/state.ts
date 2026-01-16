import { readFile, writeFile } from 'fs/promises';
import type { ImportState } from './types.js';

const DEFAULT_STATE: ImportState = {
    importedDois: [],
    lastRun: '',
};

/**
 * Manages the state of imported papers to prevent duplicates.
 * 
 * Tracks imported papers via their DOIs stored in a JSON file. This enables
 * the import process to skip papers that have already been imported in previous runs.
 */
export class StateManager {
    private state: ImportState = { ...DEFAULT_STATE };
    private filePath: string;

    constructor(filePath: string) {
        this.filePath = filePath;
    }

    async load(): Promise<void> {
        try {
            const content = await readFile(this.filePath, 'utf-8');
            const loadedState = JSON.parse(content) as ImportState;
            this.state = {
                importedDois: loadedState.importedDois || [],
                lastRun: loadedState.lastRun || '',
            };
        } catch {
            this.state = { ...DEFAULT_STATE };
        }
    }

    async save(): Promise<void> {
        await writeFile(this.filePath, JSON.stringify(this.state, null, 2), 'utf-8');
    }

    isImported(doi: string): boolean {
        return this.state.importedDois.includes(doi);
    }

    markImported(doi: string): void {
        if (!this.state.importedDois.includes(doi)) {
            this.state.importedDois.push(doi);
        }
        this.state.lastRun = new Date().toISOString();
    }

    filterNewPapers<T extends { doi: string }>(papers: T[]): T[] {
        return papers.filter((paper) => !this.isImported(paper.doi));
    }

    get importedCount(): number {
        return this.state.importedDois.length;
    }
}
