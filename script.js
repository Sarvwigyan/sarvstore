// Main Script File: script.js
// This file handles all dynamic behavior: data loading, rendering, interactions, and state management.
// Data is now loaded asynchronously from separate JSON files for better performance (pages load faster, data fetched on demand).
// Comments explain each section to make it easy to learn and modify.

// Global Variables (Friendly Names for Clarity)
// These hold app state and data
let allItems = []; // Combined array of all books, games, productivity items
let booksData = []; // Array for books only
let gamesData = []; // Array for games only
let productivityData = []; // Array for productivity items only
let featuredItems = []; // Hardcoded featured items (you can make this dynamic later)
let recentItems = []; // Recently viewed items from localStorage
let favoriteItems = []; // Favorite items from localStorage
let currentTheme = 'dark'; // Current theme (default dark)
let enableFavoritesTab = false; // Whether favorites tab is enabled

// Hardcoded Featured Items (For now; could load from JSON later)
featuredItems = [
    // Example: Add your featured items here, e.g., { id: 1, title: 'Featured Book', type: 'Books', ... }
    // Placeholder for learning: Replace with real data
];

// Event Listeners Setup Function (Called on Load)
// This initializes all click/keydown handlers
function setupEventListeners() {
    // Detail View Close
    document.getElementById('closeBtn').addEventListener('click', closeDetailView);

    // Book Modal Close
    document.getElementById('bookModalClose').addEventListener('click', closeBookModal);

    // Settings Icon Click
    document.getElementById('settingsIcon').addEventListener('click', toggleSettingsWindow);

    // Save Settings Button
    document.getElementById('saveSettings').addEventListener('click', saveUserSettings);

    // Overlay Click (Closes Topmost Modal)
    document.getElementById('overlay').addEventListener('click', handleOverlayClick);

    // Language Checkbox Changes (For Books Filter)
    document.querySelectorAll('.lang-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', handleLanguageCheckboxChange);
    });

    // Keyboard Escape Key (Closes Modals/Dropdowns)
    document.addEventListener('keydown', handleEscapeKey);
}

// Handle Overlay Click (Close Modals if Clicking Outside)
function handleOverlayClick(event) {
    // Only close if clicking the overlay itself (not a child modal)
    if (event.target === document.getElementById('overlay')) {
        const bookModal = document.getElementById('bookModal');
        const settingsWindow = document.getElementById('settingsWindow');
        const detailView = document.getElementById('detailView');

        // Close in priority order: Book > Settings > Detail
        if (bookModal.classList.contains('active')) {
            closeBookModal();
        } else if (settingsWindow.classList.contains('active')) {
            toggleSettingsWindow();
        } else if (detailView.classList.contains('active')) {
            closeDetailView();
        }
    }
}

// Handle Escape Key Press
function handleEscapeKey(event) {
    if (event.key === 'Escape') {
        const bookModal = document.getElementById('bookModal');
        const settingsWindow = document.getElementById('settingsWindow');
        const detailView = document.getElementById('detailView');
        const languageDropdown = document.getElementById('languageCheckboxes');

        // Close in priority order
        if (bookModal.classList.contains('active')) {
            closeBookModal();
        } else if (settingsWindow.classList.contains('active')) {
            toggleSettingsWindow();
        } else if (detailView.classList.contains('active')) {
            closeDetailView();
        } else if (languageDropdown.style.display === 'block') {
            toggleLanguageDropdown();
        }
    }
}

// Handle Language Checkbox Change
function handleLanguageCheckboxChange(event) {
    const selectAllCheckbox = document.getElementById('selectAllLanguages');
    // Update "Select All" if all are checked/unchecked
    const allLangCheckboxes = document.querySelectorAll('.lang-checkbox');
    const checkedCount = document.querySelectorAll('.lang-checkbox:checked').length;
    selectAllCheckbox.checked = checkedCount === allLangCheckboxes.length;

    updateSelectedLanguagesLabel();
    filterBooksByLanguage();
}

// Load Data from JSON Files Asynchronously
// This uses fetch() for better performance - page loads first, data comes later
async function loadAllData() {
    try {
        // Fetch books.json
        const booksResponse = await fetch('books.json');
        booksData = await booksResponse.json();

        // Fetch games.json
        const gamesResponse = await fetch('games.json');
        gamesData = await gamesResponse.json();

        // Fetch productivity.json
        const productivityResponse = await fetch('productivity.json');
        productivityData = await productivityResponse.json();

        // Combine all for "All" tab
        allItems = [...booksData, ...gamesData, ...productivityData];

        // Now render everything
        renderAllCards();
        renderBooksCards();
        renderGamesCards();
        renderProductivityCards();
        renderFeaturedCards();
        renderRecentCards();
        renderFavoriteCards();

        console.log('All data loaded successfully!'); // For debugging/learning
    } catch (error) {
        console.error('Error loading data:', error); // Handle errors gracefully
        // Fallback: Show error message in UI if needed
        document.getElementById('allNoResults').textContent = 'Error loading data. Please refresh.';
        document.getElementById('allNoResults').style.display = 'block';
    }
}

// Render Function: Generic Card Renderer
// Reusable function to render cards in any grid. Helps avoid code duplication.
function renderCards(itemsToRender, gridId, showNoResults = true) {
    const gridElement = document.getElementById(gridId);
    const noResultsElement = document.getElementById(gridId.replace('Grid', 'NoResults'));

    // Clear existing cards
    gridElement.innerHTML = '';

    if (itemsToRender.length === 0 && showNoResults) {
        noResultsElement.style.display = 'block';
        return;
    }

    if (showNoResults) {
        noResultsElement.style.display = 'none';
    }

    // Create card HTML for each item
    itemsToRender.forEach(item => {
        const cardHtml = createCardHtml(item);
        gridElement.innerHTML += cardHtml;
    });

    // Add click listeners to new cards
    document.querySelectorAll(`#${gridId} .card`).forEach(card => {
        card.addEventListener('click', () => openDetailView(item)); // Use item data
    });
}

// Specific Render Functions (For Clarity)
function renderAllCards() { renderCards(allItems, 'allGrid'); }
function renderBooksCards() { renderCards(booksData, 'booksGrid'); }
function renderGamesCards() { renderCards(gamesData, 'gamesGrid'); }
function renderProductivityCards() { renderCards(productivityData, 'productivityGrid'); }
function renderFeaturedCards() { renderCards(featuredItems, 'featuredGrid', false); } // No "no results" for featured
function renderRecentCards() { renderCards(recentItems, 'recentGrid'); }
function renderFavoriteCards() { renderCards(favoriteItems, 'favoritesGrid'); }

// Create HTML for a Single Card
// This builds the card markup based on item data. Easy to customize.
function createCardHtml(item) {
    const verifiedBadge = item.verified ? '<i class="fas fa-check-circle"></i> Verified' : '';
    return `
        <div class="card" data-item-id="${item.id}" role="button" tabindex="0">
            <img src="${item.logo}" alt="${item.title} logo" class="card-logo">
            <div class="card-title">${item.title}</div>
            <div class="card-type">${item.type} ${verifiedBadge}</div>
            <button class="card-download" onclick="handleCardDownload(event, '${item.file || item.downloadUrl}')">Download</button>
        </div>
    `;
}

// Tab Switching Function
// Handles showing/hiding sections when tabs are clicked.
function switchToTab(tabId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
    });

    // Show selected section and tab
    const targetSection = document.getElementById(tabId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    const targetTab = document.querySelector(`[data-tab="${tabId}"]`);
    if (targetTab) {
        targetTab.classList.add('active');
        targetTab.setAttribute('aria-selected', 'true');
    }

    // Show featured if "all" tab
    if (tabId === 'all') {
        document.querySelector('.featured-section').style.display = 'block';
    } else {
        document.querySelector('.featured-section').style.display = 'none';
    }

    // Show/hide favorites tab based on settings
    const favoritesTab = document.querySelector('[data-tab="favorites"]');
    if (favoritesTab) {
        favoritesTab.classList.toggle('hidden', !enableFavoritesTab);
    }
}

// Initialize Tabs (Add Listeners)
function initTabNavigation() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = tab.getAttribute('data-tab');
            switchToTab(tabId);
        });
        tab.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const tabId = tab.getAttribute('data-tab');
                switchToTab(tabId);
            }
        });
    });
}

// Search Functionality
// Filters cards in current section based on search input.
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', handleSearchInput);
}

function handleSearchInput() {
    const query = searchInput.value.toLowerCase().trim();
    const activeSection = document.querySelector('.section.active');
    if (!activeSection) return;

    let currentItems = [];
    const sectionId = activeSection.id;

    // Get items based on section
    switch (sectionId) {
        case 'all': currentItems = allItems; break;
        case 'books': currentItems = booksData; break;
        case 'games': currentItems = gamesData; break;
        case 'productivity': currentItems = productivityData; break;
        case 'recent': currentItems = recentItems; break;
        case 'favorites': currentItems = favoriteItems; break;
        default: return;
    }

    // Filter items
    const filteredItems = currentItems.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.shortDesc.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query)
    );

    // Re-render with filtered
    renderCards(filteredItems, `${sectionId}Grid`);
}

// Open Detail View for an Item
// Populates and shows the detail modal.
function openDetailView(item) {
    // Populate fields
    document.getElementById('detailLogo').src = item.logo;
    document.getElementById('detailLogo').alt = `${item.title} logo`;
    document.getElementById('detailTitle').textContent = item.title;
    document.getElementById('detailType').textContent = item.type;
    document.getElementById('detailVerified').innerHTML = item.verified ? '<i class="fas fa-check-circle"></i> Verified' : '';
    document.getElementById('detailShortDesc').textContent = item.shortDesc;
    document.getElementById('detailLongDesc').textContent = item.longDesc;

    // Images gallery
    const imagesContainer = document.getElementById('detailImages');
    imagesContainer.innerHTML = '';
    if (item.images && item.images.length > 0) {
        item.images.forEach((imgSrc, index) => {
            const img = document.createElement('img');
            img.src = imgSrc;
            img.alt = item.imageAlts ? item.imageAlts[index] || `${item.title} image ${index + 1}` : `${item.title} image ${index + 1}`;
            img.onclick = () => alert('Zoom feature coming soon!'); // Placeholder
            imagesContainer.appendChild(img);
        });
    }

    // Download button
    const downloadBtn = document.getElementById('detailDownload');
    downloadBtn.onclick = () => handleDownload(item.file || item.downloadUrl);

    // Show modal and overlay
    document.getElementById('detailView').classList.add('active');
    document.getElementById('overlay').classList.add('active');

    // Add to recent (limit to 10)
    addToRecent(item);
}

// Close Detail View
function closeDetailView() {
    document.getElementById('detailView').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
}

// Handle Card/Game Download
// For books, opens PDF in modal; for others, downloads file.
function handleCardDownload(event, fileUrl) {
    event.stopPropagation(); // Prevent card click
    if (!fileUrl) {
        alert('Download link not available yet.'); // Placeholder
        return;
    }

    // Check if it's a book (has .pdf)
    if (fileUrl.includes('.pdf')) {
        openBookModal(fileUrl);
    } else {
        handleDownload(fileUrl);
    }
}

// Generic Download Function
function handleDownload(url) {
    if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = ''; // Use filename from URL
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        alert('Download not available.');
    }
}

// Open Book Modal (PDF Viewer)
function openBookModal(pdfUrl) {
    const iframe = document.getElementById('bookIframe');
    iframe.src = pdfUrl; // Set PDF URL (browser handles PDF)
    document.getElementById('bookModal').classList.add('active');
    document.getElementById('overlay').classList.add('active');
}

// Close Book Modal
function closeBookModal() {
    document.getElementById('bookModal').classList.remove('active');
    document.getElementById('bookIframe').src = ''; // Clear iframe
    document.getElementById('overlay').classList.remove('active');
}

// Add to Recent Items (LocalStorage)
function addToRecent(item) {
    // Remove if already in recent
    recentItems = recentItems.filter(r => r.id !== item.id);
    // Add to front
    recentItems.unshift(item);
    // Limit to 10
    recentItems = recentItems.slice(0, 10);
    // Save to localStorage
    localStorage.setItem('recentItems', JSON.stringify(recentItems));
    // Re-render recent
    renderRecentCards();
}

// Toggle Favorite (Star Icon - Add if Needed)
function toggleFavorite(itemId) {
    const itemIndex = favoriteItems.findIndex(f => f.id === itemId);
    if (itemIndex > -1) {
        favoriteItems.splice(itemIndex, 1); // Remove
    } else {
        const item = allItems.find(i => i.id === itemId);
        if (item) favoriteItems.push(item); // Add
    }
    localStorage.setItem('favoriteItems', JSON.stringify(favoriteItems));
    renderFavoriteCards();
}

// Books Filter Functions
// Toggle Language Dropdown
function toggleLanguageDropdown() {
    const dropdown = document.getElementById('languageCheckboxes');
    const arrow = document.getElementById('langDropdownArrow');
    const isOpen = dropdown.style.display === 'block';
    dropdown.style.display = isOpen ? 'none' : 'block';
    arrow.classList.toggle('rotate', !isOpen);
}

// Toggle All Languages
function toggleAllLanguages(allCheckbox) {
    document.querySelectorAll('.lang-checkbox').forEach(cb => {
        cb.checked = allCheckbox.checked;
    });
    updateSelectedLanguagesLabel();
    filterBooksByLanguage();
}

// Update Selected Languages Label
function updateSelectedLanguagesLabel() {
    const selected = Array.from(document.querySelectorAll('.lang-checkbox:checked'))
        .map(cb => cb.value.charAt(0).toUpperCase() + cb.value.slice(1));
    document.getElementById('selectedLanguagesLabel').textContent =
        selected.length > 0 ? selected.join(', ') : 'Select Language';
}

// Filter Books by Language
function filterBooksByLanguage() {
    const selectedLanguages = Array.from(document.querySelectorAll('.lang-checkbox:checked'))
        .map(cb => cb.value.toLowerCase());
    const filteredBooks = booksData.filter(book =>
        selectedLanguages.length === 0 || selectedLanguages.includes(book.language.toLowerCase())
    );
    renderCards(filteredBooks, 'booksGrid');
}

// Handle Main Books Filter Change
function handleMainFilterChange() {
    const filterValue = document.getElementById('booksFilter').value;
    const languageWrapper = document.getElementById('languageFilterWrapper');
    const mainArrow = document.getElementById('mainFilterArrow');
    mainArrow.classList.toggle('rotate', filterValue !== '');

    // For now, only language filter implemented; expand for genre/author
    if (filterValue === 'language') {
        languageWrapper.style.display = 'block';
        filterBooksByLanguage();
    } else {
        languageWrapper.style.display = 'none';
        renderBooksCards(); // Show all
    }
    // TODO: Add genre/author filters similarly for learning
}

// Settings Functions
// Toggle Settings Window
function toggleSettingsWindow() {
    const settingsWindow = document.getElementById('settingsWindow');
    const overlay = document.getElementById('overlay');
    settingsWindow.classList.toggle('active');
    overlay.classList.toggle('active');

    if (settingsWindow.classList.contains('active')) {
        loadUserSettings(); // Load current settings
    }
}

// Load User Settings from localStorage
function loadUserSettings() {
    currentTheme = localStorage.getItem('appTheme') || 'dark';
    enableFavoritesTab = localStorage.getItem('enableFavorites') === 'true';
    document.body.setAttribute('data-theme', currentTheme);
    document.getElementById('theme').value = currentTheme;
    document.getElementById('enableFavorites').checked = enableFavoritesTab;

    // Update favorites tab visibility
    const favoritesTab = document.querySelector('[data-tab="favorites"]');
    if (favoritesTab) {
        favoritesTab.classList.toggle('hidden', !enableFavoritesTab);
    }
    // Load favorites and recent
    favoriteItems = JSON.parse(localStorage.getItem('favoriteItems') || '[]');
    recentItems = JSON.parse(localStorage.getItem('recentItems') || '[]');
    renderFavoriteCards();
    renderRecentCards();
}

// Save User Settings
function saveUserSettings() {
    currentTheme = document.getElementById('theme').value;
    enableFavoritesTab = document.getElementById('enableFavorites').checked;

    // Apply theme
    document.body.setAttribute('data-theme', currentTheme);

    // Save to localStorage
    localStorage.setItem('appTheme', currentTheme);
    localStorage.setItem('enableFavorites', enableFavoritesTab.toString());

    // Update UI
    const favoritesTab = document.querySelector('[data-tab="favorites"]');
    if (favoritesTab) {
        favoritesTab.classList.toggle('hidden', !enableFavoritesTab);
    }

    // Close settings
    toggleSettingsWindow();

    console.log('Settings saved!'); // For learning
}

// Initialize Everything on Page Load
// This runs when DOM is ready.
document.addEventListener('DOMContentLoaded', () => {
    // Load data first
    loadAllData();

    // Setup listeners
    setupEventListeners();
    initTabNavigation();
    initSearch();

    // Load initial settings
    loadUserSettings();

    // Default to "All" tab
    switchToTab('all');

    console.log('Sarvstore initialized! Check console for data.'); // For debugging
});