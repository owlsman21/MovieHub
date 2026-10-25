import os
import json
import re
import random
from datetime import datetime

JSON_DIR = './data'
ALL_MOVIES_FILE = 'all-movies.json'
OUTPUT_DIR = './movies'
TEMPLATE_FILE = 'template.html'
SITEMAP_FILE = 'vault-map.xml'
BASE_URL = 'https://moviehub.uk/movies'

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

with open(TEMPLATE_FILE, 'r', encoding='utf-8') as f:
    template = f.read()

all_movies_cache = []
movie_urls = []

def clean_value(val):
    if isinstance(val, list):
        return ", ".join(str(v) for v in val)
    return str(val) if val is not None else ""

def sanitize_filename(name):
    name = str(name)
    return re.sub(r'[:\\/*?"<>|]', '-', name)

def get_clean_poster_url(poster_raw):
    """Ensures poster URL is clean and formatted for the /movies/ subfolder context."""
    poster = clean_value(poster_raw).strip()
    if not poster:
        return 'images/moviehub.png'
    
    # If it's an absolute URL, leave it alone
    if poster.startswith('http://') or poster.startswith('https://'):
        return poster
    
    # Strip leading slashes and relative path indicators
    poster = poster.replace('../', '').replace('./', '').lstrip('/')
    
    # If it doesn't start with images/, add it
    if not poster.startswith('images/'):
        poster = f"images/{poster}"
        
    return f"../{poster}".replace(' ', '%20')

# Load all movies
def load_all_movies():
    movies = []
    if os.path.exists(ALL_MOVIES_FILE):
        with open(ALL_MOVIES_FILE, 'r', encoding='utf-8') as f:
            movies.extend(json.load(f))
    if os.path.exists(JSON_DIR):
        for filename in os.listdir(JSON_DIR):
            if filename.endswith('.json'):
                with open(os.path.join(JSON_DIR, filename), 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        movies.extend(data)
                    else:
                        movies.append(data)
    return movies

all_movies_cache = load_all_movies()

def process_movie(movie, all_movies):
    movie_id = movie.get('id')
    if not movie_id:
        return

    safe_id = sanitize_filename(movie_id)
    if safe_id not in movie_urls:
        movie_urls.append(safe_id)

    # Build metadata string dynamically
    meta_parts = []
    director = clean_value(movie.get('director'))
    if director:
        meta_parts.append(f"Director: {director}")
        
    genres = movie.get('genres', '')
    if isinstance(genres, list):
        genres_str = ", ".join(genres)
    else:
        genres_str = str(genres)
    if genres_str:
        meta_parts.append(f"Genres: {genres_str}")
        
    quality = clean_value(movie.get('quality'))
    if quality:
        meta_parts.append(f"Quality: {quality}")

    meta_info_str = " | ".join(meta_parts)

    # Clean main poster URL (already includes '../' from helper)
    poster_url = get_clean_poster_url(movie.get('posterUrl'))
    # For meta tags / schema, remove the '../' so it's an absolute site URL
    og_poster_url = poster_url.replace('../', '')

    # Determine Embed URL based on source (ok.ru vs rumble)
    source = clean_value(movie.get('source')).lower()
    embed_id = clean_value(movie.get('embedId'))
    
    if source == 'ok.ru':
        embed_url = f"https://ok.ru/videoembed/{embed_id}"
    else:
        embed_url = f"https://rumble.com/embed/{embed_id}/"

    # Generate "You Might Also Like" recommendations (pick 6 random other movies)
    other_movies = [m for m in all_movies if m.get('id') != movie_id]
    recommended = random.sample(other_movies, min(6, len(other_movies)))
    
    rec_html_parts = []
    for r in recommended:
        r_id = sanitize_filename(r.get('id'))
        r_title = clean_value(r.get('title'))
        r_poster = get_clean_poster_url(r.get('posterUrl'))
        
        rec_html_parts.append(f'''
            <a href="{r_id}.html" class="mini-card">
                <img src="{r_poster}" alt="{r_title}" loading="lazy" onerror="this.src='../images/moviehub.png'">
                <div class="mini-card-title">{r_title}</div>
            </a>
        ''')
    
    recommended_html = "".join(rec_html_parts)

    # Replace placeholders in template
    html_content = template
    html_content = html_content.replace('{{ID}}', clean_value(movie.get('id')))
    html_content = html_content.replace('{{TITLE}}', clean_value(movie.get('title')))
    html_content = html_content.replace('{{YEAR}}', clean_value(movie.get('year')))
    html_content = html_content.replace('{{META_INFO}}', meta_info_str)
    html_content = html_content.replace('{{DESCRIPTION}}', clean_value(movie.get('description')))
    html_content = html_content.replace('{{EMBED_URL}}', embed_url)
    html_content = html_content.replace('{{POSTER_URL}}', poster_url)
    html_content = html_content.replace('{{OG_POSTER_URL}}', og_poster_url)
    html_content = html_content.replace('{{RECOMMENDED_MOVIES}}', recommended_html)

    output_path = os.path.join(OUTPUT_DIR, f"{safe_id}.html")
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    print(f"Generated Page: {output_path}")

# Run process for all movies
for m in all_movies_cache:
    process_movie(m, all_movies_cache)

# Automatically Build vault-map.xml
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

for s_id in movie_urls:
    xml_lines.append('  <url>')
    xml_lines.append(f'    <loc>{BASE_URL}/{s_id}.html</loc>')
    xml_lines.append(f'    <lastmod>{today}</lastmod>')
    xml_lines.append('    <changefreq>monthly</changefreq>')
    xml_lines.append('    <priority>0.8</priority>')
    xml_lines.append('  </url>')

xml_lines.append('</urlset>')

with open(SITEMAP_FILE, 'w', encoding='utf-8') as f:
    f.write('\n'.join(xml_lines))

print(f"\n✅ Successfully updated all pages and {SITEMAP_FILE}!")