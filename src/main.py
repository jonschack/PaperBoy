import os
import yaml
import sys
from datetime import datetime
from feed_fetcher import FeedFetcher
from summarizer import Summarizer
from digest_generator import DigestGenerator
from email_sender import EmailSender

def load_config(config_path='config.yaml'):
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

def main():
    # Load Config
    try:
        config = load_config()
    except FileNotFoundError:
        print("config.yaml not found.")
        sys.exit(1)

    # 1. Fetch Feeds
    print("Fetching feeds...")
    fetcher = FeedFetcher(config['sources'])
    # Fetch from last 24 hours (1 day)
    entries = fetcher.fetch_all(days=1)

    if not entries:
        print("No new entries found in the last 24 hours.")
        # Exit to save API calls when nothing new
        sys.exit(0)

    print(f"Found {len(entries)} new entries.")

    # 2. Summarize
    print("Summarizing with Gemini...")
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY not found in environment variables.")
        sys.exit(1)

    summarizer = Summarizer(api_key)
    # Pass persona if configured
    persona = config.get('persona')
    summary_text = summarizer.summarize(entries, config['user_name'], config['interests'], persona)

    # 3. Generate Digest
    print("Generating digest...")
    generator = DigestGenerator()
    date_str = datetime.now().strftime("%Y-%m-%d")

    # 4. Delivery
    delivery_mode = config.get('delivery_mode', 'markdown')

    if delivery_mode == 'markdown' or delivery_mode == 'both':
        markdown_content = generator.generate_markdown(summary_text, date_str)
        # Create digests directory
        os.makedirs('digests', exist_ok=True)
        filename = f"digests/digest_{date_str}.md"
        with open(filename, 'w') as f:
            f.write(markdown_content)
        print(f"Digest saved to {filename}")

    if delivery_mode == 'email' or delivery_mode == 'both':
        email_config = config.get('email_config')
        if not email_config:
            print("Email configuration missing.")
        else:
            email_password = os.environ.get("EMAIL_PASSWORD")
            if not email_password:
                print("EMAIL_PASSWORD not found in environment variables.")
            else:
                html_content = generator.generate_email_html(summary_text, date_str)
                sender = EmailSender(
                    email_config['smtp_server'],
                    email_config['smtp_port'],
                    email_config['sender_email'],
                    email_password
                )
                sender.send_email(
                    email_config['recipient_email'],
                    f"PaperBoy Digest - {date_str}",
                    html_content
                )

if __name__ == "__main__":
    main()
