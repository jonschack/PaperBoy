# PaperBoy 🗞️

PaperBoy is a "Fork & Forget" open-source tool that delivers curated, AI-summarized research digests at zero cost. It runs entirely on GitHub Actions, fetching RSS feeds, summarizing them with Google Gemini 1.5 Flash, and delivering them via Markdown (committed to the repo) or Email.

## Features

- **Zero Cost**: Runs on GitHub Actions free tier and Gemini free tier.
- **No Server**: No local setup required after configuration.
- **AI Summaries**: Uses Gemini 1.5 Flash to create cohesive narratives from multiple papers.
- **Flexible Delivery**: Get your digest as a Markdown file in your repo (great for Obsidian/Notes) or via Email.
- **Customizable Persona**: Configure how the AI assistant analyzes and presents information.
- **Modular Architecture**: Clean, maintainable code with separation of concerns.

## Quick Start

1.  **Fork this repository**.
2.  **Get a Google Gemini API Key**:
    *   Go to [Google AI Studio](https://makersuite.google.com/app/apikey).
    *   Create a free API key.
3.  **Add Secrets to GitHub**:
    *   Go to your forked repo > `Settings` > `Secrets and variables` > `Actions`.
    *   Click `New repository secret`.
    *   Name: `GEMINI_API_KEY`, Value: Your API key.
    *   (Optional for Email) Name: `EMAIL_PASSWORD`, Value: Your App Password (for Gmail, enable 2FA and create an App Password).
4.  **Configure**:
    *   Edit `config.yaml` to set your `user_name`, `interests`, and `sources`.
    *   Choose `delivery_mode`: `markdown` or `email` (or `both`).
    *   Optionally customize the `persona` field to control how content is analyzed.
5.  **Run**:
    *   Go to the `Actions` tab in your repo.
    *   Select `Daily Digest` on the left.
    *   Click `Run workflow` to test it immediately.
    *   It will automatically run daily at 8 AM UTC.

## Configuration (`config.yaml`)

```yaml
user_name: "Dr. Researcher"
interests:
  - "Artificial Intelligence"
  - "Machine Learning"
  - "Large Language Models"
delivery_mode: "markdown" # 'markdown', 'email', or 'both'
email_config:
    smtp_server: "smtp.gmail.com"
    smtp_port: 587
    sender_email: "your_email@gmail.com"
    recipient_email: "recipient@example.com"
sources:
  - name: "OpenAI Blog"
    url: "https://openai.com/blog/rss.xml"
  - name: "arXiv AI"
    url: "http://export.arxiv.org/rss/cs.AI"
persona: "Act as a Senior Principal Investigator preparing a succinct lab meeting brief. Focus on high-impact developments and novel architectures. Ignore generic tutorials."
```

## Architecture

PaperBoy uses a modular architecture with clear separation of concerns:

- **feed_fetcher.py**: Fetches and filters RSS feeds by date
- **summarizer.py**: Interfaces with Google Gemini for AI summarization
- **digest_generator.py**: Renders Markdown and HTML templates
- **email_sender.py**: Handles email delivery via SMTP
- **main.py**: Orchestrates the entire pipeline

## Local Development

1.  Clone the repo.
2.  Install dependencies: `pip install -r requirements.txt`
3.  Create a `.env` file with `GEMINI_API_KEY=your_key`.
4.  Run: `python src/main.py`

## Why PaperBoy?

Stay current with research without drowning in papers. PaperBoy intelligently filters, summarizes, and delivers only what matters to you, using AI to understand context and relevance.

Perfect for researchers, engineers, and anyone who wants to stay informed without spending hours reading feeds.