/**
 * Notion API client for creating paper pages
 */

import { Client } from '@notionhq/client';
import type { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints.js';
import type { Paper, PaperSummary } from './types.js';

/**
 * Build Notion block content for a paper page
 */
export function buildPaperPageContent(paper: Paper, summary: PaperSummary): BlockObjectRequest[] {
    const blocks: BlockObjectRequest[] = [];

    // TL;DR callout at the top
    blocks.push({
        type: 'callout',
        callout: {
            icon: { type: 'emoji', emoji: '💡' },
            color: 'blue_background',
            rich_text: [{ type: 'text', text: { content: summary.tldr } }],
        },
    });

    // Divider
    blocks.push({ type: 'divider', divider: {} });

    // Paper metadata
    blocks.push({
        type: 'heading_2',
        heading_2: {
            rich_text: [{ type: 'text', text: { content: 'Paper Details' } }],
        },
    });

    blocks.push({
        type: 'paragraph',
        paragraph: {
            rich_text: [
                { type: 'text', text: { content: '📖 ' } },
                { type: 'text', text: { content: 'Journal: ' }, annotations: { bold: true } },
                { type: 'text', text: { content: paper.journal || 'Unknown' } },
            ],
        },
    });

    blocks.push({
        type: 'paragraph',
        paragraph: {
            rich_text: [
                { type: 'text', text: { content: '👥 ' } },
                { type: 'text', text: { content: 'Authors: ' }, annotations: { bold: true } },
                { type: 'text', text: { content: paper.authors.join(', ') || 'Unknown' } },
            ],
        },
    });

    blocks.push({
        type: 'paragraph',
        paragraph: {
            rich_text: [
                { type: 'text', text: { content: '📅 ' } },
                { type: 'text', text: { content: 'Published: ' }, annotations: { bold: true } },
                { type: 'text', text: { content: paper.publicationDate || 'Unknown' } },
            ],
        },
    });

    blocks.push({
        type: 'paragraph',
        paragraph: {
            rich_text: [
                { type: 'text', text: { content: '🔗 ' } },
                { type: 'text', text: { content: 'DOI: ' }, annotations: { bold: true } },
                {
                    type: 'text',
                    text: {
                        content: paper.doi,
                        link: { url: `https://doi.org/${paper.doi}` }
                    }
                },
            ],
        },
    });

    // PDF link if available
    if (paper.pdfUrl) {
        blocks.push({
            type: 'paragraph',
            paragraph: {
                rich_text: [
                    { type: 'text', text: { content: '📄 ' } },
                    {
                        type: 'text',
                        text: {
                            content: 'View PDF on ScienceDirect',
                            link: { url: paper.pdfUrl }
                        },
                        annotations: { color: 'blue' }
                    },
                ],
            },
        });
    }

    // Divider
    blocks.push({ type: 'divider', divider: {} });

    // Key Findings
    if (summary.keyFindings.length > 0) {
        blocks.push({
            type: 'heading_2',
            heading_2: {
                rich_text: [{ type: 'text', text: { content: 'Key Findings' } }],
            },
        });

        for (const finding of summary.keyFindings) {
            blocks.push({
                type: 'bulleted_list_item',
                bulleted_list_item: {
                    rich_text: [{ type: 'text', text: { content: finding } }],
                },
            });
        }
    }

    // Methodology
    if (summary.methodology) {
        blocks.push({
            type: 'heading_2',
            heading_2: {
                rich_text: [{ type: 'text', text: { content: 'Methodology' } }],
            },
        });

        blocks.push({
            type: 'paragraph',
            paragraph: {
                rich_text: [{ type: 'text', text: { content: summary.methodology } }],
            },
        });
    }

    // Implications
    if (summary.implications) {
        blocks.push({
            type: 'heading_2',
            heading_2: {
                rich_text: [{ type: 'text', text: { content: 'Implications' } }],
            },
        });

        blocks.push({
            type: 'paragraph',
            paragraph: {
                rich_text: [{ type: 'text', text: { content: summary.implications } }],
            },
        });
    }

    // Original Abstract
    if (paper.abstract) {
        blocks.push({ type: 'divider', divider: {} });

        blocks.push({
            type: 'toggle',
            toggle: {
                rich_text: [{ type: 'text', text: { content: 'Original Abstract' } }],
                children: [
                    {
                        type: 'paragraph',
                        paragraph: {
                            rich_text: [{ type: 'text', text: { content: paper.abstract } }],
                        },
                    },
                ],
            },
        });
    }

    return blocks;
}

/**
 * Client for creating Notion pages
 */
export class NotionClient {
    private client: Client;

    constructor(token: string) {
        this.client = new Client({ auth: token });
    }

    /**
     * Create a new page for a paper under the specified parent
     */
    async createPaperPage(
        parentPageId: string,
        paper: Paper,
        summary: PaperSummary
    ): Promise<string> {
        const response = await this.client.pages.create({
            parent: { page_id: parentPageId },
            icon: { type: 'emoji', emoji: '📄' },
            properties: {
                title: {
                    type: 'title',
                    title: [{ type: 'text', text: { content: paper.title } }],
                },
            },
            children: buildPaperPageContent(paper, summary),
        });

        return response.id;
    }
}
