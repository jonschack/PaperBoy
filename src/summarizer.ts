/**
 * AI-powered paper summarization using OpenAI
 */

import OpenAI from 'openai';
import type { Paper, PaperSummary } from './types.js';

const SYSTEM_PROMPT = `You are a scientific paper summarizer. Given a paper's metadata and content, 
generate a structured summary in JSON format with these fields:

- keyFindings: array of 3-5 bullet points highlighting the main discoveries
- methodology: brief description of the research methods used (1-2 sentences)  
- implications: what this means for the field or real-world applications (1-2 sentences)
- tldr: one-sentence summary for busy readers

Respond ONLY with valid JSON, no additional text.`;

/**
 * Build the user prompt with paper details
 */
export function buildSummaryPrompt(paper: Paper, fullText: string): string {
    const content = fullText || paper.abstract || 'No content available';

    return `Please summarize this scientific paper:

**Title:** ${paper.title}
**Authors:** ${paper.authors.join(', ') || 'Unknown'}
**Journal:** ${paper.journal || 'Unknown'}
**Date:** ${paper.publicationDate || 'Unknown'}

**Abstract:**
${paper.abstract || 'No abstract available'}

**Full Text (excerpt):**
${content.slice(0, 8000)}${content.length > 8000 ? '...[truncated]' : ''}`;
}

/**
 * Parse LLM response into structured summary
 */
export function parseSummaryResponse(response: string): PaperSummary {
    const fallback: PaperSummary = {
        keyFindings: [],
        methodology: '',
        implications: '',
        tldr: 'Summary generation failed',
    };

    try {
        // Extract JSON from markdown code block if present
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : response;

        const parsed = JSON.parse(jsonStr.trim());

        return {
            keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
            methodology: String(parsed.methodology || ''),
            implications: String(parsed.implications || ''),
            tldr: String(parsed.tldr || 'No summary available'),
        };
    } catch {
        return fallback;
    }
}

/**
 * AI summarizer using OpenAI
 */
export class Summarizer {
    private client: OpenAI;
    private model: string;

    constructor(apiKey: string, model: string = 'gpt-4o-mini') {
        this.client = new OpenAI({ apiKey });
        this.model = model;
    }

    /**
     * Generate a summary for a paper
     */
    async summarize(paper: Paper, fullText: string = ''): Promise<PaperSummary> {
        const userPrompt = buildSummaryPrompt(paper, fullText);

        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.3, // Lower for more consistent output
                max_tokens: 1000,
            });

            const content = response.choices[0]?.message?.content || '';
            return parseSummaryResponse(content);
        } catch (error) {
            console.error('Summarization failed:', error);
            return {
                keyFindings: [],
                methodology: '',
                implications: '',
                tldr: `Error generating summary: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
}
