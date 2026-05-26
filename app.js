let allMoviesCache = [];

async function initMovieVault() {
    try {
        const response = await fetch('data/all-movies.json');
        if (!response.ok) throw new Error("Could not find data");
        allMoviesCache = await response.json();

        const publicMovies = allMoviesCache.filter(m => m.category !== 'private');
        const privateMovies = allMoviesCache.filter(m => m.category === 'private');

        const membersGrid = document.getElementById('members-grid');
        if (membersGrid) {
            renderGrid(membersGrid, privateMovies);
            return;
        }

        const classicsGrid = document.getElementById('classics-grid');
        if (classicsGrid) {
            const classicMovies = publicMovies.filter(m => 
                m.genres && Array.isArray(m.genres) && 
                m.genres.some(genre => genre.toLowerCase().includes('classic'))
            );
            const polishedClassics = classicMovies.map(movie => ({
                ...movie,
                title: movie.title ? movie.title.split('|')[0].trim() : 'Untitled Classic'
            }));
            renderGrid(classicsGrid, polishedClassics);
            setupSearch(publicMovies);
            return;
        }

        // --- ALL SECTIONS NOW CAPPED AT 18 ---
        renderGrid(document.getElementById('latest-grid'), publicMovies.slice(0, 18));

        const betteDavisMovies = publicMovies.filter(m => {
            const titleLower = m.title ? m.title.toLowerCase() : '';
            const descLower = m.description ? m.description.toLowerCase() : '';
            return titleLower.includes('bette davis') || descLower.includes('bette davis') || titleLower.includes('the furies');
        }).slice(0, 18); 
        renderGrid(document.getElementById('bette-davis-grid'), betteDavisMovies);

        const latestReleases = [...publicMovies]
            .sort((a, b) => b.year - a.year)
            .slice(0, 18);
        renderGrid(document.getElementById('latest-releases-grid'), latestReleases);

        const hitchcockMovies = publicMovies.filter(m => 
            m.genres && Array.isArray(m.genres) && m.genres.some(genre => genre.toLowerCase() === 'hitchcock')
        ).slice(0, 18);
        renderGrid(document.getElementById('hitchcock-grid'), hitchcockMovies);

        const asianMovies = publicMovies.filter(m => 
            m.genres && Array.isArray(m.genres) && m.genres.some(genre => genre.toLowerCase() === 'thai')
        ).slice(0, 18);
        renderGrid(document.getElementById('asian-grid'), asianMovies);

        const homepageSearchSection = document.getElementById('homepage-search-section');
        if (homepageSearchSection) homepageSearchSection.style.display = 'none';

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
                    <img src="${movie.posterUrl}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450?text=Poster+Missing'" alt="${movie.title} poster">
                    <h3>${movie.title} (${movie.year})</h3>
                </a>
            </div>
        `).join('')
        : "<p>No movies found.</p>";
}

function showGenre(genre, sourceList) {
    const container = document.getElementById('movie-grid-container'); 
    if (!container) return;
    const filtered = genre === 'All' ? sourceList : sourceList.filter(m => m.genres && Array.isArray(m.genres) && m.genres.map(g => g.toLowerCase()).includes(genre.toLowerCase()));
    renderGrid(container, filtered.slice(0, 18)); // Capped here too
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
                document.getElementById('new-additions-section'), document.getElementById('bette-davis-section'),
                document.getElementById('latest-section'), document.getElementById('hitchcock-section'),
                document.getElementById('asian-section'), document.getElementById('classics-section') 
            ];

            if (homepageSearchResultsContainer && homepageSearchSection) {
                renderGrid(homepageSearchResultsContainer, filteredMovies.slice(0, 18)); // Capped here too
                if (term.length > 0) {
                    homepageSearchSection.style.display = 'block';
                    contentSections.forEach(s => { if(s) s.style.display = 'none'; });
                } else {
                    homepageSearchSection.style.display = 'none';
                    contentSections.forEach(s => { if(s) s.style.display = 'block'; });
                }
            } else {
                const catalogGridContainer = document.getElementById('movie-grid-container');
                if (catalogGridContainer) {
                    renderGrid(catalogGridContainer, filteredMovies.slice(0, 18)); // Capped here too
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', initMovieVault);