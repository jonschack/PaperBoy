import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotionClient, buildPaperPageContent, normalizeNotionPageId } from '../src/notion.js';
import type { Paper, PaperSummary } from '../src/types.js';

describe('normalizeNotionPageId', () => {
    const validUuid = '12345678-1234-1234-1234-123456789012';
    const compactUuid = '12345678123412341234123456789012';

    it('should return UUID unchanged if already in correct format', () => {
        expect(normalizeNotionPageId(validUuid)).toBe(validUuid);
    });

    it('should convert compact UUID to standard format', () => {
        expect(normalizeNotionPageId(compactUuid)).toBe(validUuid);
    });

    it('should handle UUID with surrounding quotes', () => {
        expect(normalizeNotionPageId(`"${validUuid}"`)).toBe(validUuid);
        expect(normalizeNotionPageId(`'${validUuid}'`)).toBe(validUuid);
    });

    it('should handle UUID with surrounding whitespace', () => {
        expect(normalizeNotionPageId(`  ${validUuid}  `)).toBe(validUuid);
    });

    it('should extract UUID from Notion URL with page title', () => {
        const url = `https://www.notion.so/workspace/My-Page-Title-${compactUuid}`;
        expect(normalizeNotionPageId(url)).toBe(validUuid);
    });

    it('should extract UUID from Notion URL without page title', () => {
        const url = `https://notion.so/${compactUuid}`;
        expect(normalizeNotionPageId(url)).toBe(validUuid);
    });

    it('should extract UUID from Notion URL with query parameters', () => {
        const url = `https://www.notion.so/Page-${compactUuid}?v=abc123`;
        expect(normalizeNotionPageId(url)).toBe(validUuid);
    });

    it('should handle lowercase hex characters', () => {
        const lowercase = 'abcdef78abcdabcdabcdabcdef789012';
        expect(normalizeNotionPageId(lowercase)).toBe('abcdef78-abcd-abcd-abcd-abcdef789012');
    });

    it('should handle uppercase hex characters', () => {
        const uppercase = 'ABCDEF78ABCDABCDABCDABCDEF789012';
        expect(normalizeNotionPageId(uppercase)).toBe('ABCDEF78-ABCD-ABCD-ABCD-ABCDEF789012');
    });

    it('should throw error for invalid input', () => {
        expect(() => normalizeNotionPageId('not-a-uuid')).toThrow('Invalid Notion page ID');
        expect(() => normalizeNotionPageId('')).toThrow('Invalid Notion page ID');
        expect(() => normalizeNotionPageId('123')).toThrow('Invalid Notion page ID');
    });

    it('should throw error for UUID with wrong length', () => {
        expect(() => normalizeNotionPageId('12345678-1234-1234-1234')).toThrow('Invalid Notion page ID');
    });
});

describe('NotionClient', () => {
    const mockPaper: Paper = {
        doi: '10.1016/j.example.2024.001',
        title: 'Revolutionary Machine Learning Approach',
        authors: ['Smith, John', 'Doe, Jane'],
        abstract: 'This paper presents a novel approach...',
        publicationDate: '2024-03-15',
        journal: 'Nature AI',
        pdfUrl: 'https://sciencedirect.com/article/pii/xxx/pdfft',
    };

    const mockSummary: PaperSummary = {
        keyFindings: [
            'First major finding about the research',
            'Second important discovery',
            'Third key insight',
        ],
        methodology: 'The researchers employed deep learning techniques with transformer architectures.',
        implications: 'This work opens new possibilities for healthcare AI applications.',
        tldr: 'A breakthrough ML approach that improves diagnostic accuracy by 40%.',
    };

    describe('buildPaperPageContent', () => {
        it('should build Notion blocks with paper metadata', () => {
            const blocks = buildPaperPageContent(mockPaper, mockSummary);

            // Should have callout with TL;DR
            const tldrBlock = blocks.find(
                (b: any) => b.type === 'callout' && b.callout?.rich_text?.[0]?.text?.content?.includes('breakthrough')
            );
            expect(tldrBlock).toBeDefined();

            // Should have heading for Key Findings
            const keyFindingsHeading = blocks.find(
                (b: any) => b.type === 'heading_2' && b.heading_2?.rich_text?.[0]?.text?.content === 'Key Findings'
            );
            expect(keyFindingsHeading).toBeDefined();

            // Should have bullet points for findings
            const bulletBlocks = blocks.filter((b: any) => b.type === 'bulleted_list_item');
            expect(bulletBlocks.length).toBe(3);
        });

        it('should include PDF link when available', () => {
            const blocks = buildPaperPageContent(mockPaper, mockSummary);

            const pdfBlock = blocks.find(
                (b: any) => b.type === 'paragraph' &&
                    JSON.stringify(b).includes('sciencedirect.com')
            );
            expect(pdfBlock).toBeDefined();
        });

        it('should handle missing summary gracefully', () => {
            const emptySummary: PaperSummary = {
                keyFindings: [],
                methodology: '',
                implications: '',
                tldr: 'No summary available',
            };

            const blocks = buildPaperPageContent(mockPaper, emptySummary);
            expect(blocks.length).toBeGreaterThan(0);
        });
    });

    describe('NotionClient.createPaperPage', () => {
        let client: NotionClient;
        let mockCreate: ReturnType<typeof vi.fn>;
        const testParentPageId = '12345678-1234-1234-1234-123456789012';

        beforeEach(() => {
            mockCreate = vi.fn().mockResolvedValue({ id: 'page-123' });
            client = new NotionClient('test-token');
            // @ts-expect-error - mocking private client
            client.client = {
                pages: { create: mockCreate },
            };
        });

        it('should create page under parent with correct properties', async () => {
            await client.createPaperPage(testParentPageId, mockPaper, mockSummary);

            expect(mockCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    parent: { page_id: testParentPageId },
                    properties: expect.objectContaining({
                        title: expect.any(Object),
                    }),
                    children: expect.any(Array),
                })
            );
        });

        it('should return created page ID', async () => {
            const pageId = await client.createPaperPage(testParentPageId, mockPaper, mockSummary);
            expect(pageId).toBe('page-123');
        });

        it('should normalize compact UUID to standard format', async () => {
            const compactId = '12345678123412341234123456789012';
            await client.createPaperPage(compactId, mockPaper, mockSummary);

            expect(mockCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    parent: { page_id: testParentPageId },
                })
            );
        });
    });
});
