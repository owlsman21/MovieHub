let allMoviesCache = [];

async function initMovieVault() {
    try {
        const response = await fetch('data/all-movies.json');
        if (!response.ok) throw new Error("Could not find data");
        allMoviesCache = await response.json();

       // 1. NEW ADDITIONS: Now takes the first 16 items from the TOP of the JSON
const newAdditions = allMoviesCache.slice(0, 24); 
renderGrid(document.getElementById('latest-grid'), newAdditions);

        // 2. LATEST RELEASES: Sort the entire library by Year (2026 downwards)
        // Shows 24 movies as requested
        const latestReleases = [...allMoviesCache]
            .sort((a, b) => b.year - a.year)
            .slice(0, 24);
        renderGrid(document.getElementById('latest-releases-grid'), latestReleases);

        // 3. HITCHCOCK COLLECTION: Filter by genre
        const hitchcockMovies = allMoviesCache.filter(m => 
            m.genres && Array.isArray(m.genres) && 
            m.genres.some(genre => genre.toLowerCase() === 'hitchcock')
        ).slice(0, 16);
        renderGrid(document.getElementById('hitchcock-grid'), hitchcockMovies);

        // 4. ASIAN MOVIES: Filter by 'thai' genre
        const asianMovies = allMoviesCache.filter(m => 
            m.genres && Array.isArray(m.genres) && 
            m.genres.some(genre => genre.toLowerCase() === 'thai')
        ).slice(0, 16);
        renderGrid(document.getElementById('asian-grid'), asianMovies);

        // Initial search section state
        const homepageSearchSection = document.getElementById('homepage-search-section');
        if (homepageSearchSection) {
            homepageSearchSection.style.display = 'none';
        }

        // Catalog Logic
        const catalogGridContainer = document.getElementById('movie-grid-container');
        if (catalogGridContainer) {
            const urlParams = new URLSearchParams(window.location.search);
            const genre = urlParams.get('genre');
            const searchTermFromURL = urlParams.get('search');

            if (searchTermFromURL) {
                renderGrid(catalogGridContainer, allMoviesCache.filter(m => m.title.toLowerCase().includes(searchTermFromURL.toLowerCase())));
            } else {
                showGenre(genre || 'All');
            }
        }

        setupSearch();

    } catch (e) {
        console.error("Vault Error:", e);
    }
}

function renderGrid(container, movieList) {
    if (!container) return; 

    container.innerHTML = movieList.length > 0
        ? movieList.map(movie => `
            <div class="movie-card">
                <a href="movie-details.html?id=${movie.id}">
                    <img src="${movie.posterUrl}" onerror="this.src='https://via.placeholder.com/300x450?text=Poster+Missing'" alt="${movie.title} poster">
                    <h3>${movie.title} (${movie.year})</h3>
                </a>
            </div>
        `).join('')
        : "<p>No movies found.</p>";
}

function showGenre(genre) {
    const container = document.getElementById('movie-grid-container'); 
    if (!container) return;

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

            const homepageSearchResultsContainer = document.getElementById('homepage-search-results');
            const homepageSearchSection = document.getElementById('homepage-search-section');
            
            // Targeted sections to hide/show during search
            const contentSections = [
                document.getElementById('latest-grid'),
                document.getElementById('latest-releases-grid'),
                document.getElementById('hitchcock-grid'),
                document.getElementById('asian-grid')
            ];

            if (homepageSearchResultsContainer && homepageSearchSection) {
                renderGrid(homepageSearchResultsContainer, filteredMovies);
                
                if (term.length > 0) {
                    homepageSearchSection.style.display = 'block';
                    contentSections.forEach(grid => {
                        if(grid) grid.closest('section').style.display = 'none';
                    });
                } else {
                    homepageSearchSection.style.display = 'none';
                    contentSections.forEach(grid => {
                        if(grid) grid.closest('section').style.display = 'block';
                    });
                }
            } else {
                const catalogGridContainer = document.getElementById('movie-grid-container');
                if (catalogGridContainer) {
                    renderGrid(catalogGridContainer, filteredMovies);
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', initMovieVault);