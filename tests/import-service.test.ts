import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaperImportService } from '../src/import-service.js';
import type { Paper, PaperSummary } from '../src/types.js';

describe('PaperImportService', () => {
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

    let mockElsevier: any;
    let mockSummarizer: any;
    let mockNotion: any;
    let service: PaperImportService;

    beforeEach(() => {
        mockElsevier = {
            getFullText: vi.fn(),
            getAbstract: vi.fn(),
        };

        mockSummarizer = {
            summarize: vi.fn().mockResolvedValue(mockSummary),
        };

        mockNotion = {
            createPaperPage: vi.fn().mockResolvedValue('page-123'),
        };
    });

    describe('processPaper with full text available', () => {
        beforeEach(() => {
            service = new PaperImportService(
                mockElsevier,
                mockSummarizer,
                mockNotion,
                { parentPageId: 'parent-page-id', dryRun: false }
            );
        });

        it('should fetch full text and create Notion page', async () => {
            mockElsevier.getFullText.mockResolvedValue('Full text of the paper...');

            await service.processPaper(mockPaper);

            expect(mockElsevier.getFullText).toHaveBeenCalledWith(mockPaper.doi);
            expect(mockElsevier.getAbstract).not.toHaveBeenCalled();
            expect(mockSummarizer.summarize).toHaveBeenCalledWith(
                expect.objectContaining({ doi: mockPaper.doi }),
                'Full text of the paper...'
            );
            expect(mockNotion.createPaperPage).toHaveBeenCalledWith(
                'parent-page-id',
                expect.objectContaining({ doi: mockPaper.doi }),
                mockSummary
            );
        });

        it('should not mutate the original paper object', async () => {
            const originalAbstract = mockPaper.abstract;
            mockElsevier.getFullText.mockResolvedValue('Full text of the paper...');

            await service.processPaper(mockPaper);

            expect(mockPaper.abstract).toBe(originalAbstract);
        });
    });

    describe('processPaper without full text', () => {
        beforeEach(() => {
            service = new PaperImportService(
                mockElsevier,
                mockSummarizer,
                mockNotion,
                { parentPageId: 'parent-page-id', dryRun: false }
            );
        });

        it('should fetch abstract when no full text and no abstract', async () => {
            const paperNoAbstract = { ...mockPaper, abstract: '' };
            mockElsevier.getFullText.mockResolvedValue(null);
            mockElsevier.getAbstract.mockResolvedValue('Fetched abstract from API');

            await service.processPaper(paperNoAbstract);

            expect(mockElsevier.getFullText).toHaveBeenCalledWith(paperNoAbstract.doi);
            expect(mockElsevier.getAbstract).toHaveBeenCalledWith(paperNoAbstract.doi);
            expect(mockSummarizer.summarize).toHaveBeenCalledWith(
                expect.objectContaining({ abstract: 'Fetched abstract from API' }),
                null
            );
        });

        it('should use existing abstract when no full text', async () => {
            mockElsevier.getFullText.mockResolvedValue(null);

            await service.processPaper(mockPaper);

            expect(mockElsevier.getFullText).toHaveBeenCalledWith(mockPaper.doi);
            expect(mockElsevier.getAbstract).not.toHaveBeenCalled();
            expect(mockSummarizer.summarize).toHaveBeenCalledWith(
                expect.objectContaining({ abstract: mockPaper.abstract }),
                null
            );
        });
    });

    describe('processPaper in dry run mode', () => {
        beforeEach(() => {
            service = new PaperImportService(
                mockElsevier,
                mockSummarizer,
                mockNotion,
                { parentPageId: 'parent-page-id', dryRun: true }
            );
        });

        it('should not create Notion page in dry run mode', async () => {
            mockElsevier.getFullText.mockResolvedValue('Full text of the paper...');

            await service.processPaper(mockPaper);

            expect(mockElsevier.getFullText).toHaveBeenCalled();
            expect(mockSummarizer.summarize).toHaveBeenCalled();
            expect(mockNotion.createPaperPage).not.toHaveBeenCalled();
        });

        it('should still generate summary in dry run mode', async () => {
            mockElsevier.getFullText.mockResolvedValue('Full text of the paper...');

            await service.processPaper(mockPaper);

            expect(mockSummarizer.summarize).toHaveBeenCalledWith(
                expect.objectContaining({ doi: mockPaper.doi }),
                'Full text of the paper...'
            );
        });
    });
});
