import google.generativeai as genai
from typing import List, Dict

class Summarizer:
    def __init__(self, api_key):
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not set.")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    def summarize(self, entries: List[Dict], user_name: str, interests: List[str], persona: str = None) -> str:
        if not entries:
            return "No new articles found today."

        # Use persona if provided, otherwise default
        if not persona:
            persona = "Act as a research assistant"

        # Prepare the context
        interests_str = ", ".join(interests)

        # Limit the number of entries if too many to avoid context window issues
        entries_to_process = entries[:20]

        articles_text = ""
        for i, entry in enumerate(entries_to_process, 1):
            title = entry.get('title', 'No Title')
            source = entry.get('source_name', 'Unknown Source')
            link = entry.get('link', '#')
            # Use summary or content, truncate if too long
            content = entry.get('summary') or entry.get('description') or "No content available."

            articles_text += f"\n\n--- Article {i} ---\n"
            articles_text += f"Title: {title}\n"
            articles_text += f"Source: {source}\n"
            articles_text += f"Link: {link}\n"
            articles_text += f"Content Snippet: {content[:2000]}...\n"

        prompt = f"""
        {persona}
        
        You are preparing a digest for {user_name}, who is interested in: {interests_str}.

        Here are the latest academic/tech articles from their subscribed feeds.
        Please verify which ones are relevant to their interests.

        For the relevant articles, provide a cohesive narrative summary.
        Group them by topic if possible.

        For each relevant article mentioned, make sure to include the link.

        Format the output in Markdown.
        Start with a friendly greeting to {user_name}.

        Articles:
        {articles_text}
        """

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Error generating summary: {e}")
            return "Failed to generate summary due to an error."
