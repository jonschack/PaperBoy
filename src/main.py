import os
import sys
import yaml
import feedparser
import smtplib
import google.generativeai as genai
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Environment, FileSystemLoader
from typing import List, Dict, Any

class PaperBoy:
    def __init__(self, config_path: str = "config.yaml"):
        self.config = self._load_config(config_path)
        self.seen_urls = set()

        # Setup Gemini
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            print("Error: GEMINI_API_KEY environment variable not set.")
            sys.exit(1)

        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    def _load_config(self, path: str) -> Dict[str, Any]:
        try:
            with open(path, "r") as f:
                return yaml.safe_load(f)
        except Exception as e:
            print(f"Error loading config: {e}")
            sys.exit(1)

    def fetch_feeds(self) -> List[Dict[str, Any]]:
        print("Fetching feeds...")
        all_entries = []
        interests = [k.lower() for k in self.config.get("interests", [])]

        for source in self.config.get("sources", []):
            try:
                print(f"Fetching {source['name']}...")
                feed = feedparser.parse(source["url"])
                print(f"Parsed {source['name']}: {len(feed.entries)} entries found.")

                for entry in feed.entries:
                    link = entry.get("link", "")
                    if link in self.seen_urls:
                        continue

                    title = entry.get("title", "")
                    summary = entry.get("summary", "") or entry.get("description", "")

                    # Basic keyword filtering if interests are defined
                    content_to_check = (title + " " + summary).lower()
                    if interests and not any(interest in content_to_check for interest in interests):
                         continue

                    self.seen_urls.add(link)
                    all_entries.append({
                        "title": title,
                        "link": link,
                        "summary": summary,
                        "source": source["name"],
                        "published": entry.get("published", datetime.now().isoformat())
                    })
            except Exception as e:
                print(f"Error fetching {source['name']}: {e}")

        print(f"Total relevant entries found: {len(all_entries)}")
        return all_entries

    def analyze(self, entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        print("Analyzing entries with Gemini...")
        analyzed_entries = []

        persona = self.config.get("persona", "Act as a research assistant.")

        # Process entries (limit to top 10 to avoid hitting limits/tokens if many)
        target_entries = entries[:10]

        for item in target_entries:
            prompt = f"""
            {persona}

            Analyze the following article/paper abstract. Provide a brief "Key Insights" summary (2-3 sentences) focusing on why this matters.

            Title: {item['title']}
            Source: {item['source']}
            Content: {item['summary']}
            """

            try:
                response = self.model.generate_content(prompt)
                analysis = response.text.strip()
                item["analysis"] = analysis
                analyzed_entries.append(item)
            except Exception as e:
                print(f"Error analyzing item '{item['title']}': {e}")
                item["analysis"] = "Analysis failed."
                analyzed_entries.append(item)

        return analyzed_entries

    def generate_digest_summary(self, analyzed_entries: List[Dict[str, Any]]) -> str:
        print("Generating executive summary...")
        if not analyzed_entries:
            return "No entries to summarize."

        titles = "\n".join([f"- {e['title']}" for e in analyzed_entries])
        prompt = f"""
        {self.config.get('persona')}

        Based on the following list of papers/articles processed today, write a short Executive Summary (1 paragraph) highlighting the main themes.

        {titles}
        """
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Error generating executive summary: {e}")
            return "Could not generate summary."

    def deliver(self, entries: List[Dict[str, Any]], summary: str):
        mode = self.config.get("delivery_mode", "markdown")
        print(f"Delivering digest via {mode}...")

        env = Environment(loader=FileSystemLoader("templates"))

        # Prepare context
        context = {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "user_name": self.config.get("user_name", "User"),
            "interests": self.config.get("interests", []),
            "summary": summary,
            "items": entries
        }

        if mode == "markdown":
            try:
                template = env.get_template("digest.md")
                output = template.render(context)

                output_dir = "digests"
                os.makedirs(output_dir, exist_ok=True)
                filename = f"{output_dir}/digest_{datetime.now().strftime('%Y%m%d')}.md"

                with open(filename, "w") as f:
                    f.write(output)
                print(f"Digest saved to {filename}")
            except Exception as e:
                print(f"Error generating markdown: {e}")

        elif mode == "email":
            try:
                # Use HTML template for email
                try:
                    template = env.get_template("digest.html")
                    body = template.render(context)
                    mime_type = 'html'
                except Exception:
                    # Fallback to markdown if html template missing
                    print("digest.html not found, falling back to digest.md")
                    template = env.get_template("digest.md")
                    body = template.render(context)
                    mime_type = 'plain'

                msg = MIMEMultipart()
                email_user = os.environ.get("EMAIL_USER")
                email_to = os.environ.get("EMAIL_TO")

                if not email_user or not email_to:
                     print("Error: EMAIL_USER or EMAIL_TO not set for email delivery.")
                     return

                msg['From'] = email_user
                msg['To'] = email_to
                msg['Subject'] = f"Daily Research Digest - {datetime.now().strftime('%Y-%m-%d')}"

                msg.attach(MIMEText(body, mime_type))

                smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
                smtp_port = int(os.environ.get("SMTP_PORT", 587))
                email_password = os.environ.get("EMAIL_PASSWORD")

                if not email_password:
                     print("Error: EMAIL_PASSWORD not set.")
                     return

                server = smtplib.SMTP(smtp_server, smtp_port)
                server.starttls()
                server.login(email_user, email_password)
                text = msg.as_string()
                server.sendmail(email_user, email_to, text)
                server.quit()
                print("Email sent successfully.")
            except Exception as e:
                print(f"Error sending email: {e}")

    def run(self):
        entries = self.fetch_feeds()
        if not entries:
            print("No relevant entries found today.")
            return

        analyzed_entries = self.analyze(entries)
        summary = self.generate_digest_summary(analyzed_entries)
        self.deliver(analyzed_entries, summary)

if __name__ == "__main__":
    paperboy = PaperBoy()
    paperboy.run()
