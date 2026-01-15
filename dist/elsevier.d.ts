/**
 * Elsevier API client for fetching scientific papers
 *
 * Uses the Scopus Search API for finding papers by author
 * and the ScienceDirect Full-Text API for retrieving content.
 */
import type { Paper } from './types.js';
interface ElsevierSearchEntry {
    'prism:doi'?: string;
    'dc:title'?: string;
    'dc:creator'?: string;
    'prism:coverDate'?: string;
    'prism:publicationName'?: string;
    'dc:description'?: string;
    'link'?: Array<{
        '@ref': string;
        '@href': string;
    }>;
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
export declare function parseAuthorSearchResponse(response: ElsevierSearchResponse): Paper[];
/**
 * Extract readable text from Elsevier full-text XML response
 */
export declare function parseFullTextResponse(response: ElsevierFullTextResponse): string;
/**
 * Client for interacting with Elsevier APIs
 */
export declare class ElsevierClient {
    private apiKey;
    constructor(apiKey: string);
    private request;
    /**
     * Search for papers by author ID
     */
    searchAuthorPapers(authorId: string, startDate?: string): Promise<Paper[]>;
    /**
     * Get full text content for a paper by DOI
     */
    getFullText(doi: string): Promise<string>;
    /**
     * Get paper metadata with abstract
     */
    getAbstract(doi: string): Promise<string>;
}
export {};
//# sourceMappingURL=elsevier.d.ts.map