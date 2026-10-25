let allMoviesCache = [];

function sanitizeFilename(name) {
    if (!name) return '';
    return String(name).replace(/[:\\/*?"<>|]/g, '-');
}

async function initMovieVault() {
    try {
        // Fetch the movie database
        const response = await fetch('all-movies.json');
        if (!response.ok) throw new Error("Could not find all-movies.json data");
        allMoviesCache = await response.json();

        // 1. DYNAMIC CANONICAL TAG FIX (Solves Search Console Indexing Issue)
        const urlParams = new URLSearchParams(window.location.search);
        const movieId = urlParams.get('id');
        if (movieId) {
            let canonicalLink = document.querySelector("link[rel='canonical']");
            if (!canonicalLink) {
                canonicalLink = document.createElement('link');
                canonicalLink.setAttribute('rel', 'canonical');
                document.head.appendChild(canonicalLink);
            }
            canonicalLink.setAttribute('href', `https://moviehub.uk/movies/${sanitizeFilename(movieId)}.html`);
        }

        // 2. HELPER TO MATCH GENRES
        const hasGenre = (movie, target) => {
            if (!movie || !movie.genres) return false;
            const term = target.toLowerCase().trim();
            
            const genreString = Array.isArray(movie.genres) 
                ? movie.genres.join(', ').toLowerCase() 
                : String(movie.genres).toLowerCase();

            if (term === 'noir' || term === 'film noir') {
                return genreString.includes('noir');
            }
            if (term.includes('classic')) {
                return genreString.includes('classic');
            }

            return genreString.includes(term);
        };

        const publicMovies = allMoviesCache.filter(m => m.category !== 'private');
        const privateMovies = allMoviesCache.filter(m => m.category === 'private');

        // Render Members Page Grid
        const membersGrid = document.getElementById('members-grid');
        if (membersGrid) {
            renderGrid(membersGrid, privateMovies);
            return;
        }

        // Render Classics Page Grid
        const classicsGrid = document.getElementById('classics-grid');
        if (classicsGrid) {
            const classicMovies = publicMovies.filter(m => hasGenre(m, 'classic'));
            const polishedClassics = classicMovies.map(movie => ({
                ...movie,
                title: movie.title ? movie.title.split('|')[0].trim() : 'Untitled Classic'
            }));
            renderGrid(classicsGrid, polishedClassics);
            setupSearch(publicMovies);
            return;
        }

        // 3. HOMEPAGE GRIDS
        if (document.getElementById('latest-grid')) {
            renderGrid(document.getElementById('latest-grid'), publicMovies.slice(0, 18));
        }

        if (document.getElementById('latest-releases-grid')) {
            const latestReleases = [...publicMovies]
                .sort((a, b) => (parseInt(b.year, 10) || 0) - (parseInt(a.year, 10) || 0))
                .slice(0, 18);
            renderGrid(document.getElementById('latest-releases-grid'), latestReleases);
        }

        if (document.getElementById('hitchcock-grid')) {
            const hitchcockMovies = publicMovies.filter(m => hasGenre(m, 'hitchcock')).slice(0, 18);
            renderGrid(document.getElementById('hitchcock-grid'), hitchcockMovies);
        }

        if (document.getElementById('asian-grid')) {
            const asianMovies = publicMovies.filter(m => hasGenre(m, 'thai') || hasGenre(m, 'asian')).slice(0, 18);
            renderGrid(document.getElementById('asian-grid'), asianMovies);
        }

        const homepageSearchSection = document.getElementById('homepage-search-section');
        if (homepageSearchSection) homepageSearchSection.style.display = 'none';

        // 4. CATEGORY & COLLECTION PAGE HANDLER
        const catalogGridContainer = document.getElementById('movie-grid-container') || 
                                     document.getElementById('category-grid') || 
                                     document.getElementById('movies-grid') ||
                                     document.getElementById('category-movies') ||
                                     document.querySelector('.movie-grid') ||
                                     document.querySelector('.grid-container');

        if (catalogGridContainer) {
            const genre = urlParams.get('genre') || urlParams.get('q') || urlParams.get('category');
            const searchTermFromURL = urlParams.get('search');

            if (searchTermFromURL) {
                renderGrid(catalogGridContainer, publicMovies.filter(m => m.title && m.title.toLowerCase().includes(searchTermFromURL.toLowerCase())));
            } else {
                showGenre(genre || 'All', publicMovies, catalogGridContainer);
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
        ? movieList.map(movie => {
            const safeId = sanitizeFilename(movie.id);
            const poster = movie.posterUrl ? movie.posterUrl.replace('../', '').replace(/^\/+/, '') : '';
            const posterSrc = poster.startsWith('images/') ? `/${poster}` : `/images/${poster}`;

            return `
                <div class="movie-card" onclick="window.location.href='/movies/${safeId}.html'" style="cursor: pointer;">
                    <img src="${posterSrc}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450?text=Poster+Missing'" alt="${movie.title} poster">
                    <h3>${movie.title} (${movie.year})</h3>
                </div>
            `;
        }).join('')
        : "<p>No movies found.</p>";

    // Update pagination count text if present
    const pageInfoText = document.querySelector('.pagination span, #page-info, .page-number');
    if (pageInfoText && movieList.length > 0) {
        const totalPages = Math.ceil(movieList.length / 18) || 1;
        pageInfoText.textContent = `Page 1 of ${totalPages}`;
    }
}

function showGenre(genre, sourceList, targetContainer) {
    const container = targetContainer || document.getElementById('movie-grid-container'); 
    if (!container) return;
    
    const term = (genre || 'all').toLowerCase().trim();
    
    const filtered = term === 'all' 
        ? sourceList 
        : sourceList.filter(m => {
            if (!m || !m.genres) return false;
            
            const genreString = Array.isArray(m.genres) 
                ? m.genres.join(', ').toLowerCase() 
                : String(m.genres).toLowerCase();
            
            if (term === 'noir' || term === 'film noir') {
                return genreString.includes('noir');
            }
            if (term.includes('classic')) {
                return genreString.includes('classic');
            }
            
            return genreString.includes(term);
        });
        
    renderGrid(container, filtered);
}

function setupSearch(searchableList) {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filteredMovies = searchableList.filter(m => m.title && m.title.toLowerCase().includes(term));
            const homepageSearchResultsContainer = document.getElementById('homepage-search-results');
            const homepageSearchSection = document.getElementById('homepage-search-section');
            const contentSections = [
                document.getElementById('new-additions-section'), document.getElementById('bette-davis-section'),
                document.getElementById('latest-section'), document.getElementById('hitchcock-section'),
                document.getElementById('asian-section'), document.getElementById('classics-section') 
            ];

            if (homepageSearchResultsContainer && homepageSearchSection) {
                renderGrid(homepageSearchResultsContainer, filteredMovies.slice(0, 18));
                if (term.length > 0) {
                    homepageSearchSection.style.display = 'block';
                    contentSections.forEach(s => { if(s) s.style.display = 'none'; });
                } else {
                    homepageSearchSection.style.display = 'none';
                    contentSections.forEach(s => { if(s) s.style.display = 'block'; });
                }
            } else {
                const catalogGridContainer = document.getElementById('movie-grid-container') || document.querySelector('.movie-grid');
                if (catalogGridContainer) {
                    renderGrid(catalogGridContainer, filteredMovies.slice(0, 18));
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', initMovieVault);