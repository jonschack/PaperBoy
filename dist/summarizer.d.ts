/**
 * AI-powered paper summarization using OpenAI
 */
import type { Paper, PaperSummary } from './types.js';
/**
 * Build the user prompt with paper details
 */
export declare function buildSummaryPrompt(paper: Paper, fullText: string): string;
/**
 * Parse LLM response into structured summary
 */
export declare function parseSummaryResponse(response: string): PaperSummary;
/**
 * AI summarizer using OpenAI
 */
export declare class Summarizer {
    private client;
    private model;
    constructor(apiKey: string, model?: string);
    /**
     * Generate a summary for a paper
     */
    summarize(paper: Paper, fullText?: string): Promise<PaperSummary>;
}
//# sourceMappingURL=summarizer.d.ts.map