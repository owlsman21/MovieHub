let allMoviesCache = [];

// 1. Initialize Everything
async function initMovieVault() {
    try {
        const response = await fetch('data/all-movies.json');
        if (!response.ok) throw new Error("Could not find movie data");
        allMoviesCache = await response.json();

        // Populate containers if they exist on the current page
        const latestCont = document.getElementById('latest-container');
        if (latestCont) renderGrid(latestCont, allMoviesCache.slice(0, 12));

        const hitchCont = document.getElementById('hitchcock-container');
        if (hitchCont) {
            const hitchRaw = allMoviesCache.filter(m => {
                const genres = normalizeGenres(m.genres);
                const cat = (m.category || "").toString().trim().toLowerCase();
                return cat === 'hitchcock' || genres.includes('hitchcock');
            });
            renderGrid(hitchCont, [...new Map(hitchRaw.map(m => [m.id, m])).values()]);
        }

        const gridCont = document.getElementById('movie-grid-container');
        if (gridCont) {
            const urlParams = new URLSearchParams(window.location.search);
            const genre = urlParams.get('genre');
            showGenre(genre || 'All');
        }

        // --- CRITICAL FIX: Initialize search after data is loaded ---
        setupSearch(); 

    } catch (e) {
        console.error("Vault Error:", e);
    }
}

// 2. Search Logic
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const gridContainer = document.getElementById('movie-grid-container');

    if (searchInput && gridContainer) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            const filtered = allMoviesCache.filter(movie => 
                movie.title.toLowerCase().includes(searchTerm)
            );
            renderGrid(gridContainer, filtered);
        });
    }
}

// 3. Helper Functions
function normalizeGenres(genres) {
    if (!genres) return [];
    if (Array.isArray(genres)) return genres.map(g => g.toString().toLowerCase().trim());
    return genres.split(',').map(g => g.trim().toLowerCase());
}

function renderGrid(container, movieList) {
    if (!container) return;
    container.innerHTML = movieList.length > 0 
        ? movieList.map(movie => `
            <div class="movie-card">
                <a href="movie-details.html?id=${movie.id}">
                    <img src="${movie.posterUrl}" onerror="this.src='https://via.placeholder.com/300x450?text=Poster+Missing'">
                    <h3>${movie.title}</h3>
                </a>
            </div>
        `).join('')
        : "<p style='padding:20px;'>No movies found.</p>";
}

function showGenre(genre) {
    const container = document.getElementById('movie-grid-container');
    const pageTitle = document.getElementById('page-title');
    if (!container) return;

    const searchGenre = genre.toLowerCase().trim();
    const filtered = genre === 'All' 
        ? allMoviesCache 
        : allMoviesCache.filter(m => normalizeGenres(m.genres).includes(searchGenre));
    
    if (pageTitle) pageTitle.innerText = genre === 'All' ? 'Vault Collection' : `${genre} Vault`;
    renderGrid(container, filtered);
}

// Run on load
window.onload = initMovieVault;