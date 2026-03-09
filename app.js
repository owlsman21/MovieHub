// 1. ENGINE: Loads movies from your data file
async function loadMovies(containerId, filterGenre = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const response = await fetch('data/all-movies.json');
        if (!response.ok) throw new Error("all-movies.json not found");
        const movies = await response.json();

        let filteredMovies = movies;

        if (filterGenre && filterGenre !== 'All') {
            filteredMovies = movies.filter(m => {
                const genreStr = m.genres ? String(m.genres).toLowerCase() : "";
                return genreStr.includes(filterGenre.toLowerCase());
            });
        }

        renderGrid(container, filteredMovies);
    } catch (e) {
        console.error("Vault Error:", e);
    }
}

// 2. GENRE SWITCHER: Updates UI without reloading the page
function showGenre(genre) {
    document.getElementById('page-title').innerText = `${genre} Vault`;
    loadMovies('movie-grid-container', genre);
}

// 3. SEARCH: Scans the JSON without refreshing
async function searchVault() {
    const query = document.getElementById('movieSearch').value.toLowerCase();
    const container = document.getElementById('movie-grid-container');
    const pageTitle = document.getElementById('page-title');

    if (query === "") {
        showGenre('All');
        return;
    }

    try {
        const response = await fetch('data/all-movies.json');
        const movies = await response.json();

        const results = movies.filter(m => 
            String(m.title).toLowerCase().includes(query) || 
            String(m.genres).toLowerCase().includes(query)
        );

        pageTitle.innerText = `Search Results: ${results.length} Found`;
        renderGrid(container, results);
    } catch (e) {
        console.error("Search Error:", e);
    }
}

// 4. RENDER FUNCTION
function renderGrid(container, movieList) {
    if (movieList.length === 0) {
        container.innerHTML = "<p style='padding:20px;'>No matches found.</p>";
        return;
    }

    container.innerHTML = movieList.map(movie => `
        <div class="movie-card">
            <a href="movie-details.html?id=${movie.id}">
                <img src="${movie.posterUrl}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/300x450?text=Poster+Missing'">
                <div class="info">
                    <h3>${movie.title}</h3>
                    <p>${movie.year} | ${movie.quality}</p>
                </div>
            </a>
        </div>
    `).join('');
}

// Initialization: Show all movies when page loads
window.onload = () => showGenre('All');