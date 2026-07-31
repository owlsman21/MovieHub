async function loadGenrePage() {
    const params = new URLSearchParams(window.location.search);
    const genreParam = params.get('type');
    const grid = document.getElementById('genre-grid');

    if (!grid) return;

    try {
        const response = await fetch('data/all-movies.json');
        if (!response.ok) throw new Error("Could not load data");
        const allMovies = await response.json();

        const filtered = allMovies.filter(movie => 
            movie.genre && movie.genre.toLowerCase() === genreParam.toLowerCase()
        );

        if (filtered.length > 0) {
            grid.innerHTML = filtered.map(movie => `
                <div class="movie-card">
                    <a href="movie.html?id=${movie.id}">
                        <img src="${movie.posterUrl || ''}" alt="${movie.title || 'Movie'}">
                        <h3>${movie.title || 'Unknown Title'}</h3>
                    </a>
                </div>
            `).join('');
        } else {
            grid.innerHTML = "<h1>No movies found in this genre</h1>";
        }
    } catch (e) {
        console.error("Genre Page Error:", e);
        grid.innerHTML = "<h1>Error loading movies. Check console.</h1>";
    }
}

document.addEventListener('DOMContentLoaded', loadGenrePage);