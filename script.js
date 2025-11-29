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

// Initialize the enhanced reader when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.enhancedReader = new EnhancedBookReader();
    
    // Add demo button to test the reader
    const demoButton = document.createElement('button');
    demoButton.textContent = 'Test Enhanced Reader';
    demoButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--primary);
        color: white;
        border: none;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        cursor: pointer;
        z-index: 1000;
        font-weight: bold;
    `;
    demoButton.addEventListener('click', () => {
        // Demo book data
        const demoBook = {
            id: 'demo-book-1',
            title: 'Sample Physics Textbook',
            pages: 150,
            type: 'textbook',
            verified: true
        };
        
        window.enhancedReader.openBook(demoBook);
    });
    
    document.body.appendChild(demoButton);
});