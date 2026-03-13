let allMoviesCache = [];

// 1. Initialize Everything
async function initMovieVault() {
    try {
        const response = await fetch('data/all-movies.json');
        if (!response.ok) throw new Error("Could not find movie data");
        allMoviesCache = await response.json();

     // Populate Latest Movies (Top 12, excluding Asian/Thai)
        const latestCont = document.getElementById('latest-grid');
        if (latestCont) {
            const internationalOnly = allMoviesCache.filter(m => {
                const genres = normalizeGenres(m.genres);
                const cat = (m.category || "").toString().trim().toLowerCase();
                // Exclude if it's Asian or Thai
                return cat !== 'asian' && !genres.includes('thai');
            });
            renderGrid(latestCont, internationalOnly.slice(0, 12));
        }

        // Populate Hitchcock Collection
        const hitchCont = document.getElementById('hitchcock-grid');
        if (hitchCont) {
            const hitchRaw = allMoviesCache.filter(m => {
                const genres = normalizeGenres(m.genres);
                const cat = (m.category || "").toString().trim().toLowerCase();
                return cat === 'hitchcock' || genres.includes('hitchcock');
            });
            renderGrid(hitchCont, hitchRaw);
        }

       // Populate Asian Movies
const asianCont = document.getElementById('asian-grid');
if (asianCont) {
    const asianRaw = allMoviesCache.filter(m => {
        const genres = normalizeGenres(m.genres); // This helper converts genres to lowercase array
        const cat = (m.category || "").toString().trim().toLowerCase();
        // Check if category is 'asian' OR if 'thai' is in the genres list
        return cat === 'asian' || genres.includes('thai');
    });
    renderGrid(asianCont, asianRaw);
}

        setupSearch(); 

    } catch (e) {
        console.error("Vault Error:", e);
    }
}

// 2. Search Logic (For search-input)
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    // Note: Only setup search if we aren't on the home page or if search applies to the whole catalog
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            // Redirect or filter logic here depending on your needs
            console.log("Searching for:", searchTerm);
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
        : "<p style='padding:20px;'>No movies found in this category.</p>";
}

// Run on load
window.onload = initMovieVault;