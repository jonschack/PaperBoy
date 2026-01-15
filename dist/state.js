/**
 * State management for tracking imported papers
 *
 * Stores DOIs of imported papers in a JSON file to prevent duplicates.
 */
import { readFile, writeFile } from 'fs/promises';
const DEFAULT_STATE = {
    importedDois: [],
    lastRun: '',
};
/**
 * Load import state from file
 */
export async function loadState(path) {
    try {
        const content = await readFile(path, 'utf-8');
        const state = JSON.parse(content);
        return {
            importedDois: state.importedDois || [],
            lastRun: state.lastRun || '',
        };
    }
    catch {
        return { ...DEFAULT_STATE };
    }
}
/**
 * Save import state to file
 */
export async function saveState(path, state) {
    await writeFile(path, JSON.stringify(state, null, 2), 'utf-8');
}
/**
 * Check if a paper has already been imported
 */
export function isImported(state, doi) {
    return state.importedDois.includes(doi);
}
/**
 * Mark a paper as imported
 */
export function markImported(state, doi) {
    return {
        ...state,
        importedDois: [...state.importedDois, doi],
        lastRun: new Date().toISOString(),
    };
}
/**
 * Filter out already imported papers
 */
export function filterNewPapers(papers, state) {
    return papers.filter((paper) => !isImported(state, paper.doi));
}
//# sourceMappingURL=state.js.map