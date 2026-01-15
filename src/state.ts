/**
 * State management for tracking imported papers
 * 
 * Stores DOIs of imported papers in a JSON file to prevent duplicates.
 */

import { readFile, writeFile } from 'fs/promises';
import type { ImportState } from './types.js';

const DEFAULT_STATE: ImportState = {
    importedDois: [],
    lastRun: '',
};

/**
 * Load import state from file
 */
export async function loadState(path: string): Promise<ImportState> {
    try {
        const content = await readFile(path, 'utf-8');
        const state = JSON.parse(content) as ImportState;
        return {
            importedDois: state.importedDois || [],
            lastRun: state.lastRun || '',
        };
    } catch {
        return { ...DEFAULT_STATE };
    }
}

/**
 * Save import state to file
 */
export async function saveState(path: string, state: ImportState): Promise<void> {
    await writeFile(path, JSON.stringify(state, null, 2), 'utf-8');
}

/**
 * Check if a paper has already been imported
 */
export function isImported(state: ImportState, doi: string): boolean {
    return state.importedDois.includes(doi);
}

/**
 * Mark a paper as imported
 */
export function markImported(state: ImportState, doi: string): ImportState {
    return {
        ...state,
        importedDois: [...state.importedDois, doi],
        lastRun: new Date().toISOString(),
    };
}

/**
 * Filter out already imported papers
 */
export function filterNewPapers<T extends { doi: string }>(
    papers: T[],
    state: ImportState
): T[] {
    return papers.filter((paper) => !isImported(state, paper.doi));
}
