# Elsevier-to-Notion Paper Importer

[![Sync Papers](https://github.com/jonschack/PaperBoy/actions/workflows/sync.yml/badge.svg)](https://github.com/YOUR_USERNAME/elsevier-to-notion/actions/workflows/sync.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

> 🔬 Automatically import your Elsevier/ScienceDirect papers into Notion with AI-generated summaries.

## ✨ Features

- **🔄 Automated Sync** - GitHub Action runs nightly to import new papers
- **🤖 AI Summaries** - Gemini 2.5 Flash Lite generates key findings, methodology, and implications
- **📄 Beautiful Pages** - Clean Notion pages with TL;DR callouts and organized sections
- **🔗 PDF Links** - Direct links to ScienceDirect PDFs
- **📊 State Tracking** - Never imports duplicates

## 🚀 Quick Start

### 1. Fork this repository

Click the **Fork** button at the top right.

### 2. Get your API keys

| Service | Where to Get |
|---------|--------------|
| Elsevier API | [dev.elsevier.com](https://dev.elsevier.com/) — register and create an API key |
| Notion | [notion.so/my-integrations](https://www.notion.so/my-integrations) — create an integration |
| Google AI | [aistudio.google.com](https://aistudio.google.com/) — get a free API key |

### 3. Set up Notion

1. Create a page in Notion where papers will be imported
2. Share the page with your integration (click ••• → Connections → Add your integration)
3. Copy the page ID from the URL: `notion.so/Your-Page-**abc123**`

### 4. Configure GitHub Secrets

Go to your fork → Settings → Secrets and variables → Actions → New repository secret:

| Secret Name | Description |
|-------------|-------------|
| `ELSEVIER_API_KEY` | Your Elsevier API key |
| `NOTION_TOKEN` | Notion integration token |
| `NOTION_PARENT_PAGE_ID` | ID of the Notion page |
| `GEMINI_API_KEY` | Google AI (Gemini) API key |
| `ELSEVIER_JOURNALS` | (Optional) Comma-separated list of journal names to search |

### 5. Run it!

Go to Actions → "Sync Elsevier Papers to Notion" → Run workflow

## 🎨 Notion Page Format

Each imported paper creates a page with:

- 💡 **TL;DR** - One-sentence summary in a callout
- 📖 **Paper Details** - Journal, authors, date, DOI link
- 📄 **PDF Link** - Direct link to ScienceDirect
- 🎯 **Key Findings** - Bullet points of main discoveries
- 🔬 **Methodology** - Research methods summary
- 💥 **Implications** - Real-world impact
- 📝 **Original Abstract** - Collapsible toggle

## 📁 Project Structure

```
├── src/
│   ├── index.ts        # Main orchestrator
│   ├── elsevier.ts     # Elsevier API client
│   ├── summarizer.ts   # Gemini summarization
│   ├── notion.ts       # Notion page creation
│   ├── state.ts        # Import tracking
│   └── types.ts        # TypeScript interfaces
├── tests/              # Vitest test suites
├── .github/workflows/  # GitHub Actions
└── import-state.json   # Tracks imported papers
```

## ⚙️ Configuration

| Environment Variable | Required | Default | Description |
|---------------------|----------|---------|-------------|
| `ELSEVIER_API_KEY` | ✅ | - | Elsevier API key |
| `ELSEVIER_JOURNALS` | ❌ | NeuroImage, Progress in Neurobiology, Biological Psychiatry: Cognitive Neuroscience and Neuroimaging | Comma-separated list of journal names to search |
| `NOTION_TOKEN` | ✅ | - | Notion integration token |
| `NOTION_PARENT_PAGE_ID` | ✅ | - | Target page for imports |
| `GEMINI_API_KEY` | ✅ | - | Google AI (Gemini) API key |
| `GEMINI_MODEL` | ❌ | `gemini-2.5-flash-lite` | Model for summaries |

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Submit a pull request

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  Made with ❤️ for researchers who love organization
</p>
