import os
import google.generativeai as genai
from typing import List, Dict

class Summarizer:
    def __init__(self, api_key):
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not set.")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    def summarize(self, entries: List[Dict], user_name: str, interests: List[str]) -> str:
        if not entries:
            return "No new articles found today."

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
            # Remove HTML tags if necessary, but Gemini handles raw text well.
            # We truncate to avoid token limits just in case, though Flash has ~1M context.

            articles_text += f"\n\n--- Article {i} ---\n"
            articles_text += f"Title: {title}\n"
            articles_text += f"Source: {source}\n"
            articles_text += f"Link: {link}\n"
            articles_text += f"Content Snippet: {content[:2000]}...\n"

        prompt = f"""
        Act as a research assistant for {user_name}, who is interested in: {interests_str}.

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

if __name__ == "__main__":
    # Test stub
    # Needs GEMINI_API_KEY in env
    try:
        from dotenv import load_dotenv
        load_dotenv()

        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            summarizer = Summarizer(api_key)
            # Mock entries
            entries = [
                {'title': 'Advances in LLMs', 'source_name': 'AI Blog', 'link': 'http://example.com/1', 'summary': 'New transformer architectures...'},
                {'title': 'New bird species discovered', 'source_name': 'Nature', 'link': 'http://example.com/2', 'summary': 'In the Amazon rainforest...'}
            ]
            print(summarizer.summarize(entries, "Tester", ["LLMs", "AI"]))
        else:
            print("Skipping test, no API key.")
    except Exception as e:
        print(e)
