import os
import json
import re
import html
from datetime import datetime

JSON_DIR = './data'
ALL_MOVIES_FILE = 'all-movies.json'
SITEMAP_FILE = 'vault-map.xml'
SHARE_DIR = 'share'
BASE_URL = 'https://moviehub.uk/'
DEFAULT_POSTER = 'https://moviehub.uk/images/moviehub.png'
DEFAULT_DESC = 'Stream restored classic cinema, golden era westerns, film noir, and rare movies completely free on MovieHub.'


def sanitize_filename(name):
    name = str(name)
    return re.sub(r'[:\\/*?"<>|]', '-', name)


def resolve_poster_url(poster_url):
    if not poster_url:
        return DEFAULT_POSTER
    p = str(poster_url).strip()
    if p.startswith('http://') or p.startswith('https://'):
        return p
    # Strip leading slashes so local paths like "images/foo.jpg" work cleanly
    clean_rel = p.lstrip('/')
    return f"{BASE_URL}{clean_rel}"


def build_share_page(movie, safe_id):
    raw_title = movie.get('title') or 'Classic Movie'
    clean_title = re.sub(r'\s*\(\d{4}\)\s*$', '', raw_title.split('|')[0]).strip()
    year = movie.get('year')
    display_title = f"{clean_title} ({year})" if year else clean_title

    raw_desc = (movie.get('description') or DEFAULT_DESC).strip()
    short_desc = (raw_desc[:155].strip() + '...') if len(raw_desc) > 155 else raw_desc

    share_url = f"{BASE_URL}{SHARE_DIR}/{safe_id}.html"
    target_url = f"{BASE_URL}movie-details.html?id={safe_id}"
    poster_full_url = resolve_poster_url(movie.get('posterUrl'))

    esc_title = html.escape(display_title, quote=True)
    esc_desc = html.escape(short_desc, quote=True)
    esc_share = html.escape(share_url, quote=True)
    esc_target = html.escape(target_url, quote=True)
    esc_poster = html.escape(poster_full_url, quote=True)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{esc_title} | MovieHub</title>
    <meta name="description" content="{esc_desc}">
    <link rel="canonical" href="{esc_target}">

    <meta property="og:type" content="video.movie">
    <meta property="og:site_name" content="MovieHub">
    <meta property="og:title" content="{esc_title}">
    <meta property="og:description" content="{esc_desc}">
    <meta property="og:url" content="{esc_share}">
    <meta property="og:image" content="{esc_poster}">
    <meta property="og:image:secure_url" content="{esc_poster}">
    <meta property="og:image:width" content="600">
    <meta property="og:image:height" content="900">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{esc_title}">
    <meta name="twitter:description" content="{esc_desc}">
    <meta name="twitter:image" content="{esc_poster}">

    <script>window.location.replace({json.dumps(target_url)});</script>
</head>
<body style="background:#0a0a0a;color:#fff;font-family:sans-serif;text-align:center;padding:50px 20px;">
    <a href="{esc_target}" style="text-decoration:none;color:#fff;display:inline-block;">
        <img src="https://moviehub.uk/images/moviehub.png" alt="MovieHub" style="width:160px;max-width:80%;border-radius:12px;margin-bottom:16px;">
        <h2 style="margin:0 0 8px;color:#ffdd00;">{esc_title}</h2>
        <p style="margin:0;color:#ccc;font-size:15px;">Tap the logo or title to watch free on MovieHub</p>
    </a>
</body>
</html>
"""


def load_and_consolidate_movies():
    movies_map = {}

    if os.path.exists(ALL_MOVIES_FILE):
        try:
            with open(ALL_MOVIES_FILE, 'r', encoding='utf-8') as f:
                existing = json.load(f)
                if isinstance(existing, list):
                    for m in existing:
                        if m and m.get('id'):
                            movies_map[m.get('id')] = m
        except Exception as e:
            print(f"Error reading {ALL_MOVIES_FILE}: {e}")

    if os.path.exists(JSON_DIR):
        for filename in os.listdir(JSON_DIR):
            if filename.endswith('.json'):
                path = os.path.join(JSON_DIR, filename)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        if isinstance(data, list):
                            for m in data:
                                if m and m.get('id'):
                                    movies_map[m.get('id')] = m
                        elif isinstance(data, dict) and data.get('id'):
                            movies_map[data.get('id')] = data
                except Exception as e:
                    print(f"Error reading {path}: {e}")

    all_movies = list(movies_map.values())

    with open(ALL_MOVIES_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_movies, f, indent=4, ensure_ascii=False)

    print(f"Consolidated {len(all_movies)} movies into {ALL_MOVIES_FILE}")
    return all_movies


def main():
    movies = load_and_consolidate_movies()
    movies = sorted(movies, key=lambda m: m.get('id', ''))

    os.makedirs(SHARE_DIR, exist_ok=True)

    today = datetime.now().strftime('%Y-%m-%d')
    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        '  <url>',
        '    <loc>https://moviehub.uk/</loc>',
        f'    <lastmod>{today}</lastmod>',
        '    <changefreq>daily</changefreq>',
        '    <priority>1.0</priority>',
        '  </url>',
        '  <url>',
        '    <loc>https://moviehub.uk/catalog.html</loc>',
        f'    <lastmod>{today}</lastmod>',
        '    <changefreq>daily</changefreq>',
        '    <priority>0.9</priority>',
        '  </url>'
    ]

    seen_ids = set()
    share_count = 0

    for movie in movies:
        movie_id = movie.get('id')
        if not movie_id:
            continue
        safe_id = sanitize_filename(movie_id)
        if safe_id not in seen_ids:
            seen_ids.add(safe_id)

            share_path = os.path.join(SHARE_DIR, f"{safe_id}.html")
            with open(share_path, 'w', encoding='utf-8') as sf:
                sf.write(build_share_page(movie, safe_id))
            share_count += 1

            xml_lines.append('  <url>')
            xml_lines.append(f'    <loc>{BASE_URL}movie-details.html?id={safe_id}</loc>')
            xml_lines.append(f'    <lastmod>{today}</lastmod>')
            xml_lines.append('  </url>')

    xml_lines.append('</urlset>')

    with open(SITEMAP_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(xml_lines))

    print(f"Successfully generated optimized {SITEMAP_FILE} with {len(seen_ids)} sorted movie URLs!")
    print(f"Generated {share_count} static share pages in ./{SHARE_DIR}/")


if __name__ == '__main__':
    main()