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
        if not date_str:
            date_str = datetime.now().strftime("%Y-%m-%d")

        template = self.env.get_template('digest.html')

        # Convert markdown to HTML for better display
        try:
            import markdown
            html_content = markdown.markdown(summary_text)
        except ImportError:
            # Fallback if markdown library not available
            html_content = f"<pre>{summary_text}</pre>"

        return template.render(
            date=date_str,
            content=html_content
        )
