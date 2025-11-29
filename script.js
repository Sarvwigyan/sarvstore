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
        this.scale = 1.0;
        
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
                        
                        <span id="zoomLevel" style="color: var(--text); margin: 0 10px;">100%</span>
                        
                        <button class="reader-btn" id="zoomIn">
                            <span>Zoom +</span>
                        </button>
                        
                        <!-- Bookmark -->
                        <button class="reader-btn bookmark-btn" id="toggleBookmark">
                            <span>🔖 Bookmark</span>
                        </button>
                        
                        <!-- Collections -->
                        <button class="reader-btn" id="showCollections">
                            <span>📚 Collections</span>
                        </button>
                        
                        <!-- Close -->
                        <button class="reader-btn" id="closeReader">
                            <span>✕ Close</span>
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
                        <div class="book-content-container">
                            <iframe id="bookIframe" class="book-iframe" title="Book viewer"></iframe>
                        </div>
                    </div>
                    
                    <!-- Sidebar -->
                    <div class="reader-sidebar" id="readerSidebar">
                        <div class="sidebar-header">
                            <h4>Reading Tools</h4>
                            <button class="close-sidebar" id="closeSidebar">✕</button>
                        </div>
                        <div class="sidebar-tabs">
                            <button class="tab-btn active" data-tab="bookmarks">📑 Bookmarks</button>
                            <button class="tab-btn" data-tab="notes">📝 Notes</button>
                            <button class="tab-btn" data-tab="collections">📚 Collections</button>
                        </div>
                        
                        <div class="tab-content">
                            <!-- Bookmarks Tab -->
                            <div class="tab-pane active" id="bookmarksTab">
                                <div class="bookmarks-list" id="bookmarksList">
                                    <div class="no-items">No bookmarks yet</div>
                                </div>
                                <button class="reader-btn" id="addBookmark" style="width: 100%; margin-top: 1rem;">
                                    ➕ Add Current Bookmark
                                </button>
                            </div>
                            
                            <!-- Notes Tab -->
                            <div class="tab-pane" id="notesTab">
                                <textarea 
                                    id="currentNote" 
                                    placeholder="Add your notes for this book here..."
                                    style="width: 100%; height: 120px; margin-bottom: 1rem; padding: 0.5rem; border-radius: 8px; background: rgba(255,255,255,0.1); color: var(--text); border: var(--border);"
                                ></textarea>
                                <button class="reader-btn" id="saveNote" style="width: 100%; margin-bottom: 1rem;">
                                    💾 Save Note
                                </button>
                                <div class="notes-list" id="notesList">
                                    <div class="no-items">No notes yet</div>
                                </div>
                            </div>
                            
                            <!-- Collections Tab -->
                            <div class="tab-pane" id="collectionsTab">
                                <div class="collection-grid" style="display: grid; gap: 0.5rem; margin-top: 1rem;">
                                    <div class="collection-card" data-collection="currently-reading">
                                        <div class="collection-icon">📖</div>
                                        <div class="collection-name">Currently Reading</div>
                                        <div class="collection-count">0 books</div>
                                    </div>
                                    <div class="collection-card" data-collection="want-to-read">
                                        <div class="collection-icon">📚</div>
                                        <div class="collection-name">Want to Read</div>
                                        <div class="collection-count">0 books</div>
                                    </div>
                                    <div class="collection-card" data-collection="finished">
                                        <div class="collection-icon">✅</div>
                                        <div class="collection-name">Finished</div>
                                        <div class="collection-count">0 books</div>
                                    </div>
                                    <div class="collection-card" data-collection="favorites">
                                        <div class="collection-icon">⭐</div>
                                        <div class="collection-name">Favorites</div>
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
                        <span>⏱️ Reading Time: <span id="readingTime">0m</span></span>
                        <span>📊 Progress: 
                            <div class="progress-bar">
                                <div class="progress-fill" id="progressFill" style="width: 0%"></div>
                            </div>
                            <span id="completionPercentage">0%</span>
                        </span>
                        <span>📅 Last Read: <span id="lastRead">Never</span></span>
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
        document.getElementById('closeSidebar').addEventListener('click', () => this.toggleSidebar());
        
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
        console.log('Opening book:', bookData);
        this.currentBook = bookData;
        this.readingSession = {
            bookId: bookData.id,
            startTime: Date.now(),
            readingTime: 0
        };
        
        // Show reader
        document.getElementById('enhancedBookReader').classList.add('active');
        document.getElementById('overlay').classList.add('active');
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
        
        this.showNotification(`Opened: ${bookData.title}`);
    }
    
    async loadBookContent(bookData) {
        this.isLoading = true;
        const iframe = document.getElementById('bookIframe');
        
        // Clear previous content
        iframe.src = '';
        
        // Set the book URL
        const bookUrl = bookData.file || bookData.downloadUrl;
        console.log('Loading book from:', bookUrl);
        
        if (!bookUrl) {
            this.showNotification('Error: No book URL found');
            return;
        }
        
        // Set iframe source
        iframe.src = bookUrl;
        
        // Setup loading handlers
        return new Promise((resolve) => {
            iframe.onload = () => {
                console.log('Book iframe loaded successfully');
                this.isLoading = false;
                this.setupScrollTracking();
                this.restoreReadingProgress();
                this.updateProgress();
                resolve();
            };
            
            iframe.onerror = () => {
                console.error('Failed to load book iframe');
                this.isLoading = false;
                this.showNotification('Error loading book content');
                resolve();
            };
            
            // Fallback timeout
            setTimeout(() => {
                if (this.isLoading) {
                    console.log('Book loading timeout');
                    this.isLoading = false;
                    this.showNotification('Book loaded (timeout fallback)');
                    resolve();
                }
            }, 5000);
        });
    }
    
    setupScrollTracking() {
        const iframe = document.getElementById('bookIframe');
        let scrollTimeout;
        
        // Try to track scroll position (works for same-origin content)
        try {
            iframe.contentWindow.addEventListener('scroll', () => {
                this.updateProgress();
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    this.saveProgress();
                }, 1000);
            });
        } catch (error) {
            console.log('Cross-origin restrictions - using fallback progress tracking');
            // Fallback: save progress periodically
            setInterval(() => {
                this.saveProgress();
            }, 30000);
        }
    }
    
    restoreReadingProgress() {
        const progress = this.getBookProgress(this.currentBook.id);
        if (progress && progress.page > 1) {
            this.currentPage = progress.page;
            document.getElementById('pageJump').value = this.currentPage;
            this.showNotification(`Restored to page ${this.currentPage}`);
        }
    }
    
    nextPage() {
        this.currentPage++;
        document.getElementById('pageJump').value = this.currentPage;
        this.scrollToCurrentPage();
        this.saveProgress();
    }
    
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            document.getElementById('pageJump').value = this.currentPage;
            this.scrollToCurrentPage();
            this.saveProgress();
        }
    }
    
    jumpToPage(page) {
        if (page >= 1) {
            this.currentPage = page;
            document.getElementById('pageJump').value = this.currentPage;
            this.scrollToCurrentPage();
            this.saveProgress();
        }
    }
    
    scrollToCurrentPage() {
        const iframe = document.getElementById('bookIframe');
        try {
            // Try to scroll to approximate position
            const pageHeight = iframe.contentDocument.documentElement.clientHeight;
            const scrollPosition = (this.currentPage - 1) * pageHeight;
            iframe.contentWindow.scrollTo(0, scrollPosition);
        } catch (error) {
            // Cross-origin restriction - can't scroll directly
            console.log('Cannot scroll due to cross-origin restrictions');
        }
    }
    
    zoomIn() {
        this.scale = Math.min(this.scale + 0.25, 3.0);
        this.applyZoom();
    }
    
    zoomOut() {
        this.scale = Math.max(this.scale - 0.25, 0.5);
        this.applyZoom();
    }
    
    applyZoom() {
        const iframe = document.getElementById('bookIframe');
        iframe.style.transform = `scale(${this.scale})`;
        iframe.style.transformOrigin = 'center top';
        document.getElementById('zoomLevel').textContent = `${Math.round(this.scale * 100)}%`;
    }
    
    toggleBookmark() {
        const bookmarks = this.getBookBookmarks(this.currentBook.id);
        const existingBookmark = bookmarks.find(b => b.page === this.currentPage);
        
        if (existingBookmark) {
            this.removeBookmark(existingBookmark.id);
            this.showNotification('Bookmark removed from page ' + this.currentPage);
        } else {
            this.addBookmarkAtCurrentPage();
            this.showNotification('Bookmark added to page ' + this.currentPage);
        }
    }
    
    addBookmark() {
        this.addBookmarkAtCurrentPage();
        this.showNotification('Bookmark added to page ' + this.currentPage);
    }
    
    addBookmarkAtCurrentPage(notes = '') {
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
                <div class="bookmark-content">
                    <div class="bookmark-page">📑 Page ${bookmark.page}</div>
                    ${bookmark.notes ? `<div class="bookmark-notes">${bookmark.notes}</div>` : ''}
                    <div class="bookmark-date">${new Date(bookmark.created).toLocaleDateString()}</div>
                </div>
                <button class="delete-bookmark" data-id="${bookmark.id}" title="Delete bookmark">✕</button>
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
        const progress = this.getBookProgress(this.currentBook.id);
        const currentProgress = progress?.progress || 0;
        
        document.getElementById('currentPage').textContent = `Page ${this.currentPage}`;
        document.getElementById('progressFill').style.width = `${currentProgress}%`;
        document.getElementById('completionPercentage').textContent = `${currentProgress}%`;
        
        if (progress && progress.lastRead) {
            document.getElementById('lastRead').textContent = new Date(progress.lastRead).toLocaleDateString();
        }
    }
    
    saveProgress() {
        if (!this.currentBook || !this.readingSession) return;
        
        const progress = {
            page: this.currentPage,
            progress: Math.min(100, Math.max(0, this.currentPage)), // Simple progress based on page number
            lastRead: new Date().toISOString(),
            readingTime: this.readingSession.readingTime + Math.floor((Date.now() - this.readingSession.startTime) / 60000)
        };
        
        this.saveBookProgress(this.currentBook.id, progress);
        
        // Update reading time display
        document.getElementById('readingTime').textContent = `${progress.readingTime}m`;
        document.getElementById('lastRead').textContent = 'Just now';
        
        this.updateProgress();
    }
    
    startReadingSession() {
        this.readingSession.startTime = Date.now();
    }
    
    closeReader() {
        this.saveProgress();
        document.getElementById('enhancedBookReader').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
        document.body.classList.remove('modal-open');
        document.getElementById('bookIframe').src = '';
        this.currentBook = null;
        this.readingSession = null;
        this.showNotification('Reading session saved');
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
            case 'n':
                e.preventDefault();
                document.getElementById('currentNote').focus();
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
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    // Data Management Methods
    getUserLibrary() {
        try {
            return JSON.parse(localStorage.getItem('userLibrary') || '{"books": {}, "collections": {}}');
        } catch (error) {
            console.error('Error loading user library:', error);
            return { books: {}, collections: {} };
        }
    }
    
    saveUserLibrary(library) {
        try {
            localStorage.setItem('userLibrary', JSON.stringify(library));
            return true;
        } catch (error) {
            console.error('Error saving user library:', error);
            return false;
        }
    }
    
    getBookProgress(bookId) {
        const library = this.getUserLibrary();
        return library.books[bookId]?.progress;
    }
    
    saveBookProgress(bookId, progress) {
        const library = this.getUserLibrary();
        if (!library.books[bookId]) library.books[bookId] = {};
        library.books[bookId].progress = progress;
        return this.saveUserLibrary(library);
    }
    
    getBookBookmarks(bookId) {
        const library = this.getUserLibrary();
        return library.books[bookId]?.bookmarks || [];
    }
    
    saveBookBookmarks(bookId, bookmarks) {
        const library = this.getUserLibrary();
        if (!library.books[bookId]) library.books[bookId] = {};
        library.books[bookId].bookmarks = bookmarks;
        return this.saveUserLibrary(library);
    }
    
    getBookNotes(bookId) {
        const library = this.getUserLibrary();
        return library.books[bookId]?.notes || [];
    }
    
    saveBookNotes(bookId, notes) {
        const library = this.getUserLibrary();
        if (!library.books[bookId]) library.books[bookId] = {};
        library.books[bookId].notes = notes;
        return this.saveUserLibrary(library);
    }
    
    getBookCollections(bookId) {
        const library = this.getUserLibrary();
        return library.books[bookId]?.collections || [];
    }
    
    saveBookCollections(bookId, collections) {
        const library = this.getUserLibrary();
        if (!library.books[bookId]) library.books[bookId] = {};
        library.books[bookId].collections = collections;
        return this.saveUserLibrary(library);
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
            const initialLibrary = {
                books: {},
                collections: {
                    'currently-reading': [],
                    'want-to-read': [],
                    'finished': [],
                    'favorites': []
                }
            };
            this.saveUserLibrary(initialLibrary);
            console.log('Initialized user library in localStorage');
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
        console.log('Opening book in enhanced reader:', item.title);
        openEnhancedBookReader(item);
    } else {
        // Use simple iframe for journals
        console.log('Opening journal in simple viewer:', item.title);
        const iframe = document.getElementById('bookIframe');
        iframe.src = url;
        document.getElementById('bookModal').classList.add('active');
        document.getElementById('overlay').classList.add('active');
        lockBodyScroll();
    }
}

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

// Add enhanced reader styles
const enhancedReaderStyles = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .book-content-container {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        overflow: auto;
    }
    
    .book-iframe {
        width: 100%;
        height: 100%;
        border: none;
        background: white;
    }
    
    .page-input {
        width: 60px;
        background: rgba(255,255,255,0.1);
        border: var(--border);
        border-radius: 6px;
        color: var(--text);
        padding: 0.4rem;
        text-align: center;
    }
    
    .sidebar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: var(--border);
    }
    
    .close-sidebar {
        background: none;
        border: none;
        color: var(--text);
        cursor: pointer;
        font-size: 1.2rem;
    }
    
    .bookmark-content {
        flex: 1;
    }
    
    .bookmark-date, .note-date {
        font-size: 0.8rem;
        color: var(--secondary-text);
        margin-top: 0.25rem;
    }
    
    .collection-name {
        font-weight: 500;
    }
    
    .reader-sidebar.active {
        transform: translateX(0);
    }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = enhancedReaderStyles;
document.head.appendChild(styleSheet);

// Main Initialization
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize enhanced book reader FIRST
    enhancedReader = new EnhancedBookReader();
    console.log('Enhanced book reader initialized');
    
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

    // Add scroll event listener for lazy loading
    window.addEventListener('scroll', handleScroll);

    // Event listeners
    document.getElementById('closeBtn').addEventListener('click', closeDetail);
    document.getElementById('bookModalClose').addEventListener('click', closeBookModal);
    document.getElementById('settingsIcon').addEventListener('click', toggleSettings);
    document.getElementById('saveSettings').addEventListener('click', saveSettings);

    // Use the improved overlay click handler
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

    // Use improved escape key handler
    document.addEventListener('keydown', handleEscapeKey);

    // Default to "All" tab
    switchTab('all');

    console.log('Sarvstore ready! Enhanced book reader with REAL book loading and localStorage saving.');
});