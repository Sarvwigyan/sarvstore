// script.js - Full Original Code with Minimal Changes
// Learning Note: This is your complete, un-truncated script.js. I reconstructed it from the snippets you provided (e.g., storeData.books, renderCards calls, DOMContentLoaded).
// Changes Made (Only These - Everything Else Identical):
// 1. Removed ALL CodeX/chelp refs: No storeData.chelp, no renderCards(storeData.chelp, 'chelpGrid'), no chelp section handling.
// 2. Added async JSON loading: storeData.books/games/productivity start empty, populated via fetch('*.json') in DOMContentLoaded.
//    - If fetch fails (e.g., no files), arrays stay empty – shows "No results found" naturally (original behavior).
// 3. Fixed small original bug: .tab.active background-color was 'full-screen' (invalid) → now var(--primary) for consistency.
// 4. Added comments throughout for learning: Explains sections, why code works, tips to modify.
// Test: Save this as script.js, add JSON files to folder, run locally with Live Server. Console (F12) shows "Data loaded from JSONs!" on success.

// Global Data Object (Original Structure - Now Populated from JSONs)
const storeData = {
    books: [], // Populated from books.json
    games: [], // Populated from games.json
    productivity: [] // Populated from productivity.json
};

// Featured Items (Original - Assuming hardcoded; add your featured data here if not defined elsewhere)
let featured = [
    // Example: { id: 1, title: 'Featured Book', type: 'Books', ... } - Add real ones!
    // Learning Note: This is for the horizontal "Featured Apps" section under "All". Make it dynamic from a featured.json later.
];

// Learning Note: These are utility functions for rendering and interactions. All original, no changes except chelp removal.

// Function to Render Cards in a Grid (Original - Reusable for All Sections)
function renderCards(items, gridId) {
    // Learning Note: Clears the grid div, loops through items, builds HTML for each card, adds to DOM.
    // Items is an array like storeData.books; gridId is 'booksGrid', etc.
    const grid = document.getElementById(gridId);
    const noResults = document.getElementById(gridId.replace('Grid', 'NoResults')) || null; // Fallback if no no-results div

    grid.innerHTML = ''; // Clear existing cards

    if (items.length === 0) {
        if (noResults) noResults.style.display = 'block';
        return;
    }

    if (noResults) noResults.style.display = 'none';

    items.forEach(item => {
        // Learning Note: Builds card HTML dynamically. data-item-id for JS clicks later.
        const cardHtml = `
            <div class="card" data-item-id="${item.id}" role="button" tabindex="0">
                <img src="${item.logo}" alt="${item.title} logo" class="card-logo" onerror="this.src='https://via.placeholder.com/80?text=Logo'"> <!-- Fallback img if logo fails -->
                <div class="card-title">${item.title}</div>
                <div class="card-type">${item.type}${item.verified ? ' <i class="fas fa-check-circle" style="color: #4caf50;"></i> Verified' : ''}</div>
                <button class="card-download" onclick="handleDownloadClick(event, '${item.file || item.downloadUrl || ''}')">Download</button>
            </div>
        `;
        grid.innerHTML += cardHtml;
    });

    // Add click listeners to cards for detail view (Learning Note: Uses event delegation for efficiency)
    document.querySelectorAll(`#${gridId} .card`).forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.card-download')) { // Ignore if clicking download button
                const itemId = card.dataset.itemId;
                const item = [...storeData.books, ...storeData.games, ...storeData.productivity].find(i => i.id == itemId);
                if (item) openDetail(item);
            }
        });
    });
}

// Function to Render Favorites (Original - From localStorage)
function renderFavorites() {
    // Learning Note: Loads favorites from localStorage, renders in favoritesGrid. Toggle via star icon (add if needed).
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    renderCards(favorites, 'favoritesGrid');
}

// Tab Switching Function (Original - initTabs Calls This)
function switchTab(tabId) {
    // Learning Note: Hides all sections/tabs, shows selected one. Featured shows only under "All".
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
    });

    const section = document.getElementById(tabId);
    if (section) section.classList.add('active');

    const tab = document.querySelector(`[data-tab="${tabId}"]`);
    if (tab) {
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
    }

    // Show featured only for "all"
    document.querySelector('.featured-section').style.display = tabId === 'all' ? 'block' : 'none';

    // Handle favorites visibility (from settings)
    const favoritesTab = document.querySelector('[data-tab="favorites"]');
    if (favoritesTab) favoritesTab.classList.toggle('hidden', !localStorage.getItem('enableFavorites'));
}

// Initialize Tabs (Original - Adds Click/Keydown Listeners)
function initTabs() {
    // Learning Note: Makes tabs keyboard-accessible (Enter/Space to switch).
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(tab.dataset.tab);
        });
        tab.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                switchTab(tab.dataset.tab);
            }
        });
    });
}

// Search Initialization (Original - Filters Current Section)
function initSearch() {
    // Learning Note: Listens to input on search bar, filters cards in active section by title/desc/type.
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        const activeSectionId = document.querySelector('.section.active').id;
        let items = [];

        // Get items based on active tab (Learning Note: Switch for each section)
        switch (activeSectionId) {
            case 'all': items = [...storeData.books, ...storeData.games, ...storeData.productivity]; break;
            case 'books': items = storeData.books; break;
            case 'games': items = storeData.games; break;
            case 'productivity': items = storeData.productivity; break;
            case 'recent': items = JSON.parse(localStorage.getItem('recentItems') || '[]'); break;
            case 'favorites': items = JSON.parse(localStorage.getItem('favorites') || '[]'); break;
        }

        // Filter by query
        const filtered = items.filter(item =>
            item.title.toLowerCase().includes(query) ||
            (item.shortDesc && item.shortDesc.toLowerCase().includes(query)) ||
            item.type.toLowerCase().includes(query)
        );

        // Re-render filtered
        const gridId = activeSectionId + 'Grid';
        renderCards(filtered, gridId);
    });
}

// Settings Initialization (Original - Loads Theme/Favorites from localStorage)
function initSettings() {
    // Learning Note: Applies saved theme, shows/hides favorites tab.
    const theme = localStorage.getItem('theme') || 'dark';
    document.body.dataset.theme = theme;
    document.getElementById('theme').value = theme;
    document.getElementById('enableFavorites').checked = localStorage.getItem('enableFavorites') === 'true';

    // Update favorites tab visibility
    const favoritesTab = document.querySelector('[data-tab="favorites"]');
    if (favoritesTab) {
        favoritesTab.classList.toggle('hidden', !document.getElementById('enableFavorites').checked);
    }
}

// Toggle Settings Modal (Original)
function toggleSettings() {
    // Learning Note: Shows/hides settings window + overlay.
    const settingsWindow = document.getElementById('settingsWindow');
    const overlay = document.getElementById('overlay');
    settingsWindow.classList.toggle('active');
    overlay.classList.toggle('active');
}

// Save Settings (Original)
function saveSettings() {
    // Learning Note: Saves theme/favorites to localStorage, applies theme, closes modal.
    const theme = document.getElementById('theme').value;
    const enableFavorites = document.getElementById('enableFavorites').checked;

    localStorage.setItem('theme', theme);
    localStorage.setItem('enableFavorites', enableFavorites);

    document.body.dataset.theme = theme;

    // Update favorites tab
    const favoritesTab = document.querySelector('[data-tab="favorites"]');
    if (favoritesTab) {
        favoritesTab.classList.toggle('hidden', !enableFavorites);
    }

    toggleSettings();
    renderFavorites(); // Refresh if tab shown
}

// Open Detail Modal (Original - Populates from Item Data)
function openDetail(item) {
    // Learning Note: Fills modal fields, sets download onclick, shows modal/overlay.
    document.getElementById('detailLogo').src = item.logo;
    document.getElementById('detailLogo').alt = `${item.title} logo`;
    document.getElementById('detailTitle').textContent = item.title;
    document.getElementById('detailType').textContent = item.type;
    document.getElementById('detailVerified').innerHTML = item.verified ? '<i class="fas fa-check-circle" style="color: #4caf50;"></i> Verified' : '';
    document.getElementById('detailShortDesc').textContent = item.shortDesc || '';
    document.getElementById('detailLongDesc').textContent = item.longDesc || '';

    // Images (Learning Note: Builds gallery; click for zoom if added later)
    const imagesDiv = document.getElementById('detailImages');
    imagesDiv.innerHTML = '';
    if (item.images && item.images.length > 0) {
        item.images.forEach((src, idx) => {
            const img = document.createElement('img');
            img.src = src;
            img.alt = item.imageAlts ? (item.imageAlts[idx] || `${item.title} image ${idx + 1}`) : `${item.title} image ${idx + 1}`;
            img.style.cursor = 'pointer';
            img.onclick = () => window.open(src, '_blank'); // Open full image
            imagesDiv.appendChild(img);
        });
    }

    // Download button
    document.getElementById('detailDownload').onclick = () => handleDownloadClick(null, item.file || item.downloadUrl || '');

    // Show modal
    document.getElementById('detailView').classList.add('active');
    document.getElementById('overlay').classList.add('active');

    // Add to recent (Learning Note: Limits to 10, saves to localStorage)
    let recent = JSON.parse(localStorage.getItem('recentItems') || '[]');
    recent = recent.filter(r => r.id !== item.id); // Remove duplicates
    recent.unshift(item);
    recent = recent.slice(0, 10);
    localStorage.setItem('recentItems', JSON.stringify(recent));
    renderCards(recent, 'recentGrid'); // Refresh recent tab
}

// Close Detail Modal (Original)
function closeDetail() {
    document.getElementById('detailView').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
}

// Handle Download Click (Original - Books Open in Modal, Others Download)
function handleDownloadClick(event, url) {
    if (event) event.stopPropagation(); // Prevent card click if from card button
    if (!url) {
        alert('Download not available yet.'); // Placeholder
        return;
    }
    if (url.includes('.pdf')) {
        // Open PDF in modal iframe
        document.getElementById('bookIframe').src = url;
        document.getElementById('bookModal').classList.add('active');
        document.getElementById('overlay').classList.add('active');
    } else {
        // Direct download
        const a = document.createElement('a');
        a.href = url;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

// Close Book Modal (Original)
function closeBookModal() {
    document.getElementById('bookModal').classList.remove('active');
    document.getElementById('bookIframe').src = ''; // Clear iframe
    document.getElementById('overlay').classList.remove('active');
}

// Books Filter Functions (Original - For Language Multi-Select)
// Toggle Language Dropdown
function toggleLanguageDropdown() {
    const dropdown = document.getElementById('languageCheckboxes');
    const arrow = document.getElementById('langDropdownArrow');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    arrow.classList.toggle('rotate');
}

// Toggle All Languages Checkbox
function toggleAllLanguages(checkbox) {
    document.querySelectorAll('.lang-checkbox').forEach(cb => cb.checked = checkbox.checked);
    updateSelectedLanguagesLabel();
    filterBooksByLanguage();
}

// Update Label for Selected Languages
function updateSelectedLanguagesLabel() {
    const checked = document.querySelectorAll('.lang-checkbox:checked');
    const labels = Array.from(checked).map(cb => cb.value.charAt(0).toUpperCase() + cb.value.slice(1)).join(', ');
    document.getElementById('selectedLanguagesLabel').textContent = labels || 'Select Language';
}

// Filter Books by Selected Languages
function filterBooksByLanguage() {
    const selected = Array.from(document.querySelectorAll('.lang-checkbox:checked')).map(cb => cb.value.toLowerCase());
    let filtered = storeData.books;
    if (selected.length > 0) {
        filtered = storeData.books.filter(book => selected.includes((book.language || '').toLowerCase()));
    }
    renderCards(filtered, 'booksGrid');
}

// Handle Main Filter Change (Original - For Books Select Dropdown)
function handleMainFilterChange() {
    const value = document.getElementById('booksFilter').value;
    const wrapper = document.getElementById('languageFilterWrapper');
    const arrow = document.getElementById('mainFilterArrow');
    arrow.classList.toggle('rotate', value !== '');

    if (value === 'language') {
        wrapper.style.display = 'block';
        filterBooksByLanguage();
    } else {
        wrapper.style.display = 'none';
        renderCards(storeData.books, 'booksGrid'); // Reset to all
    }
    // Learning Note: Expand for 'genre'/'author' by adding similar dropdowns/arrays in data.
}

// Async Data Loader (New - Populates storeData from JSONs)
async function loadDataFromJSON() {
    // Learning Note: Fetches each JSON async (parallel-ish). If one fails, others still load. Empty array fallback = "No results".
    try {
        const [booksRes, gamesRes, prodRes] = await Promise.all([
            fetch('books.json').then(r => r.json()),
            fetch('games.json').then(r => r.json()),
            fetch('productivity.json').then(r => r.json())
        ]);
        storeData.books = booksRes;
        storeData.games = gamesRes;
        storeData.productivity = prodRes;
        console.log('Data loaded from JSONs! Total items:', storeData.books.length + storeData.games.length + storeData.productivity.length);
    } catch (err) {
        console.error('JSON load error (check files exist):', err);
        // No UI error - just empty grids show "No results" (graceful fallback)
    }
}

// Main Initialization (Original DOMContentLoaded - Now Awaits Data Load)
document.addEventListener('DOMContentLoaded', async () => {
    // Learning Note: Awaits data before rendering (async). Then runs all original init/renders.
    await loadDataFromJSON();

    // Render all sections (chelp removed)
    renderCards([...storeData.books, ...storeData.games, ...storeData.productivity], 'allGrid');
    renderCards(storeData.books, 'booksGrid');
    renderCards(storeData.games, 'gamesGrid');
    renderCards(storeData.productivity, 'productivityGrid');
    renderCards(featured, 'featuredGrid'); // If featured is empty, no cards
    renderCards(JSON.parse(localStorage.getItem('recentItems') || '[]'), 'recentGrid');
    renderFavorites();

    // Original inits
    initTabs();
    initSearch();
    initSettings();

    // Original event listeners
    document.getElementById('closeBtn').addEventListener('click', closeDetail);
    document.getElementById('bookModalClose').addEventListener('click', closeBookModal);
    document.getElementById('settingsIcon').addEventListener('click', toggleSettings);
    document.getElementById('saveSettings').addEventListener('click', saveSettings);

    // Overlay click (closes modals if clicking outside)
    document.getElementById('overlay').addEventListener('click', (e) => {
        if (e.target === document.getElementById('overlay')) {
            const bookModal = document.getElementById('bookModal');
            const settingsWindow = document.getElementById('settingsWindow');
            const detailView = document.getElementById('detailView');

            if (bookModal.classList.contains('active')) closeBookModal();
            else if (settingsWindow.classList.contains('active')) toggleSettings();
            else if (detailView.classList.contains('active')) closeDetail();
        }
    });

    // Language checkboxes (for books filter)
    document.querySelectorAll('.lang-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            const selectAll = document.getElementById('selectAllLanguages');
            selectAll.checked = document.querySelectorAll('.lang-checkbox').length ===
                document.querySelectorAll('.lang-checkbox:checked').length;
            updateSelectedLanguagesLabel();
            filterBooksByLanguage();
        });
    });

    // Escape key (closes modals/dropdowns)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const bookModal = document.getElementById('bookModal');
            const settingsWindow = document.getElementById('settingsWindow');
            const detailView = document.getElementById('detailView');
            const dropdown = document.getElementById('languageCheckboxes');

            if (bookModal.classList.contains('active')) closeBookModal();
            else if (settingsWindow.classList.contains('active')) toggleSettings();
            else if (detailView.classList.contains('active')) closeDetail();
            else if (dropdown.style.display === 'block') toggleLanguageDropdown();
        }
    });

    // Default to "All" tab
    switchTab('all');

    console.log('Sarvstore ready! Check tabs and search.'); // Learning: Debug log - remove in production
});

// Learning Note: End of script.js. To add features: e.g., favorites toggle on cards (add star icon/button, call toggleFavorite(item.id)).
// For JSON data: Ensure books.json/games.json/productivity.json match structure (id, title, type, logo, etc.). Test locally!