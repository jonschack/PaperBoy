/**
 * Elsevier API client for fetching scientific papers
 * 
 * Uses the Scopus Search API for finding papers by author
 * and the ScienceDirect Full-Text API for retrieving content.
 */

import type { Paper } from './types.js';

const SCOPUS_SEARCH_URL = 'https://api.elsevier.com/content/search/scopus';
const SCIDIR_ARTICLE_URL = 'https://api.elsevier.com/content/article/doi';

interface ElsevierSearchEntry {
    'prism:doi'?: string;
    'dc:title'?: string;
    'dc:creator'?: string;
    'prism:coverDate'?: string;
    'prism:publicationName'?: string;
    'dc:description'?: string;
    'link'?: Array<{ '@ref': string; '@href': string }>;
}

interface ElsevierSearchResponse {
    'search-results': {
        entry: ElsevierSearchEntry[];
    };
}

interface FullTextSection {
    'ce:section-title'?: string;
    'ce:para'?: string | string[];
}

interface ElsevierFullTextResponse {
    'full-text-retrieval-response'?: {
        originalText?: {
            'xocs:doc'?: {
                'xocs:serial-item'?: {
                    'ja:article'?: {
                        'ja:body'?: {
                            'ce:sections'?: {
                                'ce:section'?: FullTextSection[];
                            };
                        };
                    };
                };
            };
        };
        coredata?: {
            'dc:description'?: string;
        };
    };
}

/**
 * Parse Elsevier Scopus search response into Paper objects
 */
export function parseAuthorSearchResponse(response: ElsevierSearchResponse): Paper[] {
    const entries = response['search-results']?.entry || [];

    return entries
        .filter((entry) => entry['prism:doi']) // Only papers with DOIs
        .map((entry): Paper => {
            // Find ScienceDirect link for PDF
            const scidirLink = entry.link?.find(l => l['@ref'] === 'scidir');
            const pdfUrl = scidirLink ? `${scidirLink['@href']}/pdfft` : undefined;

            return {
                doi: entry['prism:doi']!,
                title: entry['dc:title'] || 'Untitled',
                authors: entry['dc:creator'] ? [entry['dc:creator']] : [],
                publicationDate: entry['prism:coverDate'] || '',
                journal: entry['prism:publicationName'] || '',
                abstract: entry['dc:description'] || '',
                pdfUrl,
            };
        });
}

/**
 * Extract readable text from Elsevier full-text XML response
 */
export function parseFullTextResponse(response: ElsevierFullTextResponse): string {
    try {
        const sections = response['full-text-retrieval-response']
            ?.originalText
            ?.['xocs:doc']
            ?.['xocs:serial-item']
            ?.['ja:article']
            ?.['ja:body']
            ?.['ce:sections']
            ?.['ce:section'];

        if (!sections || !Array.isArray(sections)) {
            // Try to get abstract as fallback
            const abstract = response['full-text-retrieval-response']
                ?.coredata
                ?.['dc:description'];
            return abstract || '';
        }

        return sections.map((section) => {
            const title = section['ce:section-title'] || '';
            const para = section['ce:para'];
            const paraText = Array.isArray(para) ? para.join('\n\n') : (para || '');
            return `## ${title}\n\n${paraText}`;
        }).join('\n\n');
    } catch {
        return '';
    }
}

/**
 * Client for interacting with Elsevier APIs
 */
export class ElsevierClient {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    private async request<T>(url: string): Promise<T> {
        const response = await fetch(url, {
            headers: {
                'X-ELS-APIKey': this.apiKey,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Elsevier API error: ${response.status} ${response.statusText}`);
        }

        return response.json() as Promise<T>;
    }

    /**
     * Search for papers by author ID
     */
    async searchAuthorPapers(authorId: string, startDate?: string): Promise<Paper[]> {
        let query = `AU-ID(${authorId})`;
        if (startDate) {
            query += ` AND PUBYEAR > ${startDate.slice(0, 4)}`;
        }

        const url = `${SCOPUS_SEARCH_URL}?query=${encodeURIComponent(query)}&sort=coverDate`;
        const response = await this.request<ElsevierSearchResponse>(url);

        return parseAuthorSearchResponse(response);
    }

    /**
     * Get full text content for a paper by DOI
     */
    async getFullText(doi: string): Promise<string> {
        const url = `${SCIDIR_ARTICLE_URL}/${encodeURIComponent(doi)}`;

        try {
            const response = await this.request<ElsevierFullTextResponse>(url);
            return parseFullTextResponse(response);
        } catch (error) {
            console.warn(`Could not fetch full text for ${doi}:`, error);
            return '';
        }
    }

    /**
     * Get paper metadata with abstract
     */
    async getAbstract(doi: string): Promise<string> {
        const url = `${SCIDIR_ARTICLE_URL}/${encodeURIComponent(doi)}?view=META_ABS`;

        try {
            const response = await this.request<ElsevierFullTextResponse>(url);
            return response['full-text-retrieval-response']?.coredata?.['dc:description'] || '';
        } catch {
            return '';
        }
    }
}
