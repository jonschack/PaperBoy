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
import { loadState, saveState, filterNewPapers, markImported } from './state.js';
import type { Config, ImportState, Paper } from './types.js';

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

async function importPaper(
    paper: Paper,
    elsevier: ElsevierClient,
    summarizer: Summarizer,
    notion: NotionClient,
    config: Config
): Promise<void> {
    console.log(`\n📄 Processing: ${paper.title}`);
    console.log(`   DOI: ${paper.doi}`);

    // Fetch full text for better summary
    console.log('   ⏳ Fetching full text...');
    const fullText = await elsevier.getFullText(paper.doi);

    // If no full text, get abstract
    if (!fullText && !paper.abstract) {
        console.log('   ⏳ Fetching abstract...');
        paper.abstract = await elsevier.getAbstract(paper.doi);
    }

    // Generate AI summary
    console.log('   🤖 Generating AI summary...');
    const summary = await summarizer.summarize(paper, fullText);
    console.log(`   💡 TL;DR: ${summary.tldr}`);

    if (config.dryRun) {
        console.log('   🏃 DRY RUN - would create Notion page');
        console.log('   Summary:', JSON.stringify(summary, null, 2));
        return;
    }

    // Create Notion page
    console.log('   📝 Creating Notion page...');
    const pageId = await notion.createPaperPage(
        config.notion.parentPageId,
        paper,
        summary
    );
    console.log(`   ✅ Created page: ${pageId}`);
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

    // Load state
    let state = await loadState(STATE_FILE);
    console.log(`📊 Previously imported: ${state.importedDois.length} papers`);

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
    const newPapers = filterNewPapers(papers, state);
    console.log(`   New papers to import: ${newPapers.length}`);

    if (newPapers.length === 0) {
        console.log('\n✨ No new papers to import. All done!');
        return;
    }

    // Process each paper
    for (const paper of newPapers) {
        try {
            await importPaper(paper, elsevier, summarizer, notion, config);

            // Update state
            state = markImported(state, paper.doi);
            if (!config.dryRun) {
                await saveState(STATE_FILE, state);
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
