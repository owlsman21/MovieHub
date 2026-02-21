// 1. MAIN ENGINE: Loads movies from your JSON
async function loadMovies(containerId, filterType = null, filterValue = null, limit = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const response = await fetch('movies.json');
        if (!response.ok) throw new Error("movies.json not found");
        const movies = await response.json();

        let filteredMovies = movies;

        // Smart Filtering Logic
        if (filterType === 'genre' && filterValue) {
            filteredMovies = movies.filter(m => 
                String(m.genres).toLowerCase().includes(filterValue.toLowerCase())
            );
        } else if (filterType === 'yearRange' && filterValue) {
            // Filters for 2025 and 2026
            filteredMovies = movies.filter(m => m.year >= filterValue);
        }

        if (limit) {
            filteredMovies = filteredMovies.slice(0, limit);
        }

        renderGrid(container, filteredMovies);
    } catch (e) {
        console.error("Vault Error:", e);
    }
}

async function searchVault() {
    const query = document.getElementById('movieSearch').value.toLowerCase();
    const latestGrid = document.getElementById('latest-grid');
    const hitchcockGrid = document.getElementById('hitchcock-grid');
    const releaseGrid = document.getElementById('new-releases-grid'); 

    // 1. Target the main content area so results have room to grow
    const activeGrid = document.getElementById('latest-grid');

    if (query === "") {
        if (latestGrid) { location.reload(); }
        return;
    }

    try {
        const response = await fetch('movies.json');
        const movies = await response.json();

        const results = movies.filter(m => 
            String(m.title).toLowerCase().includes(query) || 
            String(m.genres).toLowerCase().includes(query) ||
            String(m.year).includes(query) || 
            String(m.director).toLowerCase().includes(query)
        );

        // 2. HIDE the other headers and grids so they don't get in the way
        if (hitchcockGrid) hitchcockGrid.parentElement.style.display = 'none';
        if (releaseGrid) releaseGrid.parentElement.style.display = 'none';
        
        // 3. IMPORTANT: Reset the 'limit' of the grid so it shows all 11
        activeGrid.style.display = 'grid'; 
        activeGrid.innerHTML = ''; // Clear it first

        const mainHeader = document.querySelector('main h1');
        if (mainHeader) mainHeader.innerText = `Search Results: ${results.length} Found`;

        renderGrid(activeGrid, results);
    } catch (e) {
        console.error("Search Error:", e);
    }
}

// 3. RENDER FUNCTION (Keep your existing code here)
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

// 5. AUTOMATIC LOAD HANDLER
window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTrigger = urlParams.get('search');
    
    if (searchTrigger) {
        quickSearch(searchTrigger);
    } else {
        // Row 1: New Releases (2025-2026) - Limit 6
        if (document.getElementById('new-releases-grid')) loadMovies('new-releases-grid', 'yearRange', 2025, 6);
        
        // Row 2: Latest Uploads - Limit 6
        if (document.getElementById('latest-grid')) loadMovies('latest-grid', null, null, 6);
        
        // Row 3: Hitchcock Collection - Limit 18
        if (document.getElementById('hitchcock-grid')) loadMovies('hitchcock-grid', 'genre', 'Hitchcock', 18);
    }
};