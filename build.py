def build_share_page(movie, safe_id):
    raw_title = movie.get('title') or 'Classic Movie'
    clean_title = raw_title.split('|')[0].strip()
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
<body style="background:#0a0a0a;color:#fff;font-family:sans-serif;text-align:center;padding:40px;">
    <p>Redirecting to <a href="{esc_target}" style="color:#ffdd00;">{esc_title}</a>...</p>
</body>
</html>
"""