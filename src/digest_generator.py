from jinja2 import Environment, FileSystemLoader
import os
from datetime import datetime

class DigestGenerator:
    def __init__(self, template_dir='templates'):
        self.env = Environment(loader=FileSystemLoader(template_dir))

    def generate_markdown(self, summary_text, date_str=None):
        if not date_str:
            date_str = datetime.now().strftime("%Y-%m-%d")

        template = self.env.get_template('digest.md')
        return template.render(
            date=date_str,
            summary=summary_text
        )

    def generate_email_html(self, summary_text, date_str=None):
        # For now, we can convert markdown to HTML or just use a simple HTML template
        # The prompt says: "HTML styled like a modern tech newsletter"
        # We might need a markdown-to-html converter or just rely on the LLM to output HTML if we change prompt.
        # But the requirements say "Summarize batch abstracts into a cohesive narrative" -> Markdown digest.
        # Then "Option A Email": "HTML styled...".
        # It's probably better to convert the Markdown summary to HTML or wrap it.
        # A simple approach for MVP: Use a basic HTML template and inject the content.
        # Since the summary from Gemini is Markdown, we might want to render it.
        # But for simplicity, let's assume we pass the raw text or simple HTML.

        if not date_str:
            date_str = datetime.now().strftime("%Y-%m-%d")

        template = self.env.get_template('digest.html')

        # We need to convert markdown newlines to <br> or <p> for basic display if we don't use a library.
        # Or better, we can use a library like `markdown` if available, or just put it in a <pre> block (ugly).
        # Let's check if we can install `markdown` library.
        try:
            import markdown
            html_content = markdown.markdown(summary_text)
        except ImportError:
            html_content = f"<pre>{summary_text}</pre>"

        return template.render(
            date=date_str,
            content=html_content
        )

if __name__ == "__main__":
    generator = DigestGenerator()
    # creating dummy templates for testing
    if not os.path.exists('templates'):
        os.makedirs('templates')

    with open('templates/digest.md', 'w') as f:
        f.write("# Daily Digest - {{ date }}\n\n{{ summary }}")

    print(generator.generate_markdown("This is a summary."))
