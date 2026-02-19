// 1. MAIN ENGINE: Loads movies from your JSON
async function loadMovies(containerId, filterGenre = null, limit = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const response = await fetch('movies.json');
        if (!response.ok) throw new Error("movies.json not found");
        const movies = await response.json();

        let filteredMovies = movies;

        if (filterGenre) {
            filteredMovies = movies.filter(m => {
                const genreStr = m.genres ? String(m.genres).toLowerCase() : "";
                return genreStr.includes(filterGenre.toLowerCase());
            });
        }

        if (limit) {
            filteredMovies = filteredMovies.slice(0, limit);
        }

        renderGrid(container, filteredMovies);
    } catch (e) {
        console.error("Vault Error:", e);
    }
}

// 2. GLOBAL SEARCH: Scans all 845+ movies
async function searchVault() {
    const query = document.getElementById('movieSearch').value.toLowerCase();
    const latestGrid = document.getElementById('latest-grid');
    const hitchcockGrid = document.getElementById('hitchcock-grid');
    const westernGrid = document.getElementById('western-test-grid'); 

    const activeGrid = latestGrid || westernGrid || document.querySelector('.movie-grid');

    if (query === "") {
        // If searching from index.html, reset the view
        if (latestGrid) {
            location.reload(); 
        }
        return;
    }

    try {
        const response = await fetch('movies.json');
        const movies = await response.json();

        const results = movies.filter(m => 
            String(m.title).toLowerCase().includes(query) || 
            String(m.genres).toLowerCase().includes(query)
        );

        if (hitchcockGrid) hitchcockGrid.parentElement.style.display = 'none';
        
        const mainHeader = document.querySelector('main h1');
        if (mainHeader) mainHeader.innerText = `Search Results: ${results.length} Found`;

        renderGrid(activeGrid, results);
    } catch (e) {
        console.error("Search Error:", e);
    }
}

// 3. RENDER FUNCTION
function renderGrid(container, movieList) {
    if (movieList.length === 0) {
        container.innerHTML = "<p style='padding:20px;'>No matches found in the Vault.</p>";
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

// 4. QUICK SEARCH & URL HANDLER
function quickSearch(term) {
    const searchInput = document.getElementById('movieSearch');
    if (searchInput) {
        searchInput.value = term;
        searchVault();
    }
}

// Automatically check if we arrived here from a button on another page
window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTrigger = urlParams.get('search');
    
    if (searchTrigger) {
        quickSearch(searchTrigger);
    } else {
        if (document.getElementById('latest-grid')) loadMovies('latest-grid', null, 12);
        if (document.getElementById('hitchcock-grid')) loadMovies('hitchcock-grid', 'Hitchcock', 6);
        if (document.getElementById('western-test-grid')) loadMovies('western-test-grid', 'Western');
    }
};