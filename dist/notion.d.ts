/**
 * Notion API client for creating paper pages
 */
import type { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints.js';
import type { Paper, PaperSummary } from './types.js';
/**
 * Build Notion block content for a paper page
 */
export declare function buildPaperPageContent(paper: Paper, summary: PaperSummary): BlockObjectRequest[];
/**
 * Client for creating Notion pages
 */
export declare class NotionClient {
    private client;
    constructor(token: string);
    /**
     * Create a new page for a paper under the specified parent
     */
    createPaperPage(parentPageId: string, paper: Paper, summary: PaperSummary): Promise<string>;
}
//# sourceMappingURL=notion.d.ts.map