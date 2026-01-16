/**
 * Elsevier-to-Notion Paper Importer
 * 
 * Main entry point - orchestrates the import pipeline:
 * 1. Fetch papers from Elsevier by author ID
 * 2. Filter out already-imported papers
 * 3. Generate AI summaries for new papers
 * 4. Create Notion pages with content
 * 5. Update state to track imports
 */

import { ElsevierClient } from './elsevier.js';
import { Summarizer } from './summarizer.js';
import { NotionClient } from './notion.js';
import { StateManager } from './state.js';
import { PaperImportService } from './import-service.js';
import type { Config, Paper } from './types.js';

const STATE_FILE = './import-state.json';

function loadConfig(): Config {
    const required = (name: string): string => {
        const value = process.env[name];
        if (!value) {
            throw new Error(`Missing required environment variable: ${name}`);
        }
        return value;
    };

    return {
        elsevier: {
            apiKey: required('ELSEVIER_API_KEY'),
            authorId: required('ELSEVIER_AUTHOR_ID'),
        },
        notion: {
            token: required('NOTION_TOKEN'),
            parentPageId: required('NOTION_PARENT_PAGE_ID'),
        },
        gemini: {
            apiKey: required('GEMINI_API_KEY'),
            model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
        },
        dryRun: process.argv.includes('--dry-run'),
        singleDoi: process.argv.find((arg) => arg.startsWith('--doi='))?.split('=')[1],
    };
}

async function main(): Promise<void> {
    console.log('🚀 Elsevier-to-Notion Paper Importer');
    console.log('====================================\n');

    // Load configuration
    const config = loadConfig();
    console.log(`📋 Author ID: ${config.elsevier.authorId}`);
    console.log(`📋 Dry run: ${config.dryRun}`);
    if (config.singleDoi) {
        console.log(`📋 Single DOI mode: ${config.singleDoi}`);
    }

    // Initialize clients
    const elsevier = new ElsevierClient(config.elsevier.apiKey);
    const summarizer = new Summarizer(config.gemini.apiKey, config.gemini.model);
    const notion = new NotionClient(config.notion.token);
    const stateManager = new StateManager(STATE_FILE);
    const importService = new PaperImportService(elsevier, summarizer, notion, {
        parentPageId: config.notion.parentPageId,
        dryRun: config.dryRun
    });

    // Load state
    await stateManager.load();
    console.log(`📊 Previously imported: ${stateManager.importedCount} papers`);

    // Fetch papers
    let papers: Paper[];
    if (config.singleDoi) {
        // Single DOI mode for testing
        console.log('\n🔍 Fetching single paper...');
        const fullText = await elsevier.getFullText(config.singleDoi);
        papers = [{
            doi: config.singleDoi,
            title: 'Paper',
            authors: [],
            abstract: '',
            publicationDate: '',
            journal: '',
            fullText,
        }];
    } else {
        // Normal mode - search by author
        console.log('\n🔍 Searching for papers...');
        papers = await elsevier.searchAuthorPapers(config.elsevier.authorId);
        console.log(`   Found ${papers.length} papers`);
    }

    // Filter new papers
    const newPapers = stateManager.filterNewPapers(papers);
    console.log(`   New papers to import: ${newPapers.length}`);

    if (newPapers.length === 0) {
        console.log('\n✨ No new papers to import. All done!');
        return;
    }

    // Process each paper
    for (const paper of newPapers) {
        try {
            await importService.processPaper(paper);

            // Update state
            stateManager.markImported(paper.doi);
            if (!config.dryRun) {
                await stateManager.save();
            }
        } catch (error) {
            console.error(`   ❌ Failed to import ${paper.doi}:`, error);
            // Continue with next paper
        }
    }

    console.log('\n====================================');
    console.log('✅ Import complete!');
    console.log(`   Processed: ${newPapers.length} papers`);
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
