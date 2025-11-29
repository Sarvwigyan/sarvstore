// Global Data Object
const storeData = {
    books: [],
    journals: []
};

// Enhanced Book Reader System
class EnhancedBookReader {
    constructor() {
        this.currentBook = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.isLoading = false;
        
        // User data
        this.userLibrary = this.getUserLibrary();
        this.readingSession = null;
        
        this.init();
    }
    
    init() {
        this.createReaderHTML();
        this.bindEvents();
        this.loadUserData();
    }
    
    createReaderHTML() {
        const readerHTML = `
            <div class="enhanced-book-reader" id="enhancedBookReader">
                <!-- Reader Header -->
                <div class="reader-header">
                    <div class="reader-book-info">
                        <h3 id="readerBookTitle">Loading Book...</h3>
                        <div class="reading-progress">
                            <span id="currentPage">Page 1</span>
                            <span id="totalPages">of ?</span>
                        </div>
                    </div>
                    
                    <div class="reader-controls">
                        <!-- Navigation -->
                        <button class="reader-btn" id="prevPage">
                            <span>← Prev</span>
                        </button>
                        
                        <input type="number" id="pageJump" min="1" value="1" class="page-input">
                        
                        <button class="reader-btn" id="nextPage">
                            <span>Next →</span>
                        </button>
                        
                        <!-- Zoom -->
                        <button class="reader-btn" id="zoomOut">
                            <span>Zoom -</span>
                        </button>
                        
                        <button class="reader-btn" id="zoomIn">
                            <span>Zoom +</span>
                        </button>
                        
                        <!-- Bookmark -->
                        <button class="reader-btn bookmark-btn" id="toggleBookmark">
                            <span>Bookmark</span>
                        </button>
                        
                        <!-- Collections -->
                        <button class="reader-btn" id="showCollections">
                            <span>Collections</span>
                        </button>
                        
                        <!-- Close -->
                        <button class="reader-btn" id="closeReader">
                            <span>Close</span>
                        </button>
                    </div>
                </div>
                
                <!-- Main Content -->
                <div class="reader-main">
                    <!-- PDF Viewer -->
                    <div class="pdf-viewer-container" id="pdfViewer">
                        <div class="page-navigation-overlay">
                            <button class="nav-arrow left-arrow">‹</button>
                            <button class="nav-arrow right-arrow">›</button>
                        </div>
                        <iframe id="bookIframe" class="book-iframe" title="Book viewer" style="width: 100%; height: 100%; border: none;"></iframe>
                    </div>
                    
                    <!-- Sidebar -->
                    <div class="reader-sidebar" id="readerSidebar">
                        <div class="sidebar-tabs">
                            <button class="tab-btn active" data-tab="bookmarks">Bookmarks</button>
                            <button class="tab-btn" data-tab="notes">Notes</button>
                            <button class="tab-btn" data-tab="collections">Collections</button>
                        </div>
                        
                        <div class="tab-content">
                            <!-- Bookmarks Tab -->
                            <div class="tab-pane active" id="bookmarksTab">
                                <div class="bookmarks-list" id="bookmarksList">
                                    <div class="no-items">No bookmarks yet</div>
                                </div>
                                <button class="reader-btn" id="addBookmark" style="width: 100%; margin-top: 1rem;">
                                    Add Current Page Bookmark
                                </button>
                            </div>
                            
                            <!-- Notes Tab -->
                            <div class="tab-pane" id="notesTab">
                                <textarea 
                                    id="currentNote" 
                                    placeholder="Add your notes for the current book here..."
                                    style="width: 100%; height: 120px; margin-bottom: 1rem; padding: 0.5rem; border-radius: 8px; background: rgba(255,255,255,0.1); color: var(--text); border: var(--border);"
                                ></textarea>
                                <button class="reader-btn" id="saveNote" style="width: 100%; margin-bottom: 1rem;">
                                    Save Note
                                </button>
                                <div class="notes-list" id="notesList">
                                    <div class="no-items">No notes yet</div>
                                </div>
                            </div>
                            
                            <!-- Collections Tab -->
                            <div class="tab-pane" id="collectionsTab">
                                <div class="collection-grid" style="display: grid; gap: 0.5rem;">
                                    <div class="collection-card" data-collection="currently-reading">
                                        <div class="collection-icon">📖</div>
                                        <div>Currently Reading</div>
                                        <div class="collection-count">0 books</div>
                                    </div>
                                    <div class="collection-card" data-collection="want-to-read">
                                        <div class="collection-icon">📚</div>
                                        <div>Want to Read</div>
                                        <div class="collection-count">0 books</div>
                                    </div>
                                    <div class="collection-card" data-collection="finished">
                                        <div class="collection-icon">✅</div>
                                        <div>Finished</div>
                                        <div class="collection-count">0 books</div>
                                    </div>
                                    <div class="collection-card" data-collection="favorites">
                                        <div class="collection-icon">⭐</div>
                                        <div>Favorites</div>
                                        <div class="collection-count">0 books</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="reader-footer">
                    <div class="reading-stats">
                        <span>Reading Time: <span id="readingTime">0m</span></span>
                        <span>Progress: 
                            <div class="progress-bar">
                                <div class="progress-fill" id="progressFill" style="width: 0%"></div>
                            </div>
                            <span id="completionPercentage">0%</span>
                        </span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', readerHTML);
    }
    
    bindEvents() {
        // Navigation
        document.getElementById('prevPage').addEventListener('click', () => this.previousPage());
        document.getElementById('nextPage').addEventListener('click', () => this.nextPage());
        document.getElementById('pageJump').addEventListener('change', (e) => this.jumpToPage(parseInt(e.target.value)));
        
        // Zoom
        document.getElementById('zoomIn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOut').addEventListener('click', () => this.zoomOut());
        
        // Bookmarking
        document.getElementById('toggleBookmark').addEventListener('click', () => this.toggleBookmark());
        document.getElementById('addBookmark').addEventListener('click', () => this.addBookmark());
        
        // Notes
        document.getElementById('saveNote').addEventListener('click', () => this.saveNote());
        
        // Collections
        document.getElementById('showCollections').addEventListener('click', () => this.toggleSidebar());
        
        // Close reader
        document.getElementById('closeReader').addEventListener('click', () => this.closeReader());
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Collection cards
        document.querySelectorAll('.collection-card').forEach(card => {
            card.addEventListener('click', () => this.toggleCollection(card.dataset.collection));
        });
        
        // Overlay navigation
        document.querySelector('.left-arrow').addEventListener('click', () => this.previousPage());
        document.querySelector('.right-arrow').addEventListener('click', () => this.nextPage());
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }
    
    async openBook(bookData) {
        this.currentBook = bookData;
        this.readingSession = {
            bookId: bookData.id,
            startTime: Date.now(),
            readingTime: 0
        };
        
        // Show reader
        document.getElementById('enhancedBookReader').classList.add('active');
        document.body.classList.add('modal-open');
        
        // Load book progress
        const progress = this.getBookProgress(bookData.id);
        this.currentPage = progress?.page || 1;
        
        // Update UI
        document.getElementById('readerBookTitle').textContent = bookData.title;
        document.getElementById('pageJump').value = this.currentPage;
        
        // Load actual book content
        await this.loadBookContent(bookData);
        
        // Start reading session
        this.startReadingSession();
        
        // Load bookmarks and notes
        this.loadBookmarks();
        this.loadNotes();
        this.updateCollectionsDisplay();
    }
    
    async loadBookContent(bookData) {
        this.isLoading = true;
        
        const iframe = document.getElementById('bookIframe');
        iframe.src = bookData.file || bookData.downloadUrl || '';
        
        // For PDF files, we'll use the browser's built-in PDF viewer
        // For archive.org links, they'll open in the iframe
        
        // Simulate loading completion
        iframe.onload = () => {
            this.isLoading = false;
            this.setupScrollTracking();
            this.updateProgress();
        };
        
        // Set a timeout in case iframe doesn't load properly
        setTimeout(() => {
            this.isLoading = false;
            this.updateProgress();
        }, 2000);
    }
    
    setupScrollTracking() {
        const iframe = document.getElementById('bookIframe');
        let scrollTimeout;
        
        try {
            // Try to track scroll position
            iframe.contentWindow.addEventListener('scroll', () => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    this.saveProgress();
                }, 1000);
            });
        } catch (error) {
            // Cross-origin restrictions - use fallback
            console.log('Using fallback progress tracking');
        }
    }
    
    nextPage() {
        const iframe = document.getElementById('bookIframe');
        try {
            iframe.contentWindow.scrollBy(0, window.innerHeight * 0.8);
            this.saveProgress();
        } catch (error) {
            // Fallback: just save progress
            this.saveProgress();
        }
    }
    
    previousPage() {
        const iframe = document.getElementById('bookIframe');
        try {
            iframe.contentWindow.scrollBy(0, -window.innerHeight * 0.8);
            this.saveProgress();
        } catch (error) {
            // Fallback: just save progress
            this.saveProgress();
        }
    }
    
    jumpToPage(page) {
        if (page >= 1) {
            this.currentPage = page;
            const iframe = document.getElementById('bookIframe');
            try {
                const scrollPosition = (page - 1) * window.innerHeight;
                iframe.contentWindow.scrollTo(0, scrollPosition);
                this.saveProgress();
            } catch (error) {
                this.saveProgress();
            }
        }
    }
    
    zoomIn() {
        const iframe = document.getElementById('bookIframe');
        try {
            // Try to zoom by adjusting iframe transform
            const currentZoom = parseFloat(iframe.style.transform?.replace('scale(', '') || 1);
            const newZoom = Math.min(currentZoom + 0.25, 3);
            iframe.style.transform = `scale(${newZoom})`;
        } catch (error) {
            this.showNotification('Zoom not available for this content');
        }
    }
    
    zoomOut() {
        const iframe = document.getElementById('bookIframe');
        try {
            const currentZoom = parseFloat(iframe.style.transform?.replace('scale(', '') || 1);
            const newZoom = Math.max(currentZoom - 0.25, 0.5);
            iframe.style.transform = `scale(${newZoom})`;
        } catch (error) {
            this.showNotification('Zoom not available for this content');
        }
    }
    
    toggleBookmark() {
        const bookmarks = this.getBookBookmarks(this.currentBook.id);
        const iframe = document.getElementById('bookIframe');
        
        try {
            const scrollY = iframe.contentWindow.scrollY || iframe.contentDocument.documentElement.scrollTop;
            const page = Math.floor(scrollY / window.innerHeight) + 1;
            
            const existingBookmark = bookmarks.find(b => b.page === page);
            
            if (existingBookmark) {
                this.removeBookmark(existingBookmark.id);
                this.showNotification('Bookmark removed');
            } else {
                this.addBookmarkAtPage(page);
                this.showNotification('Bookmark added');
            }
        } catch (error) {
            this.showNotification('Could not add bookmark');
        }
    }
    
    addBookmark() {
        const iframe = document.getElementById('bookIframe');
        try {
            const scrollY = iframe.contentWindow.scrollY || iframe.contentDocument.documentElement.scrollTop;
            const page = Math.floor(scrollY / window.innerHeight) + 1;
            this.addBookmarkAtPage(page);
            this.showNotification('Bookmark added to page ' + page);
        } catch (error) {
            this.showNotification('Could not add bookmark');
        }
    }
    
    addBookmarkAtPage(page, notes = '') {
        const bookmark = {
            id: Date.now().toString(),
            bookId: this.currentBook.id,
            page: page,
            notes: notes,
            created: new Date().toISOString()
        };
        
        let bookmarks = this.getBookBookmarks(this.currentBook.id);
        bookmarks.push(bookmark);
        this.saveBookBookmarks(this.currentBook.id, bookmarks);
        
        this.loadBookmarks();
    }
    
    removeBookmark(bookmarkId) {
        let bookmarks = this.getBookBookmarks(this.currentBook.id);
        bookmarks = bookmarks.filter(b => b.id !== bookmarkId);
        this.saveBookBookmarks(this.currentBook.id, bookmarks);
        
        this.loadBookmarks();
    }
    
    saveNote() {
        const noteText = document.getElementById('currentNote').value.trim();
        if (!noteText) {
            this.showNotification('Please enter a note');
            return;
        }
        
        const note = {
            id: Date.now().toString(),
            bookId: this.currentBook.id,
            text: noteText,
            created: new Date().toISOString()
        };
        
        let notes = this.getBookNotes(this.currentBook.id);
        notes.push(note);
        
        this.saveBookNotes(this.currentBook.id, notes);
        this.loadNotes();
        
        // Clear textarea
        document.getElementById('currentNote').value = '';
        
        this.showNotification('Note saved!');
    }
    
    loadBookmarks() {
        const bookmarks = this.getBookBookmarks(this.currentBook.id);
        const container = document.getElementById('bookmarksList');
        
        if (bookmarks.length === 0) {
            container.innerHTML = '<div class="no-items">No bookmarks yet</div>';
            return;
        }
        
        container.innerHTML = bookmarks.map(bookmark => `
            <div class="bookmark-item" data-page="${bookmark.page}">
                <div>
                    <div class="bookmark-page">Page ${bookmark.page}</div>
                    ${bookmark.notes ? `<div class="bookmark-notes">${bookmark.notes}</div>` : ''}
                </div>
                <button class="delete-bookmark" data-id="${bookmark.id}">✕</button>
            </div>
        `).join('');
        
        // Add event listeners
        container.querySelectorAll('.bookmark-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-bookmark')) {
                    this.jumpToPage(parseInt(item.dataset.page));
                }
            });
        });
        
        container.querySelectorAll('.delete-bookmark').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeBookmark(btn.dataset.id);
            });
        });
    }
    
    loadNotes() {
        const notes = this.getBookNotes(this.currentBook.id);
        const container = document.getElementById('notesList');
        
        if (notes.length === 0) {
            container.innerHTML = '<div class="no-items">No notes yet</div>';
            return;
        }
        
        container.innerHTML = notes.map(note => `
            <div class="note-item">
                <div class="note-text">${note.text}</div>
                <div class="note-date">${new Date(note.created).toLocaleDateString()}</div>
            </div>
        `).join('');
    }
    
    switchTab(tabName) {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Show active tab pane
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === `${tabName}Tab`);
        });
    }
    
    toggleSidebar() {
        document.getElementById('readerSidebar').classList.toggle('active');
    }
    
    toggleCollection(collectionName) {
        const collections = this.getBookCollections(this.currentBook.id);
        const isInCollection = collections.includes(collectionName);
        
        if (isInCollection) {
            // Remove from collection
            this.saveBookCollections(this.currentBook.id, collections.filter(c => c !== collectionName));
            this.showNotification('Removed from ' + collectionName);
        } else {
            // Add to collection
            collections.push(collectionName);
            this.saveBookCollections(this.currentBook.id, collections);
            this.showNotification('Added to ' + collectionName);
        }
        
        this.updateCollectionsDisplay();
    }
    
    updateCollectionsDisplay() {
        const collections = this.getBookCollections(this.currentBook.id);
        
        document.querySelectorAll('.collection-card').forEach(card => {
            const collection = card.dataset.collection;
            const isActive = collections.includes(collection);
            
            card.classList.toggle('active', isActive);
            
            // Update count
            const count = this.getCollectionCount(collection);
            card.querySelector('.collection-count').textContent = `${count} books`;
        });
    }
    
    updateProgress() {
        const iframe = document.getElementById('bookIframe');
        let progress = 0;
        
        try {
            const scrollY = iframe.contentWindow.scrollY || iframe.contentDocument.documentElement.scrollTop;
            const scrollHeight = iframe.contentDocument.documentElement.scrollHeight;
            const clientHeight = iframe.contentDocument.documentElement.clientHeight;
            
            progress = Math.round((scrollY / (scrollHeight - clientHeight)) * 100);
            this.currentPage = Math.floor(scrollY / clientHeight) + 1;
        } catch (error) {
            // Use stored progress as fallback
            const savedProgress = this.getBookProgress(this.currentBook.id);
            progress = savedProgress?.progress || 0;
        }
        
        document.getElementById('currentPage').textContent = `Page ${this.currentPage}`;
        document.getElementById('pageJump').value = this.currentPage;
        document.getElementById('progressFill').style.width = `${progress}%`;
        document.getElementById('completionPercentage').textContent = `${progress}%`;
    }
    
    saveProgress() {
        if (!this.currentBook || !this.readingSession) return;
        
        this.updateProgress();
        
        const progress = {
            page: this.currentPage,
            progress: parseInt(document.getElementById('completionPercentage').textContent),
            lastRead: new Date().toISOString(),
            readingTime: this.readingSession.readingTime + Math.floor((Date.now() - this.readingSession.startTime) / 60000)
        };
        
        this.saveBookProgress(this.currentBook.id, progress);
        
        // Update reading time display
        document.getElementById('readingTime').textContent = `${progress.readingTime}m`;
    }
    
    startReadingSession() {
        this.readingSession.startTime = Date.now();
    }
    
    closeReader() {
        this.saveProgress();
        document.getElementById('enhancedBookReader').classList.remove('active');
        document.body.classList.remove('modal-open');
        document.getElementById('bookIframe').src = '';
        this.currentBook = null;
        this.readingSession = null;
    }
    
    handleKeyboard(e) {
        if (!document.getElementById('enhancedBookReader').classList.contains('active')) return;
        
        switch(e.key) {
            case 'ArrowRight':
            case ' ':
                e.preventDefault();
                this.nextPage();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.previousPage();
                break;
            case 'Escape':
                e.preventDefault();
                this.closeReader();
                break;
            case 'b':
                e.preventDefault();
                this.toggleBookmark();
                break;
        }
    }
    
    showNotification(message) {
        // Create notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--highlight);
            color: #000;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 500;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Data Management Methods
    getUserLibrary() {
        return JSON.parse(localStorage.getItem('userLibrary') || '{"books": {}, "collections": {}}');
    }
    
    saveUserLibrary(library) {
        localStorage.setItem('userLibrary', JSON.stringify(library));
    }
    
    getBookProgress(bookId) {
        const library = this.getUserLibrary();
        return library.books[bookId]?.progress;
    }
    
    saveBookProgress(bookId, progress) {
        const library = this.getUserLibrary();
        if (!library.books[bookId]) library.books[bookId] = {};
        library.books[bookId].progress = progress;
        library.books[bookId].lastRead = new Date().toISOString();
        this.saveUserLibrary(library);
    }
    
    getBookBookmarks(bookId) {
        const library = this.getUserLibrary();
        return library.books[bookId]?.bookmarks || [];
    }
    
    saveBookBookmarks(bookId, bookmarks) {
        const library = this.getUserLibrary();
        if (!library.books[bookId]) library.books[bookId] = {};
        library.books[bookId].bookmarks = bookmarks;
        this.saveUserLibrary(library);
    }
    
    getBookNotes(bookId) {
        const library = this.getUserLibrary();
        return library.books[bookId]?.notes || [];
    }
    
    saveBookNotes(bookId, notes) {
        const library = this.getUserLibrary();
        if (!library.books[bookId]) library.books[bookId] = {};
        library.books[bookId].notes = notes;
        this.saveUserLibrary(library);
    }
    
    getBookCollections(bookId) {
        const library = this.getUserLibrary();
        return library.books[bookId]?.collections || [];
    }
    
    saveBookCollections(bookId, collections) {
        const library = this.getUserLibrary();
        if (!library.books[bookId]) library.books[bookId] = {};
        library.books[bookId].collections = collections;
        this.saveUserLibrary(library);
    }
    
    getCollectionCount(collectionName) {
        const library = this.getUserLibrary();
        let count = 0;
        
        Object.values(library.books).forEach(book => {
            if (book.collections?.includes(collectionName)) {
                count++;
            }
        });
        
        return count;
    }
    
    loadUserData() {
        if (!localStorage.getItem('userLibrary')) {
            this.saveUserLibrary({
                books: {},
                collections: {
                    'currently-reading': [],
                    'want-to-read': [],
                    'finished': [],
                    'favorites': []
                }
            });
        }
    }
}

// Initialize enhanced reader
let enhancedReader = null;

// Lazy Loading Variables
let currentPage = {
    all: 0,
    books: 0,
    journals: 0,
    recent: 0
};
const CARDS_PER_PAGE = 20;
let isLoading = false;
let hasMoreItems = {
    all: true,
    books: true,
    journals: true,
    recent: true
};

let allItems = {
    all: [],
    books: [],
    journals: [],
    recent: []
};

let activeModals = [];
let currentBookId = null;

// Enhanced book opening function
function openEnhancedBookReader(bookData) {
    if (enhancedReader) {
        enhancedReader.openBook(bookData);
    }
}

// Updated handleDownloadClick to use enhanced reader for books
function handleDownloadClick(event, url, itemId) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    if (!url) {
        alert('Content not available yet.');
        return;
    }
    
    // Find the item
    const item = [...storeData.books, ...storeData.journals].find(i => i.id === itemId);
    if (!item) return;
    
    // Add to recent items
    addToRecentItems(item);
    
    // For books, use enhanced reader; for journals, use simple iframe
    if (item.type === 'Books' && enhancedReader) {
        openEnhancedBookReader(item);
    } else {
        // Use simple iframe for journals
        const iframe = document.getElementById('bookIframe');
        iframe.src = url;
        document.getElementById('bookModal').classList.add('active');
        document.getElementById('overlay').classList.add('active');
        lockBodyScroll();
    }
}

// Rest of your existing functions (keep them exactly as they were)
function addToRecentItems(item) {
    let recentItems = JSON.parse(localStorage.getItem('recentItems') || '[]');
    recentItems = recentItems.filter(recentItem => recentItem.id !== item.id);
    recentItems.unshift(item);
    recentItems = recentItems.slice(0, 10);
    localStorage.setItem('recentItems', JSON.stringify(recentItems));
    
    if (document.getElementById('recent').classList.contains('active')) {
        allItems.recent = recentItems;
        renderCards(recentItems, 'recentGrid', true);
    }
}

function lockBodyScroll() {
    if (activeModals.length === 0) {
        document.body.classList.add('modal-open');
    }
    activeModals.push('lock');
}

function unlockBodyScroll() {
    activeModals.pop();
    if (activeModals.length === 0) {
        document.body.classList.remove('modal-open');
    }
}

function closeAllModals() {
    const modals = ['bookModal', 'detailView', 'settingsWindow', 'enhancedBookReader'];
    let closedAny = false;
    
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal && modal.classList.contains('active')) {
            modal.classList.remove('active');
            closedAny = true;
        }
    });
    
    if (closedAny) {
        document.getElementById('overlay').classList.remove('active');
        activeModals = [];
        document.body.classList.remove('modal-open');
        currentBookId = null;
    }
}

function getPaginatedItems(items, section, reset = false) {
    if (reset) {
        currentPage[section] = 0;
        hasMoreItems[section] = items.length > 0;
    }
    
    const startIndex = currentPage[section] * CARDS_PER_PAGE;
    const endIndex = startIndex + CARDS_PER_PAGE;
    const paginatedItems = items.slice(startIndex, endIndex);
    
    hasMoreItems[section] = endIndex < items.length;
    
    return paginatedItems;
}

function loadMoreItems(section) {
    if (isLoading || !hasMoreItems[section]) return;
    
    isLoading = true;
    showLoadingIndicator(section);
    
    setTimeout(() => {
        currentPage[section]++;
        const items = allItems[section];
        const paginatedItems = getPaginatedItems(items, section, false);
        appendCards(paginatedItems, section + 'Grid');
        isLoading = false;
        hideLoadingIndicator(section);
        
        if (!hasMoreItems[section]) {
            hideLoadingIndicator(section);
            showNoMoreItems(section);
        }
    }, 800);
}

function showLoadingIndicator(section) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
        loadingIndicator.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading more ${getSectionName(section)}...</div>
        `;
    }
}

function hideLoadingIndicator(section) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

function showNoMoreItems(section) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
        loadingIndicator.innerHTML = `
            <div class="no-more-items">
                <i class="fas fa-check-circle"></i>
                <div>All ${getSectionName(section)} loaded</div>
            </div>
        `;
        
        setTimeout(() => {
            loadingIndicator.style.display = 'none';
        }, 3000);
    }
}

function getSectionName(section) {
    switch(section) {
        case 'all': return 'resources';
        case 'books': return 'books';
        case 'journals': return 'journals';
        case 'recent': return 'recent items';
        default: return 'items';
    }
}

function isScrolledToBottom() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    
    return scrollTop + clientHeight >= scrollHeight - 200;
}

function handleScroll() {
    const activeSection = document.querySelector('.section.active').id;
    
    if (isScrolledToBottom() && hasMoreItems[activeSection] && !isLoading) {
        loadMoreItems(activeSection);
    }
}

function appendCards(items, gridId) {
    const grid = document.getElementById(gridId);
    const section = gridId.replace('Grid', '');
    
    items.forEach(item => {
        const progress = enhancedReader ? enhancedReader.getBookProgress(item.id) : null;
        const progressBadge = progress ? ' <span class="progress-badge" title="Continue reading">📖</span>' : '';
        
        const cardHtml = `
            <div class="card" data-item-id="${item.id}" role="button" tabindex="0">
                <img src="${item.logo}" alt="${item.title} logo" class="card-logo" onerror="this.src='https://via.placeholder.com/80?text=Logo'">
                <div class="card-title">${item.title}${progressBadge}</div>
                <div class="card-type">${item.type}${item.verified ? ' <i class="fas fa-check-circle" style="color: #4caf50;"></i> Verified' : ''}</div>
                <button class="card-download" onclick="handleDownloadClick(event, '${item.file || item.downloadUrl || ''}', '${item.id}')">Read</button>
            </div>
        `;
        grid.innerHTML += cardHtml;
    });

    const newCards = grid.querySelectorAll('.card:not([data-event-bound])');
    newCards.forEach(card => {
        card.setAttribute('data-event-bound', 'true');
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.card-download')) {
                const itemId = card.dataset.itemId;
                const item = [...storeData.books, ...storeData.journals].find(i => i.id == itemId);
                if (item) openDetail(item);
            }
        });
    });
}

function renderCards(items, gridId, reset = true) {
    const grid = document.getElementById(gridId);
    const noResults = document.getElementById(gridId.replace('Grid', 'NoResults')) || null;
    const section = gridId.replace('Grid', '');
    
    allItems[section] = items;
    
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }

    if (reset) {
        grid.innerHTML = '';
        currentPage[section] = 0;
        hasMoreItems[section] = items.length > 0;
    }

    if (items.length === 0) {
        if (noResults) noResults.style.display = 'block';
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        return;
    }

    if (noResults) noResults.style.display = 'none';

    const paginatedItems = getPaginatedItems(items, section, reset);
    
    if (reset) {
        grid.innerHTML = '';
        paginatedItems.forEach(item => {
            const progress = enhancedReader ? enhancedReader.getBookProgress(item.id) : null;
            const progressBadge = progress ? ' <span class="progress-badge" title="Continue reading">📖</span>' : '';
            
            const cardHtml = `
                <div class="card" data-item-id="${item.id}" role="button" tabindex="0">
                    <img src="${item.logo}" alt="${item.title} logo" class="card-logo" onerror="this.src='https://via.placeholder.com/80?text=Logo'">
                    <div class="card-title">${item.title}${progressBadge}</div>
                    <div class="card-type">${item.type}${item.verified ? ' <i class="fas fa-check-circle" style="color: #4caf50;"></i> Verified' : ''}</div>
                    <button class="card-download" onclick="handleDownloadClick(event, '${item.file || item.downloadUrl || ''}', '${item.id}')">Read</button>
                </div>
            `;
            grid.innerHTML += cardHtml;
        });
    } else {
        appendCards(paginatedItems, gridId);
    }

    document.querySelectorAll(`#${gridId} .card`).forEach(card => {
        if (!card.hasAttribute('data-event-bound')) {
            card.setAttribute('data-event-bound', 'true');
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.card-download')) {
                    const itemId = card.dataset.itemId;
                    const item = [...storeData.books, ...storeData.journals].find(i => i.id == itemId);
                    if (item) openDetail(item);
                }
            });
        }
    });
    
    if (loadingIndicator && hasMoreItems[section] && items.length > CARDS_PER_PAGE) {
        loadingIndicator.style.display = 'block';
        loadingIndicator.innerHTML = `
            <div class="scroll-hint">
                <i class="fas fa-arrow-down"></i>
                <div>Scroll down to load more ${getSectionName(section)}</div>
            </div>
        `;
        
        setTimeout(() => {
            if (loadingIndicator && loadingIndicator.querySelector('.scroll-hint')) {
                loadingIndicator.style.display = 'none';
            }
        }, 5000);
    }
}

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

    if (tabId === 'recent') {
        const recentItems = JSON.parse(localStorage.getItem('recentItems') || '[]');
        allItems.recent = recentItems;
        renderCards(recentItems, 'recentGrid', true);
    }
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

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        const activeSectionId = document.querySelector('.section.active').id;
        let items = [];

        switch (activeSectionId) {
            case 'all': items = [...storeData.books, ...storeData.journals]; break;
            case 'books': items = storeData.books; break;
            case 'journals': items = storeData.journals; break;
            case 'recent': items = JSON.parse(localStorage.getItem('recentItems') || '[]'); break;
        }

        const filtered = items.filter(item =>
            item.title.toLowerCase().includes(query) ||
            (item.shortDesc && item.shortDesc.toLowerCase().includes(query)) ||
            item.type.toLowerCase().includes(query)
        );

        const gridId = activeSectionId + 'Grid';
        allItems[activeSectionId] = filtered;
        renderCards(filtered, gridId, true);
    });
}

function initSettings() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.body.dataset.theme = theme;
    document.getElementById('theme').value = theme;
}

function toggleSettings() {
    const settingsWindow = document.getElementById('settingsWindow');
    const overlay = document.getElementById('overlay');
    const wasOpen = settingsWindow.classList.contains('active');
    
    if (!wasOpen) {
        closeAllModals();
    }
    
    settingsWindow.classList.toggle('active');
    overlay.classList.toggle('active');

    if (!wasOpen) {
        lockBodyScroll();
    } else {
        unlockBodyScroll();
    }
}

function saveSettings() {
    const theme = document.getElementById('theme').value;
    localStorage.setItem('theme', theme);
    document.body.dataset.theme = theme;
    toggleSettings();
}

function openDetail(item) {
    addToRecentItems(item);

    document.getElementById('detailLogo').src = item.logo;
    document.getElementById('detailLogo').alt = `${item.title} logo`;
    document.getElementById('detailTitle').textContent = item.title;
    document.getElementById('detailType').textContent = item.type;
    document.getElementById('detailVerified').innerHTML = item.verified ? '<i class="fas fa-check-circle" style="color: #4caf50;"></i> Verified' : '';
    document.getElementById('detailShortDesc').textContent = item.shortDesc || '';
    document.getElementById('detailLongDesc').textContent = item.longDesc || '';

    // Show reading progress if available
    const progress = enhancedReader ? enhancedReader.getBookProgress(item.id) : null;
    if (progress) {
        const progressInfo = document.createElement('div');
        progressInfo.className = 'detail-progress';
        progressInfo.innerHTML = `<span style="color: var(--highlight); font-size: 0.9rem;">📖 Reading progress: ${progress.progress}%</span>`;
        document.getElementById('detailVerified').appendChild(progressInfo);
    }

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

    const detailButton = document.getElementById('detailDownload');
    detailButton.textContent = progress ? 'Continue Reading' : 'Read';
    detailButton.onclick = () => handleDownloadClick(null, item.file || item.downloadUrl || '', item.id);

    closeAllModals();
    
    document.getElementById('detailView').classList.add('active');
    document.getElementById('overlay').classList.add('active');
    lockBodyScroll();
}

function closeDetail() {
    document.getElementById('detailView').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
    unlockBodyScroll();
}

function closeBookModal() {
    document.getElementById('bookModal').classList.remove('active');
    document.getElementById('bookIframe').src = '';
    document.getElementById('overlay').classList.remove('active');
    unlockBodyScroll();
    currentBookId = null;
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
    allItems.books = filtered;
    renderCards(filtered, 'booksGrid', true);
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
        allItems.books = storeData.books;
        renderCards(storeData.books, 'booksGrid', true);
    }
}

async function loadDataFromJSON() {
    try {
        const [booksRes, journalsRes] = await Promise.all([
            fetch('books.json').then(r => r.json()),
            fetch('journals.json').then(r => r.json())
        ]);
        storeData.books = booksRes;
        storeData.journals = journalsRes;
        
        allItems.all = [...storeData.books, ...storeData.journals];
        allItems.books = storeData.books;
        allItems.journals = storeData.journals;
        allItems.recent = JSON.parse(localStorage.getItem('recentItems') || '[]');
        
        console.log('Data loaded! Books:', storeData.books.length, 'Journals:', storeData.journals.length);
    } catch (err) {
        console.error('Error loading data:', err);
    }
}

function handleOverlayClick(e) {
    if (e.target === document.getElementById('overlay')) {
        if (document.getElementById('bookModal').classList.contains('active')) {
            closeBookModal();
        } else if (document.getElementById('detailView').classList.contains('active')) {
            closeDetail();
        } else if (document.getElementById('settingsWindow').classList.contains('active')) {
            toggleSettings();
        } else if (document.getElementById('enhancedBookReader').classList.contains('active')) {
            enhancedReader.closeReader();
        }
    }
}

function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        if (document.getElementById('bookModal').classList.contains('active')) {
            closeBookModal();
        } else if (document.getElementById('detailView').classList.contains('active')) {
            closeDetail();
        } else if (document.getElementById('settingsWindow').classList.contains('active')) {
            toggleSettings();
        } else if (document.getElementById('enhancedBookReader').classList.contains('active')) {
            enhancedReader.closeReader();
        } else if (document.getElementById('languageCheckboxes').style.display === 'block') {
            toggleLanguageDropdown();
        }
    }
}

// Main Initialization
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize enhanced book reader FIRST
    enhancedReader = new EnhancedBookReader();
    
    await loadDataFromJSON();

    // Render all sections
    renderCards(allItems.all, 'allGrid', true);
    renderCards(allItems.books, 'booksGrid', true);
    renderCards(allItems.journals, 'journalsGrid', true);
    renderCards(allItems.recent, 'recentGrid', true);

    // Initialize components
    initTabs();
    initSearch();
    initSettings();

    // Event listeners
    window.addEventListener('scroll', handleScroll);
    document.getElementById('closeBtn').addEventListener('click', closeDetail);
    document.getElementById('bookModalClose').addEventListener('click', closeBookModal);
    document.getElementById('settingsIcon').addEventListener('click', toggleSettings);
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
    document.getElementById('overlay').addEventListener('click', handleOverlayClick);

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

    document.addEventListener('keydown', handleEscapeKey);

    // Default to "All" tab
    switchTab('all');

    console.log('Sarvstore ready! Enhanced book reader with REAL book loading implemented.');
});