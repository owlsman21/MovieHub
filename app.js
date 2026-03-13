let allMoviesCache = [];

async function initMovieVault() {
    try {
        const response = await fetch('data/all-movies.json');
        if (!response.ok) throw new Error("Could not find data");
        allMoviesCache = await response.json();

        // Safe rendering for Home Page specific sections (using the correct IDs)
        renderGrid(document.getElementById('latest-grid'), allMoviesCache.slice(0, 12));

        // Fixed: Filter by checking if the 'genres' array includes 'Hitchcock' (case-insensitive for robustness)
        // Added Array.isArray() check to ensure m.genres is actually an array
        renderGrid(document.getElementById('hitchcock-grid'), allMoviesCache.filter(m => m.genres && Array.isArray(m.genres) && m.genres.some(genre => genre.toLowerCase() === 'hitchcock')));

        // MODIFIED: Filter for Asian movies, specifically looking for 'thai' genre
        // Added Array.isArray() check to ensure m.genres is actually an array
        renderGrid(document.getElementById('asian-grid'), allMoviesCache.filter(m => m.genres && Array.isArray(m.genres) && m.genres.some(genre => genre.toLowerCase() === 'thai')));

        // If the homepage search results container exists, initialize it as empty/hidden
        const homepageSearchSection = document.getElementById('homepage-search-section');
        if (homepageSearchSection) {
            homepageSearchSection.style.display = 'none'; // Initially hide the search results section
        }

        // Safe rendering for Catalog Page containers
        // This 'movie-grid-container' is expected to be on catalog.html, not index.html
        const catalogGridContainer = document.getElementById('movie-grid-container');
        if (catalogGridContainer) {
            const urlParams = new URLSearchParams(window.location.search);
            const genre = urlParams.get('genre');
            const searchTermFromURL = urlParams.get('search'); // Check for search term from URL (if coming from homepage redirect)

            if (searchTermFromURL) {
                // If there's a search term from the URL, filter and display those
                renderGrid(catalogGridContainer, allMoviesCache.filter(m => m.title.toLowerCase().includes(searchTermFromURL.toLowerCase())));
            } else {
                // Otherwise, show by genre or all
                showGenre(genre || 'All');
            }
        }

        setupSearch(); // Initialize the search functionality

    } catch (e) {
        console.error("Vault Error:", e);
    }
}

function renderGrid(container, movieList) {
    if (!container) return; // Silent exit if container isn't on the current page

    container.innerHTML = movieList.length > 0
        ? movieList.map(movie => `
            <div class="movie-card">
                <a href="movie-details.html?id=${movie.id}">
                    <img src="${movie.posterUrl}" onerror="this.src='https://via.placeholder.com/300x450?text=Poster+Missing'" alt="${movie.title} poster">
                    <h3>${movie.title}</h3>
                </a>
            </div>
        `).join('')
        : "<p>No movies found.</p>";
}

function showGenre(genre) {
    const container = document.getElementById('movie-grid-container'); // This is primarily for catalog.html
    if (!container) return;

    // Make genre filtering case-insensitive
    const filtered = genre === 'All'
        ? allMoviesCache
        : allMoviesCache.filter(m => m.genres && Array.isArray(m.genres) && m.genres.map(g => g.toLowerCase()).includes(genre.toLowerCase()));

    renderGrid(container, filtered);
}

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filteredMovies = allMoviesCache.filter(m => m.title.toLowerCase().includes(term));

            // Check if we are on index.html and have a dedicated search results container
            const homepageSearchResultsContainer = document.getElementById('homepage-search-results');
            const homepageSearchSection = document.getElementById('homepage-search-section');

            if (homepageSearchResultsContainer && homepageSearchSection) {
                renderGrid(homepageSearchResultsContainer, filteredMovies);
                // Show or hide the section based on whether there's a search term
                if (term.length > 0) {
                    homepageSearchSection.style.display = 'block';
                    // Hide other sections when search results are shown
                    document.getElementById('latest-grid').closest('section').style.display = 'none';
                    document.getElementById('hitchcock-grid').closest('section').style.display = 'none';
                    document.getElementById('asian-grid').closest('section').style.display = 'none';
                } else {
                    homepageSearchSection.style.display = 'none';
                    // Show other sections when search is cleared
                    document.getElementById('latest-grid').closest('section').style.display = 'block';
                    document.getElementById('hitchcock-grid').closest('section').style.display = 'block';
                    document.getElementById('asian-grid').closest('section').style.display = 'block';
                }
            } else {
                // This is the original logic for catalog.html (where movie-grid-container exists)
                const catalogGridContainer = document.getElementById('movie-grid-container');
                if (catalogGridContainer) {
                    renderGrid(catalogGridContainer, filteredMovies);
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', initMovieVault);