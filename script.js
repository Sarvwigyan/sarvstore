// Global Data Object (Now only Books and Journals)
const storeData = {
    books: [], // Populated from books.json
    journals: [] // Populated from journals.json
};

// NEW: Enhanced Book Reader Instance
let enhancedReader = null;

// NEW: Lazy Loading Variables
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

// Store all items for each section
let allItems = {
    all: [],
    books: [],
    journals: [],
    recent: []
};

// FIXED: Improved Scroll Lock Management
let activeModals = [];

// NEW: Track current book for progress saving
let currentBookId = null;

// ==================== ENHANCED BOOK READER INTEGRATION ====================

// Enhanced Book Reader System
class EnhancedBookReader {
    constructor() {
        this.currentBook = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.pdfDoc = null;
        this.scale = 1.5;
        this.isLoading = false;
        
        // User data
        this.userLibrary = this.getUserLibrary();
        this.readingSession = null;
        
        // Initialize when DOM is loaded
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
                        
                        <input type="number" id="pageJump" min="1" value="1" style="
                            width: 60px;
                            background: rgba(255,255,255,0.1);
                            border: var(--border);
                            border-radius: 6px;
                            color: var(--text);
                            padding: 0.4rem;
                            text-align: center;
                        ">
                        
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
                            <span>Add to Collection</span>
                        </button>
                        
                        <!-- Notes Sidebar -->
                        <button class="reader-btn" id="toggleSidebar">
                            <span>Notes</span>
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
                        <!-- PDF pages will be rendered here -->
                    </div>
                    
                    <!-- Sidebar -->
                    <div class="reader-sidebar" id="readerSidebar">
                        <div class="sidebar-tabs">
                            <button class="tab-btn active" data-tab="bookmarks">Bookmarks</button>
                            <button class="tab-btn" data-tab="notes">Notes</button>
                            <button class="tab-btn" data-tab="highlights">Highlights</button>
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
                                    placeholder="Add your notes for the current page here..."
                                ></textarea>
                                <button class="reader-btn" id="saveNote" style="width: 100%; margin-bottom: 1rem;">
                                    Save Note for Current Page
                                </button>
                                <div class="notes-list" id="notesList">
                                    <div class="no-items">No notes yet</div>
                                </div>
                            </div>
                            
                            <!-- Highlights Tab -->
                            <div class="tab-pane" id="highlightsTab">
                                <div class="highlights-list" id="highlightsList">
                                    <div class="no-items">No highlights yet</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="reader-footer">
                    <div class="reading-stats">
                        <span>Reading Time: <span id="readingTime">0m</span></span>
                        <span>Last Read: <span id="lastRead">Just now</span></span>
                        <span>
                            Progress: 
                            <div class="progress-bar">
                                <div class="progress-fill" id="progressFill" style="width: 0%"></div>
                            </div>
                            <span id="completionPercentage">0%</span>
                        </span>
                    </div>
                </div>
            </div>
            
            <!-- Collections Modal -->
            <div class="collection-modal" id="collectionModal">
                <h3>Add to Collection</h3>
                <p>Select collections for this book:</p>
                
                <div class="collection-grid" id="collectionGrid">
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
                
                <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                    <button class="reader-btn" id="saveCollections" style="flex: 1;">Save Collections</button>
                    <button class="reader-btn" id="closeCollections" style="flex: 1;">Cancel</button>
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
        
        // Sidebar
        document.getElementById('toggleSidebar').addEventListener('click', () => this.toggleSidebar());
        
        // Collections
        document.getElementById('showCollections').addEventListener('click', () => this.showCollections());
        document.getElementById('saveCollections').addEventListener('click', () => this.saveCollections());
        document.getElementById('closeCollections').addEventListener('click', () => this.hideCollections());
        
        // Close reader
        document.getElementById('closeReader').addEventListener('click', () => this.closeReader());
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Overlay navigation
        document.querySelector('.left-arrow').addEventListener('click', () => this.previousPage());
        document.querySelector('.right-arrow').addEventListener('click', () => this.nextPage());
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Auto-save progress
        setInterval(() => this.saveProgress(), 30000); // Every 30 seconds
    }
    
    async openBook(bookData) {
        this.currentBook = bookData;
        this.readingSession = {
            bookId: bookData.id,
            startTime: Date.now(),
            startPage: 1,
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
        
        // Load PDF (simulated - in real implementation, you'd use PDF.js)
        await this.loadPDF(bookData);
        
        // Start reading session
        this.startReadingSession();
        
        // Update collections display
        this.updateCollectionsDisplay();
    }
    
    async loadPDF(bookData) {
        // Simulate PDF loading
        this.isLoading = true;
        this.totalPages = bookData.pages || 100; // Mock pages
        
        document.getElementById('totalPages').textContent = `of ${this.totalPages}`;
        this.updateProgress();
        
        // Render current page (simulated)
        await this.renderPage(this.currentPage);
        this.isLoading = false;
        
        // Load bookmarks and notes
        this.loadBookmarks();
        this.loadNotes();
    }
    
    async renderPage(pageNum) {
        const viewer = document.getElementById('pdfViewer');
        viewer.innerHTML = `
            <div class="page-navigation-overlay">
                <button class="nav-arrow left-arrow">‹</button>
                <button class="nav-arrow right-arrow">›</button>
            </div>
            <div class="pdf-page">
                <div style="
                    width: 800px; 
                    height: 1000px; 
                    background: white; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    font-family: Arial, sans-serif;
                    color: #333;
                    border: 2px solid #ddd;
                ">
                    <div style="text-align: center;">
                        <h2>${this.currentBook.title}</h2>
                        <p>Page ${pageNum} of ${this.totalPages}</p>
                        <p style="margin-top: 2rem; font-style: italic;">
                            This is a simulated PDF page.<br>
                            In a real implementation, this would be rendered using PDF.js
                        </p>
                        <p style="margin-top: 1rem;">
                            📖 Reading progress: ${Math.round((pageNum / this.totalPages) * 100)}%
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        // Re-bind overlay events
        document.querySelector('.left-arrow').addEventListener('click', () => this.previousPage());
        document.querySelector('.right-arrow').addEventListener('click', () => this.nextPage());
        
        this.currentPage = pageNum;
        this.updateProgress();
    }
    
    nextPage() {
        if (this.currentPage < this.totalPages && !this.isLoading) {
            this.currentPage++;
            this.renderPage(this.currentPage);
            this.saveProgress();
        }
    }
    
    previousPage() {
        if (this.currentPage > 1 && !this.isLoading) {
            this.currentPage--;
            this.renderPage(this.currentPage);
            this.saveProgress();
        }
    }
    
    jumpToPage(page) {
        if (page >= 1 && page <= this.totalPages && !this.isLoading) {
            this.currentPage = page;
            this.renderPage(this.currentPage);
            this.saveProgress();
        }
    }
    
    zoomIn() {
        this.scale = Math.min(this.scale + 0.25, 3);
        this.renderPage(this.currentPage);
    }
    
    zoomOut() {
        this.scale = Math.max(this.scale - 0.25, 0.5);
        this.renderPage(this.currentPage);
    }
    
    toggleBookmark() {
        const bookmarks = this.getBookBookmarks(this.currentBook.id);
        const existingBookmark = bookmarks.find(b => b.page === this.currentPage);
        
        if (existingBookmark) {
            this.removeBookmark(existingBookmark.id);
        } else {
            this.addBookmark();
        }
    }
    
    addBookmark(notes = '') {
        const bookmark = {
            id: Date.now().toString(),
            bookId: this.currentBook.id,
            page: this.currentPage,
            notes: notes,
            created: new Date().toISOString()
        };
        
        let bookmarks = this.getBookBookmarks(this.currentBook.id);
        bookmarks.push(bookmark);
        this.saveBookBookmarks(this.currentBook.id, bookmarks);
        
        this.loadBookmarks();
        this.updateBookmarkButton();
    }
    
    removeBookmark(bookmarkId) {
        let bookmarks = this.getBookBookmarks(this.currentBook.id);
        bookmarks = bookmarks.filter(b => b.id !== bookmarkId);
        this.saveBookBookmarks(this.currentBook.id, bookmarks);
        
        this.loadBookmarks();
        this.updateBookmarkButton();
    }
    
    saveNote() {
        const noteText = document.getElementById('currentNote').value.trim();
        if (!noteText) return;
        
        const note = {
            id: Date.now().toString(),
            bookId: this.currentBook.id,
            page: this.currentPage,
            text: noteText,
            created: new Date().toISOString()
        };
        
        let notes = this.getBookNotes(this.currentBook.id);
        // Remove existing note for this page
        notes = notes.filter(n => n.page !== this.currentPage);
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
        const currentNote = notes.find(n => n.page === this.currentPage);
        
        // Set current note text
        document.getElementById('currentNote').value = currentNote?.text || '';
        
        // Display notes list
        const otherNotes = notes.filter(n => n.page !== this.currentPage);
        
        if (otherNotes.length === 0) {
            container.innerHTML = '<div class="no-items">No other notes</div>';
            return;
        }
        
        container.innerHTML = otherNotes.map(note => `
            <div class="note-item" data-page="${note.page}">
                <div class="note-page">Page ${note.page}</div>
                <div class="note-text">${note.text}</div>
            </div>
        `).join('');
        
        // Add click events to notes
        container.querySelectorAll('.note-item').forEach(item => {
            item.addEventListener('click', () => {
                this.jumpToPage(parseInt(item.dataset.page));
            });
        });
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
        document.getElementById('readerSidebar').classList.toggle('collapsed');
    }
    
    showCollections() {
        this.updateCollectionsModal();
        document.getElementById('collectionModal').classList.add('active');
    }
    
    hideCollections() {
        document.getElementById('collectionModal').classList.remove('active');
    }
    
    updateCollectionsModal() {
        const bookCollections = this.getBookCollections(this.currentBook.id);
        const grid = document.getElementById('collectionGrid');
        
        grid.querySelectorAll('.collection-card').forEach(card => {
            const collection = card.dataset.collection;
            const isActive = bookCollections.includes(collection);
            
            card.classList.toggle('active', isActive);
            
            // Update count
            const count = this.getCollectionCount(collection);
            card.querySelector('.collection-count').textContent = `${count} books`;
        });
    }
    
    saveCollections() {
        const selectedCollections = [];
        document.querySelectorAll('.collection-card.active').forEach(card => {
            selectedCollections.push(card.dataset.collection);
        });
        
        this.saveBookCollections(this.currentBook.id, selectedCollections);
        this.hideCollections();
        this.updateCollectionsDisplay();
        this.showNotification('Collections updated!');
    }
    
    updateCollectionsDisplay() {
        const collections = this.getBookCollections(this.currentBook.id);
        const btn = document.getElementById('showCollections');
        
        if (collections.length > 0) {
            btn.innerHTML = `<span>In ${collections.length} Collection(s)</span>`;
        } else {
            btn.innerHTML = `<span>Add to Collection</span>`;
        }
    }
    
    updateBookmarkButton() {
        const bookmarks = this.getBookBookmarks(this.currentBook.id);
        const hasBookmark = bookmarks.some(b => b.page === this.currentPage);
        const btn = document.getElementById('toggleBookmark');
        
        btn.classList.toggle('active', hasBookmark);
    }
    
    updateProgress() {
        const progress = (this.currentPage / this.totalPages) * 100;
        
        document.getElementById('currentPage').textContent = `Page ${this.currentPage}`;
        document.getElementById('pageJump').value = this.currentPage;
        document.getElementById('progressFill').style.width = `${progress}%`;
        document.getElementById('completionPercentage').textContent = `${Math.round(progress)}%`;
        
        this.updateBookmarkButton();
        
        // Update current note if exists
        const notes = this.getBookNotes(this.currentBook.id);
        const currentNote = notes.find(n => n.page === this.currentPage);
        document.getElementById('currentNote').value = currentNote?.text || '';
    }
    
    saveProgress() {
        if (!this.currentBook || !this.readingSession) return;
        
        const progress = {
            page: this.currentPage,
            totalPages: this.totalPages,
            progress: (this.currentPage / this.totalPages) * 100,
            lastRead: new Date().toISOString(),
            readingTime: this.readingSession.readingTime + Math.floor((Date.now() - this.readingSession.startTime) / 60000)
        };
        
        this.saveBookProgress(this.currentBook.id, progress);
        
        // Update reading time display
        document.getElementById('readingTime').textContent = `${progress.readingTime}m`;
        document.getElementById('lastRead').textContent = 'Just now';
    }
    
    startReadingSession() {
        this.readingSession.startTime = Date.now();
    }
    
    closeReader() {
        this.saveProgress();
        document.getElementById('enhancedBookReader').classList.remove('active');
        document.body.classList.remove('modal-open');
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
        // Initialize user library if not exists
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

// ==================== EXISTING FUNCTIONALITY (UPDATED) ====================

// NEW: Permanent Reading Progress Functions
function saveReadingProgress(bookId, scrollPosition) {
    try {
        const progress = {
            scrollY: scrollPosition,
            timestamp: Date.now(),
            lastRead: new Date().toISOString()
        };
        localStorage.setItem(`readingProgress_${bookId}`, JSON.stringify(progress));
        console.log(`Progress saved for ${bookId}:`, scrollPosition);
    } catch (error) {
        console.error('Error saving reading progress:', error);
    }
}

function loadReadingProgress(bookId) {
    try {
        const saved = localStorage.getItem(`readingProgress_${bookId}`);
        return saved ? JSON.parse(saved) : null;
    } catch (error) {
        console.error('Error loading reading progress:', error);
        return null;
    }
}

function clearReadingProgress(bookId) {
    try {
        localStorage.removeItem(`readingProgress_${bookId}`);
        console.log(`Progress cleared for ${bookId}`);
    } catch (error) {
        console.error('Error clearing reading progress:', error);
    }
}

// NEW: Function to restore scroll position in iframe
function restoreScrollPosition(iframe, bookId) {
    const savedProgress = loadReadingProgress(bookId);
    if (savedProgress && savedProgress.scrollY > 0) {
        console.log(`Restoring scroll position for ${bookId}:`, savedProgress.scrollY);
        
        // Try multiple methods to ensure scroll restoration
        const restoreScroll = () => {
            try {
                // Method 1: Direct scroll
                if (iframe.contentWindow && iframe.contentDocument) {
                    iframe.contentWindow.scrollTo(0, savedProgress.scrollY);
                }
                
                // Method 2: Wait a bit and try again (for slow loading content)
                setTimeout(() => {
                    if (iframe.contentWindow) {
                        iframe.contentWindow.scrollTo(0, savedProgress.scrollY);
                    }
                }, 500);
                
                // Method 3: One more try after content is fully loaded
                setTimeout(() => {
                    if (iframe.contentWindow) {
                        iframe.contentWindow.scrollTo(0, savedProgress.scrollY);
                    }
                }, 1000);
            } catch (error) {
                console.warn('Could not restore scroll position:', error);
            }
        };

        // Set up scroll restoration
        if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
            restoreScroll();
        } else {
            iframe.onload = restoreScroll;
        }
    }
}

// NEW: Function to setup scroll tracking for iframe
function setupScrollTracking(iframe, bookId) {
    let scrollTimeout;
    
    const trackScroll = () => {
        try {
            if (iframe.contentWindow) {
                const scrollY = iframe.contentWindow.scrollY || iframe.contentDocument.documentElement.scrollTop;
                
                // Only save if user has scrolled significantly
                if (scrollY > 100) {
                    clearTimeout(scrollTimeout);
                    scrollTimeout = setTimeout(() => {
                        saveReadingProgress(bookId, scrollY);
                    }, 1000); // Debounce: save 1 second after user stops scrolling
                }
            }
        } catch (error) {
            // Cross-origin limitations - we'll handle this gracefully
            console.warn('Cannot track scroll position due to cross-origin restrictions');
        }
    };

    // Try to set up scroll listener
    try {
        if (iframe.contentWindow) {
            iframe.contentWindow.addEventListener('scroll', trackScroll);
            
            // Also track on iframe load
            iframe.onload = function() {
                restoreScrollPosition(iframe, bookId);
                iframe.contentWindow.addEventListener('scroll', trackScroll);
            };
        }
    } catch (error) {
        console.warn('Cannot setup scroll tracking due to cross-origin restrictions');
        // Fallback: Save progress when closing
        setupFallbackProgressSaving(iframe, bookId);
    }
}

// NEW: Fallback for cross-origin restrictions
function setupFallbackProgressSaving(iframe, bookId) {
    // Save current position when modal closes
    const originalCloseBookModal = closeBookModal;
    closeBookModal = function() {
        try {
            if (iframe.contentWindow) {
                const scrollY = iframe.contentWindow.scrollY || iframe.contentDocument.documentElement.scrollTop;
                if (scrollY > 100) {
                    saveReadingProgress(bookId, scrollY);
                }
            }
        } catch (error) {
            console.warn('Could not save scroll position on close');
        }
        originalCloseBookModal();
    };
}

// NEW: Enhanced book opening function
function openEnhancedBookReader(bookData) {
    if (enhancedReader) {
        enhancedReader.openBook(bookData);
    }
}

// UPDATED: Handle Download Click with enhanced reader option
function handleDownloadClick(event, url, itemId, itemType = 'book') {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    // Set current book for progress tracking
    currentBookId = itemId;
    
    // Add to recent items
    if (event) {
        const card = event.target.closest('.card');
        if (card) {
            const cardItemId = card.dataset.itemId;
            const item = [...storeData.books, ...storeData.journals].find(i => i.id == cardItemId);
            if (item) {
                addToRecentItems(item);
            }
        }
    }
    
    if (!url) {
        alert('Content not available yet.');
        return;
    }
    
    // NEW: Check if we should use enhanced reader or regular iframe
    const item = [...storeData.books, ...storeData.journals].find(i => i.id === itemId);
    
    // For books, use enhanced reader; for journals, use regular iframe
    if (item && item.type === 'Books' && enhancedReader) {
        // Use enhanced book reader
        openEnhancedBookReader(item);
    } else {
        // Use regular iframe viewer
        // FIXED: Close any existing modals first
        closeAllModals();
        
        // Open content in modal iframe (for PDFs and archive.org content)
        const iframe = document.getElementById('bookIframe');
        iframe.src = url;
        document.getElementById('bookModal').classList.add('active');
        document.getElementById('overlay').classList.add('active');
        lockBodyScroll();
        history.pushState({ modal: 'book' }, '', '#book');
        
        // NEW: Setup progress tracking for this book
        setTimeout(() => {
            setupScrollTracking(iframe, itemId);
        }, 1000);
    }
}

// FIXED: Function to Add Item to Recently Viewed
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
        allItems.recent = recentItems;
        renderCards(recentItems, 'recentGrid', true);
    }
}

// FIXED: Improved Scroll Lock Management
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

// FIXED: Function to close all modals properly
function closeAllModals() {
    const modals = ['bookModal', 'detailView', 'settingsWindow', 'enhancedBookReader', 'collectionModal'];
    let closedAny = false;
    
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal && modal.classList.contains('active')) {
            modal.classList.remove('active');
            closedAny = true;
        }
    });
    
    // Close overlay only if we closed any modal
    if (closedAny) {
        document.getElementById('overlay').classList.remove('active');
        // Reset scroll locks
        activeModals = [];
        document.body.classList.remove('modal-open');
        // Clear current book tracking
        currentBookId = null;
        // Clear history state
        history.replaceState(null, '', window.location.pathname);
    }
}

// CORRECTED: Function to get paginated items
function getPaginatedItems(items, section, reset = false) {
    if (reset) {
        currentPage[section] = 0;
        hasMoreItems[section] = items.length > 0;
    }
    
    const startIndex = currentPage[section] * CARDS_PER_PAGE;
    const endIndex = startIndex + CARDS_PER_PAGE;
    const paginatedItems = items.slice(startIndex, endIndex);
    
    // Check if there are more items to load
    hasMoreItems[section] = endIndex < items.length;
    
    return paginatedItems;
}

// CORRECTED: Function to load more items
function loadMoreItems(section) {
    if (isLoading || !hasMoreItems[section]) return;
    
    isLoading = true;
    showLoadingIndicator(section);
    
    // Simulate loading delay for better UX
    setTimeout(() => {
        currentPage[section]++;
        
        const items = allItems[section];
        const paginatedItems = getPaginatedItems(items, section, false);
        
        // Append new cards to existing ones
        appendCards(paginatedItems, section + 'Grid');
        
        isLoading = false;
        hideLoadingIndicator(section);
        
        // Hide loading indicator if no more items
        if (!hasMoreItems[section]) {
            hideLoadingIndicator(section);
            showNoMoreItems(section);
        }
    }, 800); // Increased delay for better loading animation
}

// NEW: Show loading indicator with animation
function showLoadingIndicator(section) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
        loadingIndicator.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading more ${getSectionName(section)}...</div>
            <div class="loading-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
    }
}

// NEW: Hide loading indicator
function hideLoadingIndicator(section) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

// NEW: Show "no more items" message
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
        
        // Hide after 3 seconds
        setTimeout(() => {
            loadingIndicator.style.display = 'none';
        }, 3000);
    }
}

// NEW: Get section name for loading messages
function getSectionName(section) {
    switch(section) {
        case 'all': return 'resources';
        case 'books': return 'books';
        case 'journals': return 'journals';
        case 'recent': return 'recent items';
        default: return 'items';
    }
}

// NEW: Function to check if user has scrolled to bottom
function isScrolledToBottom() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    
    return scrollTop + clientHeight >= scrollHeight - 200; // 200px buffer for better UX
}

// NEW: Scroll event handler for lazy loading
function handleScroll() {
    const activeSection = document.querySelector('.section.active').id;
    
    if (isScrolledToBottom() && hasMoreItems[activeSection] && !isLoading) {
        loadMoreItems(activeSection);
    }
}

// NEW: Function to append cards (for lazy loading)
function appendCards(items, gridId) {
    const grid = document.getElementById(gridId);
    const section = gridId.replace('Grid', '');
    
    items.forEach(item => {
        // Check if this item has reading progress
        const progress = loadReadingProgress(item.id);
        const progressBadge = progress ? ' <span class="progress-badge" title="Continue reading from where you left off">📖</span>' : '';
        
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

    // Add click listeners to new cards for detail view
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

// CORRECTED: Function to Render Cards in a Grid with Lazy Loading Support
function renderCards(items, gridId, reset = true) {
    const grid = document.getElementById(gridId);
    const noResults = document.getElementById(gridId.replace('Grid', 'NoResults')) || null;
    const section = gridId.replace('Grid', '');
    
    // Store items for this section
    allItems[section] = items;
    
    // Hide loading indicator initially
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }

    // Clear grid only on reset
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

    // Get paginated items for initial load
    const paginatedItems = getPaginatedItems(items, section, reset);
    
    // Clear and render initial cards on reset, or append on lazy load
    if (reset) {
        grid.innerHTML = '';
        paginatedItems.forEach(item => {
            const progress = loadReadingProgress(item.id);
            const progressBadge = progress ? ' <span class="progress-badge" title="Continue reading from where you left off">📖</span>' : '';
            
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

    // Add click listeners to all cards for detail view
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
    
    // Show loading indicator if there are more items to load
    if (loadingIndicator && hasMoreItems[section] && items.length > CARDS_PER_PAGE) {
        loadingIndicator.style.display = 'block';
        loadingIndicator.innerHTML = `
            <div class="scroll-hint">
                <i class="fas fa-arrow-down"></i>
                <div>Scroll down to load more ${getSectionName(section)}</div>
            </div>
        `;
        
        // Hide scroll hint after 5 seconds
        setTimeout(() => {
            if (loadingIndicator && loadingIndicator.querySelector('.scroll-hint')) {
                loadingIndicator.style.display = 'none';
            }
        }, 5000);
    }
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

    // Refresh recent items when switching to recent tab
    if (tabId === 'recent') {
        const recentItems = JSON.parse(localStorage.getItem('recentItems') || '[]');
        allItems.recent = recentItems;
        renderCards(recentItems, 'recentGrid', true);
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

        // Re-render filtered with reset
        const gridId = activeSectionId + 'Grid';
        allItems[activeSectionId] = filtered;
        renderCards(filtered, gridId, true);
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
    
    // FIXED: Close all modals first to avoid conflicts
    if (!wasOpen) {
        closeAllModals();
    }
    
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

// FIXED: Open Detail Modal with proper modal management
function openDetail(item) {
    addToRecentItems(item);

    document.getElementById('detailLogo').src = item.logo;
    document.getElementById('detailLogo').alt = `${item.title} logo`;
    document.getElementById('detailTitle').textContent = item.title;
    document.getElementById('detailType').textContent = item.type;
    document.getElementById('detailVerified').innerHTML = item.verified ? '<i class="fas fa-check-circle" style="color: #4caf50;"></i> Verified' : '';
    document.getElementById('detailShortDesc').textContent = item.shortDesc || '';
    document.getElementById('detailLongDesc').textContent = item.longDesc || '';

    // NEW: Show reading progress in detail view if available
    const progress = loadReadingProgress(item.id);
    if (progress) {
        const progressInfo = document.createElement('div');
        progressInfo.className = 'detail-progress';
        progressInfo.innerHTML = `<span style="color: var(--highlight); font-size: 0.9rem;">📖 You have reading progress - will continue from where you left off</span>`;
        document.getElementById('detailVerified').appendChild(progressInfo);
    }

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
    detailButton.textContent = progress ? 'Continue Reading' : 'Read';

    // Read button
    detailButton.onclick = () => handleDownloadClick(null, item.file || item.downloadUrl || '', item.id);

    // FIXED: Close any existing modals first
    closeAllModals();
    
    // Show modal + Lock scroll + Push history state
    document.getElementById('detailView').classList.add('active');
    document.getElementById('overlay').classList.add('active');
    lockBodyScroll();
    history.pushState({ modal: 'detail' }, '', '#detail');
}

// FIXED: Close Detail Modal properly
function closeDetail() {
    document.getElementById('detailView').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
    unlockBodyScroll();
    history.replaceState(null, '', window.location.pathname);
}

// FIXED: Close Book Modal properly WITH progress saving
function closeBookModal() {
    // NEW: Save progress before closing if we have a current book
    if (currentBookId) {
        try {
            const iframe = document.getElementById('bookIframe');
            if (iframe.contentWindow) {
                const scrollY = iframe.contentWindow.scrollY || iframe.contentDocument.documentElement.scrollTop;
                if (scrollY > 100) {
                    saveReadingProgress(currentBookId, scrollY);
                }
            }
        } catch (error) {
            console.warn('Could not save scroll position on close');
        }
    }
    
    document.getElementById('bookModal').classList.remove('active');
    document.getElementById('bookIframe').src = '';
    document.getElementById('overlay').classList.remove('active');
    unlockBodyScroll();
    history.replaceState(null, '', window.location.pathname);
    
    // Reset current book tracking
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

// Async Data Loader (Updated for Journals)
async function loadDataFromJSON() {
    try {
        const [booksRes, journalsRes] = await Promise.all([
            fetch('books.json').then(r => r.json()),
            fetch('journals.json').then(r => r.json())
        ]);
        storeData.books = booksRes;
        storeData.journals = journalsRes;
        
        // Initialize allItems
        allItems.all = [...storeData.books, ...storeData.journals];
        allItems.books = storeData.books;
        allItems.journals = storeData.journals;
        allItems.recent = JSON.parse(localStorage.getItem('recentItems') || '[]');
        
        console.log('Data loaded from JSONs! Total items:', storeData.books.length + storeData.journals.length);
    } catch (err) {
        console.error('JSON load error (check files exist):', err);
    }
}

// FIXED: Improved overlay click handler
function handleOverlayClick(e) {
    if (e.target === document.getElementById('overlay')) {
        // FIXED: Close only the top-most modal
        if (document.getElementById('bookModal').classList.contains('active')) {
            closeBookModal();
        } else if (document.getElementById('detailView').classList.contains('active')) {
            closeDetail();
        } else if (document.getElementById('settingsWindow').classList.contains('active')) {
            toggleSettings();
        } else if (document.getElementById('enhancedBookReader').classList.contains('active')) {
            enhancedReader.closeReader();
        } else if (document.getElementById('collectionModal').classList.contains('active')) {
            enhancedReader.hideCollections();
        }
    }
}

// FIXED: Improved browser back/forward handling
function handlePopState(event) {
    // FIXED: Close only the top-most modal
    if (document.getElementById('bookModal').classList.contains('active')) {
        closeBookModal();
    } else if (document.getElementById('detailView').classList.contains('active')) {
        closeDetail();
    } else if (document.getElementById('settingsWindow').classList.contains('active')) {
        toggleSettings();
    } else if (document.getElementById('enhancedBookReader').classList.contains('active')) {
        enhancedReader.closeReader();
    } else if (document.getElementById('collectionModal').classList.contains('active')) {
        enhancedReader.hideCollections();
    }
}

// FIXED: Improved escape key handler
function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        // FIXED: Close only the top-most modal
        if (document.getElementById('bookModal').classList.contains('active')) {
            closeBookModal();
        } else if (document.getElementById('detailView').classList.contains('active')) {
            closeDetail();
        } else if (document.getElementById('settingsWindow').classList.contains('active')) {
            toggleSettings();
        } else if (document.getElementById('enhancedBookReader').classList.contains('active')) {
            enhancedReader.closeReader();
        } else if (document.getElementById('collectionModal').classList.contains('active')) {
            enhancedReader.hideCollections();
        } else if (document.getElementById('languageCheckboxes').style.display === 'block') {
            toggleLanguageDropdown();
        }
    }
}

// NEW: Function to clear all reading progress (optional feature)
function clearAllReadingProgress() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('readingProgress_')) {
            keysToRemove.push(key);
        }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('Cleared all reading progress');
    // Refresh the view to update progress badges
    renderCards([...storeData.books, ...storeData.journals], 'allGrid', true);
    renderCards(storeData.books, 'booksGrid', true);
    renderCards(storeData.journals, 'journalsGrid', true);
}

// Main Initialization
document.addEventListener('DOMContentLoaded', async () => {
    // NEW: Initialize enhanced book reader
    enhancedReader = new EnhancedBookReader();
    
    await loadDataFromJSON();

    // Render all sections with lazy loading
    renderCards(allItems.all, 'allGrid', true);
    renderCards(allItems.books, 'booksGrid', true);
    renderCards(allItems.journals, 'journalsGrid', true);
    renderCards(allItems.recent, 'recentGrid', true);

    // Original inits
    initTabs();
    initSearch();
    initSettings();

    // NEW: Add scroll event listener for lazy loading
    window.addEventListener('scroll', handleScroll);

    // Event listeners
    document.getElementById('closeBtn').addEventListener('click', closeDetail);
    document.getElementById('bookModalClose').addEventListener('click', closeBookModal);
    document.getElementById('settingsIcon').addEventListener('click', toggleSettings);
    document.getElementById('saveSettings').addEventListener('click', saveSettings);

    // FIXED: Use the improved overlay click handler
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

    // FIXED: Use improved browser back/forward handler
    window.addEventListener('popstate', handlePopState);

    // FIXED: Use improved escape key handler
    document.addEventListener('keydown', handleEscapeKey);

    // Default to "All" tab
    switchTab('all');

    console.log('Sarvstore ready! Enhanced book reader integrated with lazy loading and animations.');
});