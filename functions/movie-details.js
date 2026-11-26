function escapeAttr(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const movieId = url.searchParams.get("id");

  const response = await context.env.ASSETS.fetch(context.request);

  if (!movieId) {
    return response;
  }

  try {
    const jsonUrl = new URL("/all-movies.json", url.origin);
    const jsonResponse = await context.env.ASSETS.fetch(jsonUrl);
    if (!jsonResponse.ok) {
      return response;
    }

    const data = await jsonResponse.json();
    const movies = Array.isArray(data) ? data : data.movies || [];
    const movie = movies.find((m) => String(m.id) === String(movieId));

    if (!movie) {
      return response;
    }

    const title = escapeAttr(movie.title || "MovieHub | Classic Cinema");
    const description = escapeAttr(
      movie.description || "Watch classic movies and rare cinema online at MovieHub."
    );
    const pageUrl = escapeAttr(`${url.origin}/movie-details.html?id=${encodeURIComponent(movie.id)}`);

    let rawPoster = (movie.posterUrl || "images/og-default.jpg").replace(/^\/+/, "");
    const imageUrl = rawPoster.startsWith("http")
      ? escapeAttr(rawPoster)
      : escapeAttr(`${url.origin}/${rawPoster}`);

    const metaTags = `
      <meta property="og:type" content="video.movie" />
      <meta property="og:site_name" content="MovieHub" />
      <meta property="og:url" content="${pageUrl}" />
      <meta property="og:title" content="${title}" />
      <meta property="og:description" content="${description}" />
      <meta property="og:image" content="${imageUrl}" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${title}" />
      <meta name="twitter:description" content="${description}" />
      <meta name="twitter:image" content="${imageUrl}" />
    `;

    return new HTMLRewriter()
      .on('meta[property^="og:"], meta[name^="twitter:"]', {
        element(el) {
          el.remove();
        },
      })
      .on("title", {
        element(el) {
          el.setInnerContent(movie.title || "MovieHub");
        },
      })
      .on("head", {
        element(el) {
          el.append(metaTags, { html: true });
        },
      })
      .transform(response);
  } catch (err) {
    return response;
  }
}