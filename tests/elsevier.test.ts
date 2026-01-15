import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ElsevierClient, parseAuthorSearchResponse, parseFullTextResponse } from '../src/elsevier.js';

describe('ElsevierClient', () => {
    describe('parseAuthorSearchResponse', () => {
        it('should parse author search results into Paper array', () => {
            const mockResponse = {
                'search-results': {
                    entry: [
                        {
                            'prism:doi': '10.1016/j.example.2024.001',
                            'dc:title': 'A Novel Approach to Machine Learning',
                            'dc:creator': 'Smith, John',
                            'prism:coverDate': '2024-03-15',
                            'prism:publicationName': 'Journal of AI Research',
                            'prism:url': 'https://api.elsevier.com/content/article/doi/10.1016/j.example.2024.001',
                            'link': [
                                { '@ref': 'self', '@href': 'https://api.elsevier.com/...' },
                                { '@ref': 'scidir', '@href': 'https://www.sciencedirect.com/science/article/pii/...' }
                            ]
                        }
                    ]
                }
            };

            const papers = parseAuthorSearchResponse(mockResponse);

            expect(papers).toHaveLength(1);
            expect(papers[0]).toEqual({
                doi: '10.1016/j.example.2024.001',
                title: 'A Novel Approach to Machine Learning',
                authors: ['Smith, John'],
                publicationDate: '2024-03-15',
                journal: 'Journal of AI Research',
                abstract: '',
                pdfUrl: 'https://www.sciencedirect.com/science/article/pii/.../pdfft',
            });
        });

        it('should handle empty search results', () => {
            const mockResponse = {
                'search-results': {
                    entry: []
                }
            };

            const papers = parseAuthorSearchResponse(mockResponse);
            expect(papers).toHaveLength(0);
        });

        it('should handle missing optional fields gracefully', () => {
            const mockResponse = {
                'search-results': {
                    entry: [
                        {
                            'prism:doi': '10.1016/j.test.2024.002',
                            'dc:title': 'Test Paper',
                        }
                    ]
                }
            };

            const papers = parseAuthorSearchResponse(mockResponse);

            expect(papers).toHaveLength(1);
            expect(papers[0].authors).toEqual([]);
            expect(papers[0].journal).toBe('');
            expect(papers[0].publicationDate).toBe('');
        });
    });

    describe('parseFullTextResponse', () => {
        it('should extract full text from XML response', () => {
            const mockResponse = {
                'full-text-retrieval-response': {
                    'originalText': {
                        'xocs:doc': {
                            'xocs:serial-item': {
                                'ja:article': {
                                    'ja:body': {
                                        'ce:sections': {
                                            'ce:section': [
                                                {
                                                    'ce:section-title': 'Introduction',
                                                    'ce:para': 'This paper introduces a new methodology...'
                                                },
                                                {
                                                    'ce:section-title': 'Methods',
                                                    'ce:para': 'We employed machine learning techniques...'
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            };

            const fullText = parseFullTextResponse(mockResponse);

            expect(fullText).toContain('Introduction');
            expect(fullText).toContain('This paper introduces a new methodology');
            expect(fullText).toContain('Methods');
        });

        it('should handle missing full text gracefully', () => {
            const mockResponse = {};
            const fullText = parseFullTextResponse(mockResponse);
            expect(fullText).toBe('');
        });
    });

    describe('ElsevierClient.searchAuthorPapers', () => {
        let client: ElsevierClient;
        let mockFetch: ReturnType<typeof vi.fn>;

        beforeEach(() => {
            mockFetch = vi.fn();
            global.fetch = mockFetch;
            client = new ElsevierClient('test-api-key');
        });

        it('should call Scopus API with correct parameters', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    'search-results': { entry: [] }
                })
            });

            await client.searchAuthorPapers('12345678');

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('api.elsevier.com/content/search/scopus'),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'X-ELS-APIKey': 'test-api-key'
                    })
                })
            );
        });

        it('should throw on API error', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                statusText: 'Unauthorized'
            });

            await expect(client.searchAuthorPapers('12345678'))
                .rejects.toThrow('Elsevier API error: 401 Unauthorized');
        });
    });
});
