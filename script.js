// ===========================
// GLOBAL STATE & CONFIG
// ===========================
const storeData = {
    books: [],
    games: [],
    productivity: [],
    wallpapers: []
};

// Track loaded items per category
const loadedCount = {
    all: 0,
    books: 0,
    games: 0,
    productivity: 0,
    wallpapers: 0
};

const CHUNK_SIZE = 20; // Items to load each time
let currentTab = "all";
let scrollLockCount = 0;
let isLoading = false;

// ===========================
// SCROLL LOCK FUNCTIONS
// ===========================
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

// ===========================
// LOAD JSON DATA
// ===========================
async function loadDataFromJSON() {
    try {
        const [booksRes, gamesRes, prodRes, wallpapersRes] = await Promise.all([
            fetch('books.json').then(r => r.json()).catch(() => []),
            fetch('games.json').then(r => r.json()).catch(() => []),
            fetch('productivity.json').then(r => r.json()).catch(() => []),
            fetch('wallpapers.json').then(r => r.json()).catch(() => [])
        ]);

        storeData.books = booksRes;
        storeData.games = gamesRes;
        storeData.productivity = prodRes;
        storeData.wallpapers = wallpapersRes;
        
        // Combine all items for "All" tab
        storeData.all = [...booksRes, ...gamesRes, ...prodRes, ...wallpapersRes];
        
        console.log('Data loaded successfully!');
        initializeApp();
    } catch (err) {
        console.error('Error loading JSON files:', err);
        initializeApp(); // Still initialize with empty data
    }
}

// ===========================
// CARD RENDERING (INFINITE SCROLL READY)
// ===========================
function renderCardsAppend(items, gridId) {
    const grid = document.getElementById(gridId);
    const noResults = document.getElementById(gridId.replace('Grid', 'NoResults'));

    // Show no results if empty
    if (items.length === 0) {
        if (noResults) noResults.style.display = 'block';
        return;
    }

    if (noResults) noResults.style.display = 'none';

    items.forEach(item => {
        const buttonText = item.type === 'Books' ? 'Read' : 'Download';
        
        const cardHtml = `
            <div class="card" data-item-id="${item.id}" role="button" tabindex="0">
                <img src="${item.logo}" alt="${item.title} logo" class="card-logo" loading="lazy" onerror="this.src='https://via.placeholder.com/80?text=Logo'">
                <div class="card-title">${item.title}</div>
                <div class="card-type">${item.type}${item.verified ? ' <i class="fas fa-check-circle" style="color: #4caf50;"></i> Verified' : ''}</div>
                <button class="card-download" onclick="handleDownloadClick(event, '${item.file || item.downloadUrl || ''}')">${buttonText}</button>
            </div>
        `;
        grid.innerHTML += cardHtml;
    });

    // Add click listeners to new cards
    document.querySelectorAll(`#${gridId} .card`).forEach(card => {
        if (!card.hasAttribute('data-click-bound')) {
            card.setAttribute('data-click-bound', 'true');
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.card-download')) {
                    const itemId = card.dataset.itemId;
                    const item = storeData.all.find(i => i.id == itemId);
                    if (item) openDetail(item);
                }
            });
        }
    });
}

// ===========================
// INFINITE SCROLL LOGIC
// ===========================
function loadMoreItems() {
    if (isLoading) return;
    
    const category = currentTab;
    const currentCount = loadedCount[category];
    const allItems = storeData[category];
    
    if (currentCount >= allItems.length) return; // All items loaded
    
    isLoading = true;
    
    // Show loading indicator
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    
    // Simulate slight delay for smoothness (remove in production)
    setTimeout(() => {
        const nextChunk = allItems.slice(currentCount, currentCount + CHUNK_SIZE);
        renderCardsAppend(nextChunk, `${category}Grid`);
        
        loadedCount[category] += nextChunk.length;
        isLoading = false;
        
        // Hide loading indicator
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        
        console.log(`Loaded ${nextChunk.length} more ${category} items. Total: ${loadedCount[category]}/${allItems.length}`);
    }, 300);
}

function initInfiniteScroll() {
    let scrollTimer;
    
    window.addEventListener('scroll', () => {
        // Throttle scroll events
        if (scrollTimer) return;
        
        scrollTimer = setTimeout(() => {
            const scrollPosition = window.innerHeight + window.scrollY;
            const pageHeight = document.body.offsetHeight;
            const threshold = 500; // Load when 500px from bottom
            
            if (scrollPosition >= pageHeight - threshold) {
                loadMoreItems();
            }
            
            scrollTimer = null;
        }, 100);
    });
}

function resetInfiniteScroll(category) {
    loadedCount[category] = 0;
    const grid = document.getElementById(`${category}Grid`);
    if (grid) grid.innerHTML = '';
}

// ===========================
// TAB MANAGEMENT
// ===========================
function switchTab(tabId) {
    currentTab = tabId;
    
    // Hide all sections, show active
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

    // Reset and load first chunk for this tab
    resetInfiniteScroll(tabId);
    loadMoreItems();
    
    // Show featured only for "all"
    document.querySelector('.featured-section').style.display = tabId === 'all' ? 'block' : 'none';
}

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

// ===========================
// SEARCH FUNCTIONALITY
// ===========================
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    let searchTimer;

    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            performSearch();
        }, 300);
    });
}

function performSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const category = currentTab;
    
    if (!query) {
        // Reset to normal infinite scroll
        resetInfiniteScroll(category);
        loadMoreItems();
        return;
    }
    
    const allItems = storeData[category];
    const filtered = allItems.filter(item =>
        item.title.toLowerCase().includes(query) ||
        (item.shortDesc && item.shortDesc.toLowerCase().includes(query)) ||
        item.type.toLowerCase().includes(query)
    );
    
    // For search results, show all matches at once (no infinite scroll)
    const grid = document.getElementById(`${category}Grid`);
    const noResults = document.getElementById(`${category}NoResults`);
    
    grid.innerHTML = '';
    
    if (filtered.length === 0) {
        if (noResults) noResults.style.display = 'block';
    } else {
        if (noResults) noResults.style.display = 'none';
        renderCardsAppend(filtered, `${category}Grid`);
    }
}

// ===========================
// MODAL FUNCTIONS (Your existing modals)
// ===========================
function openDetail(item) {
    // Your existing detail modal code
    document.getElementById('detailLogo').src = item.logo;
    document.getElementById('detailTitle').textContent = item.title;
    document.getElementById('detailType').textContent = item.type;
    document.getElementById('detailVerified').innerHTML = item.verified ? '<i class="fas fa-check-circle" style="color: #4caf50;"></i> Verified' : '';
    document.getElementById('detailShortDesc').textContent = item.shortDesc || '';
    document.getElementById('detailLongDesc').textContent = item.longDesc || '';

    const buttonText = item.type === 'Books' ? 'Read' : 'Download';
    const detailButton = document.getElementById('detailDownload');
    detailButton.textContent = buttonText;
    detailButton.onclick = () => handleDownloadClick(null, item.file || item.downloadUrl || '');

    document.getElementById('detailView').classList.add('active');
    document.getElementById('overlay').classList.add('active');
    lockBodyScroll();
    history.pushState({ modal: 'detail' }, '', '#detail');
}

function closeDetail() {
    document.getElementById('detailView').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
    unlockBodyScroll();
    history.replaceState(null, '', window.location.pathname);
}

function handleDownloadClick(event, url) {
    if (event) event.stopPropagation();
    if (!url) {
        alert('Download not available yet.');
        return;
    }
    if (url.includes('.pdf')) {
        document.getElementById('bookIframe').src = url;
        document.getElementById('bookModal').classList.add('active');
        document.getElementById('overlay').classList.add('active');
        lockBodyScroll();
        history.pushState({ modal: 'book' }, '', '#book');
    } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

function closeBookModal() {
    document.getElementById('bookModal').classList.remove('active');
    document.getElementById('bookIframe').src = '';
    document.getElementById('overlay').classList.remove('active');
    unlockBodyScroll();
    history.replaceState(null, '', window.location.pathname);
}

// ===========================
// SETTINGS FUNCTIONS
// ===========================
function initSettings() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.body.dataset.theme = theme;
    document.getElementById('theme').value = theme;
}

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

function saveSettings() {
    const theme = document.getElementById('theme').value;
    localStorage.setItem('theme', theme);
    document.body.dataset.theme = theme;
    toggleSettings();
}

// ===========================
// BOOKS FILTER FUNCTIONS
// ===========================
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
    
    // For filtered results, show all at once
    const grid = document.getElementById('booksGrid');
    grid.innerHTML = '';
    renderCardsAppend(filtered, 'booksGrid');
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
        // Reset to infinite scroll
        resetInfiniteScroll('books');
        loadMoreItems();
    }
}

// ===========================
// INITIALIZE APP
// ===========================
function initializeApp() {
    // Load first chunk for all tabs
    Object.keys(loadedCount).forEach(tab => {
        resetInfiniteScroll(tab);
    });
    
    // Load initial items for current tab
    loadMoreItems();
    
    // Initialize all systems
    initTabs();
    initSearch();
    initSettings();
    initInfiniteScroll();
    
    // Event listeners
    document.getElementById('closeBtn').addEventListener('click', closeDetail);
    document.getElementById('bookModalClose').addEventListener('click', closeBookModal);
    document.getElementById('settingsIcon').addEventListener('click', toggleSettings);
    document.getElementById('saveSettings').addEventListener('click', saveSettings);

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

    document.querySelectorAll('.lang-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            const selectAll = document.getElementById('selectAllLanguages');
            selectAll.checked = document.querySelectorAll('.lang-checkbox').length ===
                document.querySelectorAll('.lang-checkbox:checked').length;
            updateSelectedLanguagesLabel();
            filterBooksByLanguage();
        });
    });

    window.addEventListener('popstate', (event) => {
        const bookModal = document.getElementById('bookModal');
        const detailView = document.getElementById('detailView');
        const settingsWindow = document.getElementById('settingsWindow');

        if (bookModal.classList.contains('active')) {
            closeBookModal();
        } else if (detailView.classList.contains('active')) {
            closeDetail();
        } else if (settingsWindow.classList.contains('active')) {
            toggleSettings();
        }
    });

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

    // Start with All tab
    switchTab('all');
    
    console.log('Sarvstore optimized with infinite scroll! 🚀');
}

// ===========================
// START THE APPLICATION
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    loadDataFromJSON();
});