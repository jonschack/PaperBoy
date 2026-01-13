import feedparser
import time
from datetime import datetime, timedelta, timezone

class FeedFetcher:
    def __init__(self, sources):
        self.sources = sources

    def fetch_all(self, days=1):
        """
        Fetches entries from all sources from the last `days` days.
        """
        all_entries = []
        # Use UTC for consistency
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)

        for source in self.sources:
            print(f"Fetching {source['name']}...")
            try:
                feed = feedparser.parse(source['url'])

                if feed.bozo:
                    # feedparser sets bozo to 1 if there's an error,
                    # but it often still returns usable data.
                    # We log it but try to process entries.
                    print(f"Warning parsing {source['name']}: {feed.bozo_exception}")

                for entry in feed.entries:
                    published_time_struct = entry.get('published_parsed') or entry.get('updated_parsed')

                    if published_time_struct:
                        # struct_time is always UTC in feedparser if parsed correctly
                        published_dt = datetime.fromtimestamp(time.mktime(published_time_struct), tz=timezone.utc)

                        if published_dt >= cutoff_date:
                            entry['source_name'] = source['name']
                            entry['published_dt'] = published_dt  # Store for later use
                            all_entries.append(entry)
            except Exception as e:
                print(f"Failed to fetch {source['name']}: {e}")

        # Sort by date descending
        all_entries.sort(key=lambda x: x['published_dt'], reverse=True)
        return all_entries
