let allMoviesCache = [];

async function initMovieVault() {
    try {
        const response = await fetch('data/all-movies.json');
        if (!response.ok) throw new Error("Could not find data");
        allMoviesCache = await response.json();

        // --- THE MEMBER FILTER ---
        // Public movies: Everything NOT marked as 'private'
        const publicMovies = allMoviesCache.filter(m => m.category !== 'private');
        // Member movies: Only those marked as 'private'
        const privateMovies = allMoviesCache.filter(m => m.category === 'private');

        // 1. MEMBERS VAULT: Check if we are on the members-vault.html page
        const membersGrid = document.getElementById('members-grid');
        if (membersGrid) {
            renderGrid(membersGrid, privateMovies);
            // We return early so the homepage grids don't try to load on the vault page
            return;
        }

        // 1b. CLASSIC MOVIES VAULT: Check if we are on the classic-movies.html page
        const classicsGrid = document.getElementById('classics-grid');
        if (classicsGrid) {
            // Filter down to classic titles
            const classicMovies = publicMovies.filter(m => 
                m.genres && Array.isArray(m.genres) && 
                m.genres.some(genre => genre.toLowerCase().includes('classic'))
            );

            // Clean up titles on the fly by splitting out SEO data after the '|' divider
            const polishedClassics = classicMovies.map(movie => ({
                ...movie,
                title: movie.title ? movie.title.split('|')[0].trim() : 'Untitled Classic'
            }));

            renderGrid(classicsGrid, polishedClassics);
            setupSearch(publicMovies); // Keep search working on the classics page
            return;
        }

        // 2. NEW ADDITIONS: Takes first 24 items from PUBLIC list
        const newAdditions = publicMovies.slice(0, 24); 
        renderGrid(document.getElementById('latest-grid'), newAdditions);

        // 3. LATEST RELEASES: Sort the PUBLIC library by Year
        const latestReleases = [...publicMovies]
            .sort((a, b) => b.year - a.year)
            .slice(0, 24);
        renderGrid(document.getElementById('latest-releases-grid'), latestReleases);

        // 4. HITCHCOCK COLLECTION: Filter public by genre
        const hitchcockMovies = publicMovies.filter(m => 
            m.genres && Array.isArray(m.genres) && 
            m.genres.some(genre => genre.toLowerCase() === 'hitchcock')
        ).slice(0, 16);
        renderGrid(document.getElementById('hitchcock-grid'), hitchcockMovies);

        // 5. ASIAN MOVIES: Filter public by 'thai' genre
        const asianMovies = publicMovies.filter(m => 
            m.genres && Array.isArray(m.genres) && 
            m.genres.some(genre => genre.toLowerCase() === 'thai')
        ).slice(0, 16);
        renderGrid(document.getElementById('asian-grid'), asianMovies);

        // Initial search section state
        const homepageSearchSection = document.getElementById('homepage-search-section');
        if (homepageSearchSection) {
            homepageSearchSection.style.display = 'none';
        }

        // Catalog Logic (Handles 'All Movies' page)
        const catalogGridContainer = document.getElementById('movie-grid-container');
        if (catalogGridContainer) {
            const urlParams = new URLSearchParams(window.location.search);
            const genre = urlParams.get('genre');
            const searchTermFromURL = urlParams.get('search');

            if (searchTermFromURL) {
                renderGrid(catalogGridContainer, publicMovies.filter(m => m.title.toLowerCase().includes(searchTermFromURL.toLowerCase())));
            } else {
                showGenre(genre || 'All', publicMovies);
            }
        }

        setupSearch(publicMovies);

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

function showGenre(genre, sourceList) {
    const container = document.getElementById('movie-grid-container'); 
    if (!container) return;

    const filtered = genre === 'All'
        ? sourceList
        : sourceList.filter(m => m.genres && Array.isArray(m.genres) && m.genres.map(g => g.toLowerCase()).includes(genre.toLowerCase()));

    renderGrid(container, filtered);
}

function setupSearch(searchableList) {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filteredMovies = searchableList.filter(m => m.title.toLowerCase().includes(term));

            const homepageSearchResultsContainer = document.getElementById('homepage-search-results');
            const homepageSearchSection = document.getElementById('homepage-search-section');
            
            const contentSections = [
                document.getElementById('new-additions-section'), 
                document.getElementById('latest-section'),
                document.getElementById('hitchcock-section'),
                document.getElementById('asian-section'),
                document.getElementById('classics-section') 
            ];

            if (homepageSearchResultsContainer && homepageSearchSection) {
                renderGrid(homepageSearchResultsContainer, filteredMovies);
                
                if (term.length > 0) {
                    homepageSearchSection.style.display = 'block';
                    contentSections.forEach(section => {
                        if(section) section.style.display = 'none';
                    });
                } else {
                    homepageSearchSection.style.display = 'none';
                    contentSections.forEach(section => {
                        if(section) section.style.display = 'block';
                    });
                }
            } else {
                const catalogGridContainer = document.getElementById('movie-grid-container');
                if (catalogGridContainer) {
                    renderGrid(catalogGridContainer, filteredMovies);
                } else {
                    // If searching on the standalone classic-movies page
                    const classicsGrid = document.getElementById('classics-grid');
                    if (classicsGrid) {
                        const classicsOnlySearch = filteredMovies.filter(m => 
                            m.genres && Array.isArray(m.genres) && 
                            m.genres.some(genre => genre.toLowerCase().includes('classic'))
                        );
                        
                        // Apply the same title-cleaning layout rules during typing/filtering
                        const polishedSearch = classicsOnlySearch.map(movie => ({
                            ...movie,
                            title: movie.title ? movie.title.split('|')[0].trim() : 'Untitled Classic'
                        }));

                        renderGrid(classicsGrid, polishedSearch);
                    }
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', initMovieVault);