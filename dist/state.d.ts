/**
 * State management for tracking imported papers
 *
 * Stores DOIs of imported papers in a JSON file to prevent duplicates.
 */
import type { ImportState } from './types.js';
/**
 * Load import state from file
 */
export declare function loadState(path: string): Promise<ImportState>;
/**
 * Save import state to file
 */
export declare function saveState(path: string, state: ImportState): Promise<void>;
/**
 * Check if a paper has already been imported
 */
export declare function isImported(state: ImportState, doi: string): boolean;
/**
 * Mark a paper as imported
 */
export declare function markImported(state: ImportState, doi: string): ImportState;
/**
 * Filter out already imported papers
 */
export declare function filterNewPapers<T extends {
    doi: string;
}>(papers: T[], state: ImportState): T[];
//# sourceMappingURL=state.d.ts.map