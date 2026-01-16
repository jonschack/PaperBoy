/**
 * Notion API client for creating paper pages
 */

import { Client } from '@notionhq/client';
import type { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints.js';
import type { Paper, PaperSummary } from './types.js';

/**
 * Normalize a Notion page ID to standard UUID format.
 * Handles various input formats:
 * - Notion URLs (e.g., https://www.notion.so/page-name-12345678123412341234123456789012)
 * - Compact UUIDs without dashes (e.g., 12345678123412341234123456789012)
 * - Standard UUIDs (e.g., 12345678-1234-1234-1234-123456789012)
 * - Quoted strings (e.g., "12345678-1234-1234-1234-123456789012")
 */
export function normalizeNotionPageId(input: string): string {
    // Remove surrounding quotes if present
    let cleaned = input.trim().replace(/^["']|["']$/g, '');

    // Extract from Notion URL if it's a URL
    // URLs look like: https://www.notion.so/workspace/Page-Title-12345678123412341234123456789012
    // or: https://notion.so/12345678123412341234123456789012
    const urlMatch = cleaned.match(/([a-f0-9]{32})(?:\?|$)/i) ||
                     cleaned.match(/-([a-f0-9]{32})(?:\?|$)/i);
    if (urlMatch) {
        cleaned = urlMatch[1];
    }

    // Remove any dashes to get a compact UUID
    const compact = cleaned.replace(/-/g, '');

    // Validate it looks like a UUID (32 hex characters)
    if (!/^[a-f0-9]{32}$/i.test(compact)) {
        throw new Error(
            `Invalid Notion page ID: "${input}". Expected a valid UUID or Notion URL. ` +
            `Please use a 32-character hex string (with or without dashes) or a Notion page URL.`
        );
    }

    // Format as standard UUID with dashes: 8-4-4-4-12
    return [
        compact.slice(0, 8),
        compact.slice(8, 12),
        compact.slice(12, 16),
        compact.slice(16, 20),
        compact.slice(20, 32),
    ].join('-');
}

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
        const normalizedParentId = normalizeNotionPageId(parentPageId);
        const response = await this.client.pages.create({
            parent: { page_id: normalizedParentId },
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
