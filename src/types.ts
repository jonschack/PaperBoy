/**
 * Core type definitions for Elsevier-to-Notion importer
 */

/** Paper metadata from Elsevier API */
export interface Paper {
    doi: string;
    title: string;
    authors: string[];
    abstract: string;
    publicationDate: string;
    journal: string;
    pdfUrl?: string;
    fullText?: string;
}

/** AI-generated summary of a paper */
export interface PaperSummary {
    keyFindings: string[];
    methodology: string;
    implications: string;
    tldr: string;
}

/** Configuration for the importer */
export interface Config {
    elsevier: {
        apiKey: string;
        journals: string[];
    };
    notion: {
        token: string;
        parentPageId: string;
    };
    gemini: {
        apiKey: string;
        model: string;
    };
    dryRun: boolean;
    singleDoi?: string;
}

/** State tracking imported papers */
export interface ImportState {
    importedDois: string[];
    lastRun: string;
}
