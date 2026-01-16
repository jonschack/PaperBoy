import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Summarizer, buildSummaryPrompt, parseSummaryResponse } from '../src/summarizer.js';
import type { Paper, PaperSummary } from '../src/types.js';

describe('Summarizer', () => {
    describe('buildSummaryPrompt', () => {
        it('should build a prompt with paper details', () => {
            const paper: Paper = {
                doi: '10.1016/test',
                title: 'Machine Learning in Healthcare',
                authors: ['Smith, John', 'Doe, Jane'],
                abstract: 'This paper explores ML applications in healthcare.',
                publicationDate: '2024-01-15',
                journal: 'Nature Medicine',
            };
            const fullText = 'Introduction: Machine learning has revolutionized...';

            const prompt = buildSummaryPrompt(paper, fullText);

            expect(prompt).toContain('Machine Learning in Healthcare');
            expect(prompt).toContain('Smith, John');
            expect(prompt).toContain('This paper explores ML applications');
            expect(prompt).toContain('Machine learning has revolutionized');
        });

        it('should handle missing full text gracefully', () => {
            const paper: Paper = {
                doi: '10.1016/test',
                title: 'Test Paper',
                authors: [],
                abstract: 'Abstract text',
                publicationDate: '',
                journal: '',
            };

            const prompt = buildSummaryPrompt(paper, '');

            expect(prompt).toContain('Test Paper');
            expect(prompt).toContain('Abstract text');
        });
    });

    describe('parseSummaryResponse', () => {
        it('should parse JSON summary from LLM response', () => {
            const llmResponse = `Here's the summary:

\`\`\`json
{
  "keyFindings": ["Finding 1", "Finding 2"],
  "methodology": "The researchers used...",
  "implications": "This has major implications...",
  "tldr": "A brief one-liner summary."
}
\`\`\``;

            const summary = parseSummaryResponse(llmResponse);

            expect(summary.keyFindings).toEqual(['Finding 1', 'Finding 2']);
            expect(summary.methodology).toBe('The researchers used...');
            expect(summary.implications).toBe('This has major implications...');
            expect(summary.tldr).toBe('A brief one-liner summary.');
        });

        it('should handle raw JSON without markdown', () => {
            const llmResponse = `{
  "keyFindings": ["Finding 1"],
  "methodology": "Method",
  "implications": "Impact",
  "tldr": "Summary"
}`;

            const summary = parseSummaryResponse(llmResponse);
            expect(summary.keyFindings).toEqual(['Finding 1']);
        });

        it('should return fallback on parse error', () => {
            const llmResponse = 'Invalid response with no JSON';

            const summary = parseSummaryResponse(llmResponse);

            expect(summary.tldr).toBe('Summary generation failed');
            expect(summary.keyFindings).toEqual([]);
        });
    });

    describe('Summarizer.summarize', () => {
        let summarizer: Summarizer;
        let mockGenerateContent: ReturnType<typeof vi.fn>;

        beforeEach(() => {
            mockGenerateContent = vi.fn();
            summarizer = new Summarizer('test-key', 'gemini-1.5-flash');
            // @ts-expect-error - mocking private genAI
            summarizer.genAI = {
                getGenerativeModel: () => ({
                    generateContent: mockGenerateContent,
                }),
            };
        });

        it('should call Gemini API with correct parameters', async () => {
            mockGenerateContent.mockResolvedValueOnce({
                response: {
                    text: () => JSON.stringify({
                        keyFindings: ['Finding'],
                        methodology: 'Method',
                        implications: 'Impact',
                        tldr: 'Summary',
                    }),
                },
            });

            const paper: Paper = {
                doi: '10.1016/test',
                title: 'Test Paper',
                authors: [],
                abstract: 'Abstract',
                publicationDate: '',
                journal: '',
            };

            const summary = await summarizer.summarize(paper, 'Full text content');

            expect(mockGenerateContent).toHaveBeenCalledWith(
                expect.objectContaining({
                    contents: expect.arrayContaining([
                        expect.objectContaining({ role: 'user' }),
                    ]),
                })
            );
            expect(summary.tldr).toBe('Summary');
        });
    });
});
