import os
import json
import re
from datetime import datetime

JSON_DIR = './data'
ALL_MOVIES_FILE = 'all-movies.json'
SITEMAP_FILE = 'vault-map.xml'
BASE_URL = 'https://moviehub.uk/movie-details.html'

def sanitize_filename(name):
    name = str(name)
    return re.sub(r'[:\\/*?"<>|]', '-', name)

def load_and_consolidate_movies():
    movies_map = {}
    
    # Load existing all-movies.json if present
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

    # Load from ./data directory if present
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
    
    # Save back consolidated list to all-movies.json
    with open(ALL_MOVIES_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_movies, f, indent=4, ensure_ascii=False)
    
    print(f"Consolidated {len(all_movies)} movies into {ALL_MOVIES_FILE}")
    return all_movies

def main():
    movies = load_and_consolidate_movies()
    
    # Automatically Build vault-map.xml with correct query parameter URLs
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
    for movie in movies:
        movie_id = movie.get('id')
        if not movie_id:
            continue
        safe_id = sanitize_filename(movie_id)
        if safe_id not in seen_ids:
            seen_ids.add(safe_id)
            xml_lines.append('  <url>')
            xml_lines.append(f'    <loc>{BASE_URL}?id={safe_id}</loc>')
            xml_lines.append(f'    <lastmod>{today}</lastmod>')
            xml_lines.append('    <changefreq>monthly</changefreq>')
            xml_lines.append('    <priority>0.8</priority>')
            xml_lines.append('  </url>')

    xml_lines.append('</urlset>')

    with open(SITEMAP_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(xml_lines))

    print(f"Successfully generated {SITEMAP_FILE} with {len(seen_ids)} movie URLs!")

if __name__ == '__main__':
    main()