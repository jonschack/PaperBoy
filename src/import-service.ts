import { ElsevierClient } from './elsevier.js';
import { Summarizer } from './summarizer.js';
import { NotionClient } from './notion.js';
import { Paper } from './types.js';

export interface ImportConfig {
    parentPageId: string;
    dryRun: boolean;
}

export class PaperImportService {
    constructor(
        private elsevier: ElsevierClient,
        private summarizer: Summarizer,
        private notion: NotionClient,
        private config: ImportConfig
    ) {}

    async processPaper(paper: Paper): Promise<void> {
        console.log(`\n📄 Processing: ${paper.title}`);
        console.log(`   DOI: ${paper.doi}`);

        // Fetch full text for better summary
        console.log('   ⏳ Fetching full text...');
        const fullText = await this.elsevier.getFullText(paper.doi);

        // If no full text, get abstract
        if (!fullText && !paper.abstract) {
            console.log('   ⏳ Fetching abstract...');
            paper.abstract = await this.elsevier.getAbstract(paper.doi);
        }

        // Generate AI summary
        console.log('   🤖 Generating AI summary...');
        const summary = await this.summarizer.summarize(paper, fullText);
        console.log(`   💡 TL;DR: ${summary.tldr}`);

        if (this.config.dryRun) {
            console.log('   🏃 DRY RUN - would create Notion page');
            console.log('   Summary:', JSON.stringify(summary, null, 2));
            return;
        }

        // Create Notion page
        console.log('   📝 Creating Notion page...');
        const pageId = await this.notion.createPaperPage(
            this.config.parentPageId,
            paper,
            summary
        );
        console.log(`   ✅ Created page: ${pageId}`);
    }
}
