// Global Data Object (Now only Books and Journals)
const storeData = {
    books: [], // Populated from books.json
    journals: [] // Populated from journals.json
};

// NEW: Global Counter for Nested Scroll Locks
let scrollLockCount = 0;

// NEW: Function to Add Item to Recently Viewed
function addToRecentItems(item) {
    let recentItems = JSON.parse(localStorage.getItem('recentItems') || '[]');
    
    // Remove if already exists (to avoid duplicates)
    recentItems = recentItems.filter(recentItem => recentItem.id !== item.id);
    
    // Add to beginning of array (most recent first)
    recentItems.unshift(item);
    
    // Keep only last 10 items
    recentItems = recentItems.slice(0, 10);
    
    // Save back to localStorage
    localStorage.setItem('recentItems', JSON.stringify(recentItems));
    
    // Update recent grid if we're on the recent tab
    if (document.getElementById('recent').classList.contains('active')) {
        renderCards(recentItems, 'recentGrid');
    }
}

// Updated Helpers for Scroll Lock (Now Handles Nesting with Reference Counting)
function lockBodyScroll() {
    scrollLockCount++;
    if (scrollLockCount === 1) {
        document.body.classList.add('modal-open');
    }
}

function unlockBodyScroll() {
    scrollLockCount = Math.max(0, scrollLockCount - 1);
    if (scrollLockCount === 0) {
        document.body.classList.remove('modal-open');
    }
}

// Function to Render Cards in a Grid (Updated: Always show "Read" button)
function renderCards(items, gridId) {
    const grid = document.getElementById(gridId);
    const noResults = document.getElementById(gridId.replace('Grid', 'NoResults')) || null;
    
    // NEW: Hide loading indicator when rendering books
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (gridId === 'booksGrid' && loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }

    grid.innerHTML = ''; // Clear existing cards

    if (items.length === 0) {
        if (noResults) noResults.style.display = 'block';
        return;
    }

    if (noResults) noResults.style.display = 'none';

    items.forEach(item => {
        // UPDATED: Always show "Read" button for all educational content
        const cardHtml = `
            <div class="card" data-item-id="${item.id}" role="button" tabindex="0">
                <img src="${item.logo}" alt="${item.title} logo" class="card-logo" onerror="this.src='https://via.placeholder.com/80?text=Logo'">
                <div class="card-title">${item.title}</div>
                <div class="card-type">${item.type}${item.verified ? ' <i class="fas fa-check-circle" style="color: #4caf50;"></i> Verified' : ''}</div>
                <button class="card-download" onclick="handleDownloadClick(event, '${item.file || item.downloadUrl || ''}')">Read</button>
            </div>
        `;
        grid.innerHTML += cardHtml;
    });

    // Add click listeners to cards for detail view
    document.querySelectorAll(`#${gridId} .card`).forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.card-download')) {
                const itemId = card.dataset.itemId;
                const item = [...storeData.books, ...storeData.journals].find(i => i.id == itemId);
                if (item) openDetail(item);
            }
        });
    });
}

// Tab Switching Function (Updated: Refresh Recent Tab when switching to it)
function switchTab(tabId) {
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

    // NEW: Refresh recent items when switching to recent tab
    if (tabId === 'recent') {
        const recentItems = JSON.parse(localStorage.getItem('recentItems') || '[]');
        renderCards(recentItems, 'recentGrid');
    }
}

// Initialize Tabs
function initTabs() {
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

// Search Initialization (Updated for new sections)
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        const activeSectionId = document.querySelector('.section.active').id;
        let items = [];

        // Get items based on active tab
        switch (activeSectionId) {
            case 'all': items = [...storeData.books, ...storeData.journals]; break;
            case 'books': items = storeData.books; break;
            case 'journals': items = storeData.journals; break;
            case 'recent': items = JSON.parse(localStorage.getItem('recentItems') || '[]'); break;
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

// Settings Initialization
function initSettings() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.body.dataset.theme = theme;
    document.getElementById('theme').value = theme;
}

// Toggle Settings Modal
function toggleSettings() {
    const settingsWindow = document.getElementById('settingsWindow');
    const overlay = document.getElementById('overlay');
    const wasOpen = settingsWindow.classList.contains('active');
    settingsWindow.classList.toggle('active');
    overlay.classList.toggle('active');

    if (!wasOpen) {
        lockBodyScroll();
        history.pushState({ modal: 'settings' }, '', '#settings');
    } else {
        unlockBodyScroll();
        history.replaceState(null, '', window.location.pathname);
    }
}

// Save Settings
function saveSettings() {
    const theme = document.getElementById('theme').value;

    localStorage.setItem('theme', theme);
    document.body.dataset.theme = theme;

    toggleSettings();
}

// Open Detail Modal (Updated: Always shows "Read" button)
function openDetail(item) {
    addToRecentItems(item);

    document.getElementById('detailLogo').src = item.logo;
    document.getElementById('detailLogo').alt = `${item.title} logo`;
    document.getElementById('detailTitle').textContent = item.title;
    document.getElementById('detailType').textContent = item.type;
    document.getElementById('detailVerified').innerHTML = item.verified ? '<i class="fas fa-check-circle" style="color: #4caf50;"></i> Verified' : '';
    document.getElementById('detailShortDesc').textContent = item.shortDesc || '';
    document.getElementById('detailLongDesc').textContent = item.longDesc || '';

    // Images
    const imagesDiv = document.getElementById('detailImages');
    imagesDiv.innerHTML = '';
    if (item.images && item.images.length > 0) {
        item.images.forEach((src, idx) => {
            const img = document.createElement('img');
            img.src = src;
            img.alt = item.imageAlts ? (item.imageAlts[idx] || `${item.title} image ${idx + 1}`) : `${item.title} image ${idx + 1}`;
            img.style.cursor = 'pointer';
            img.onclick = () => window.open(src, '_blank');
            imagesDiv.appendChild(img);
        });
    }

    // UPDATED: Always show "Read" button for detail view
    const detailButton = document.getElementById('detailDownload');
    detailButton.textContent = 'Read';

    // Read button
    detailButton.onclick = () => handleDownloadClick(null, item.file || item.downloadUrl || '');

    // Show modal + Lock scroll + Push history state
    document.getElementById('detailView').classList.add('active');
    document.getElementById('overlay').classList.add('active');
    lockBodyScroll();
    history.pushState({ modal: 'detail' }, '', '#detail');
}

// Close Detail Modal
function closeDetail() {
    document.getElementById('detailView').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
    unlockBodyScroll();
    history.replaceState(null, '', window.location.pathname);
}

// Handle Download Click (Updated: Always "Read" functionality)
function handleDownloadClick(event, url) {
    if (event) event.stopPropagation();
    
    // Add to recent items
    if (event) {
        const card = event.target.closest('.card');
        if (card) {
            const itemId = card.dataset.itemId;
            const item = [...storeData.books, ...storeData.journals].find(i => i.id == itemId);
            if (item) {
                addToRecentItems(item);
            }
        }
    }
    
    if (!url) {
        alert('Content not available yet.');
        return;
    }
    
    // Open content in modal iframe (for PDFs and archive.org content)
    document.getElementById('bookIframe').src = url;
    document.getElementById('bookModal').classList.add('active');
    document.getElementById('overlay').classList.add('active');
    lockBodyScroll();
    history.pushState({ modal: 'book' }, '', '#book');
}

// Close Book Modal
function closeBookModal() {
    document.getElementById('bookModal').classList.remove('active');
    document.getElementById('bookIframe').src = '';
    document.getElementById('overlay').classList.remove('active');
    unlockBodyScroll();
    history.replaceState(null, '', window.location.pathname);
}

// Books Filter Functions
function toggleLanguageDropdown() {
    const dropdown = document.getElementById('languageCheckboxes');
    const arrow = document.getElementById('langDropdownArrow');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    arrow.classList.toggle('rotate');
}

function toggleAllLanguages(checkbox) {
    document.querySelectorAll('.lang-checkbox').forEach(cb => cb.checked = checkbox.checked);
    updateSelectedLanguagesLabel();
    filterBooksByLanguage();
}

function updateSelectedLanguagesLabel() {
    const checked = document.querySelectorAll('.lang-checkbox:checked');
    const labels = Array.from(checked).map(cb => cb.value.charAt(0).toUpperCase() + cb.value.slice(1)).join(', ');
    document.getElementById('selectedLanguagesLabel').textContent = labels || 'Select Language';
}

function filterBooksByLanguage() {
    const selected = Array.from(document.querySelectorAll('.lang-checkbox:checked')).map(cb => cb.value.toLowerCase());
    let filtered = storeData.books;
    if (selected.length > 0) {
        filtered = storeData.books.filter(book => selected.includes((book.language || '').toLowerCase()));
    }
    renderCards(filtered, 'booksGrid');
}

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
        renderCards(storeData.books, 'booksGrid');
    }
}

// Async Data Loader (Updated for Journals)
async function loadDataFromJSON() {
    try {
        const [booksRes, journalsRes] = await Promise.all([
            fetch('books.json').then(r => r.json()),
            fetch('journals.json').then(r => r.json())
        ]);
        storeData.books = booksRes;
        storeData.journals = journalsRes;
        console.log('Data loaded from JSONs! Total items:', storeData.books.length + storeData.journals.length);
    } catch (err) {
        console.error('JSON load error (check files exist):', err);
    }
}

// Main Initialization
document.addEventListener('DOMContentLoaded', async () => {
    await loadDataFromJSON();

    // Render all sections
    renderCards([...storeData.books, ...storeData.journals], 'allGrid');
    renderCards(storeData.books, 'booksGrid');
    renderCards(storeData.journals, 'journalsGrid');
    
    // Initialize recent items from localStorage
    const recentItems = JSON.parse(localStorage.getItem('recentItems') || '[]');
    renderCards(recentItems, 'recentGrid');

    // Original inits
    initTabs();
    initSearch();
    initSettings();

    // Event listeners
    document.getElementById('closeBtn').addEventListener('click', closeDetail);
    document.getElementById('bookModalClose').addEventListener('click', closeBookModal);
    document.getElementById('settingsIcon').addEventListener('click', toggleSettings);
    document.getElementById('saveSettings').addEventListener('click', saveSettings);

    // FIXED: Overlay click handler - checks ALL modals independently
    document.getElementById('overlay').addEventListener('click', (e) => {
        if (e.target === document.getElementById('overlay')) {
            // Check each modal independently and close if active
            if (document.getElementById('bookModal').classList.contains('active')) {
                closeBookModal();
            }
            if (document.getElementById('detailView').classList.contains('active')) {
                closeDetail();
            }
            if (document.getElementById('settingsWindow').classList.contains('active')) {
                toggleSettings();
            }
        }
    });

    // Language checkboxes
    document.querySelectorAll('.lang-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            const selectAll = document.getElementById('selectAllLanguages');
            selectAll.checked = document.querySelectorAll('.lang-checkbox').length ===
                document.querySelectorAll('.lang-checkbox:checked').length;
            updateSelectedLanguagesLabel();
            filterBooksByLanguage();
        });
    });

    // Handle Browser Back/Forward
    window.addEventListener('popstate', (event) => {
        // Check each modal independently and close if active
        if (document.getElementById('bookModal').classList.contains('active')) {
            closeBookModal();
        }
        if (document.getElementById('detailView').classList.contains('active')) {
            closeDetail();
        }
        if (document.getElementById('settingsWindow').classList.contains('active')) {
            toggleSettings();
        }
    });

    // Escape key (closes modals/dropdowns)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Check each modal independently and close if active
            if (document.getElementById('bookModal').classList.contains('active')) {
                closeBookModal();
            } else if (document.getElementById('detailView').classList.contains('active')) {
                closeDetail();
            } else if (document.getElementById('settingsWindow').classList.contains('active')) {
                toggleSettings();
            } else if (document.getElementById('languageCheckboxes').style.display === 'block') {
                toggleLanguageDropdown();
            }
        }
    });

    // Default to "All" tab
    switchTab('all');

    console.log('Sarvstore ready! Now focused on educational content.');
});