/* =================================================================
   कोष (Kosh) — v3.5
   Fixed: master/displayed data split (search no longer corrupts state),
          inline onerror → JS event delegation, faster image fallback.
   All original features preserved.
   ================================================================= */
(function () {
    'use strict';

    /* ---------- tiny DOM helpers ---------- */
    const $  = (s, c) => (c || document).querySelector(s);
    const $$ = (s, c) => Array.prototype.slice.call((c || document).querySelectorAll(s));

    /* ---------- fallback image (inline SVG, works offline) ---------- */
    const FALLBACK_IMG = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">' +
        '<rect width="80" height="80" rx="8" fill="#FBF6EC"/>' +
        '<text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" ' +
        'fill="#C5442C" font-family="serif" font-size="38" font-weight="bold">\u0950</text>' +
        '</svg>'
    );

    /* =============================================================
       1. THEME
       ============================================================= */
    const THEME_KEY = 'sarvwigyan-theme';
    const VALID_THEMES = ['light', 'dark', 'pure'];

    function readTheme() {
        try {
            const t = localStorage.getItem(THEME_KEY);
            if (VALID_THEMES.indexOf(t) !== -1) return t;
        } catch (_) {}
        return 'light';
    }

    function applyTheme(theme) {
        if (VALID_THEMES.indexOf(theme) === -1) theme = 'light';
        document.documentElement.setAttribute('data-theme', theme);
        try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
        const sel = document.getElementById('theme');
        if (sel) sel.value = theme;
    }

    applyTheme(readTheme());

    /* =============================================================
       2. STATE
       ============================================================= */
    const storeData = { books: [], journals: [] };

    /* Master list — never mutated by search/render */
    const allItems = { all: [], books: [], journals: [], recent: [] };

    /* What is currently rendered in the DOM (may be filtered/searched) */
    const displayedItems = { all: [], books: [], journals: [], recent: [] };

    const CARDS_PER_PAGE = 20;
    const currentPage  = { all: 0, books: 0, journals: 0, recent: 0 };
    const hasMoreItems = { all: true, books: true, journals: true, recent: true };

    let isLoading = false;
    let activeModals = [];
    let currentBookId = null;
    let readerScale = 1.0;

    /* =============================================================
       3. READING PROGRESS
       ============================================================= */
    const SarvwigyanProgress = (function () {
        const syncEndpoint = null;   // set a URL to enable remote sync

        function keyFor(id) { return 'readingProgress_' + id; }

        function save(bookId, data) {
            const payload = {
                scrollY: Math.max(0, data.scrollY || 0),
                percent: Math.max(0, Math.min(100, Math.round(data.percent || 0))),
                timestamp: Date.now(),
                lastRead: new Date().toISOString()
            };
            try { localStorage.setItem(keyFor(bookId), JSON.stringify(payload)); } catch (_) {}

            if (syncEndpoint) {
                fetch(syncEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(Object.assign({ bookId: bookId }, payload)),
                    keepalive: true
                }).catch(function () {});
            }
        }

        function load(bookId) {
            try {
                const raw = localStorage.getItem(keyFor(bookId));
                return raw ? JSON.parse(raw) : null;
            } catch (_) { return null; }
        }

        function clear(bookId) {
            try { localStorage.removeItem(keyFor(bookId)); } catch (_) {}
        }

        function clearAll() {
            const remove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.indexOf('readingProgress_') === 0) remove.push(k);
            }
            remove.forEach(function (k) { localStorage.removeItem(k); });
        }

        function estimatePercent(p) {
            if (!p) return 0;
            if (typeof p.percent === 'number') return p.percent;
            return Math.min(100, Math.round(((p.scrollY || 0) / 8000) * 100));
        }

        return { save: save, load: load, clear: clear, clearAll: clearAll, estimatePercent: estimatePercent };
    })();

    /* =============================================================
       4. IFRAME SCROLL TRACKING
       ============================================================= */
    function restoreScrollPosition(iframe, bookId) {
        const p = SarvwigyanProgress.load(bookId);
        if (!p || p.scrollY <= 0) return;

        function restore() {
            try {
                if (iframe.contentWindow) iframe.contentWindow.scrollTo(0, p.scrollY);
            } catch (_) {}
            setTimeout(function () {
                try { if (iframe.contentWindow) iframe.contentWindow.scrollTo(0, p.scrollY); } catch (_) {}
            }, 500);
            setTimeout(function () {
                try { if (iframe.contentWindow) iframe.contentWindow.scrollTo(0, p.scrollY); } catch (_) {}
            }, 1200);
        }

        try {
            if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') restore();
            else iframe.onload = restore;
        } catch (_) {}
    }

    function setupScrollTracking(iframe, bookId) {
        let debounceTimer;

        function track() {
            try {
                if (!iframe.contentWindow) return;
                const win = iframe.contentWindow;
                const doc = iframe.contentDocument;
                const y = win.scrollY || doc.documentElement.scrollTop;
                const docH = Math.max(doc.documentElement.scrollHeight, (doc.body && doc.body.scrollHeight) || 0);
                const viewport = win.innerHeight || 800;
                const total = Math.max(1, docH - viewport);
                const percent = Math.min(100, Math.round((y / total) * 100));

                if (y > 100) {
                    clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(function () {
                        SarvwigyanProgress.save(bookId, { scrollY: y, percent: percent });
                    }, 900);
                }
            } catch (_) {}
        }

        try {
            if (iframe.contentWindow) {
                iframe.contentWindow.addEventListener('scroll', track, { passive: true });
                iframe.onload = function () {
                    restoreScrollPosition(iframe, bookId);
                    try {
                        iframe.contentWindow.addEventListener('scroll', track, { passive: true });
                    } catch (_) {}
                };
            }
        } catch (_) {}
    }

    /* =============================================================
       5. RECENT ITEMS
       ============================================================= */
    function addToRecentItems(item) {
        if (!item || !item.id) return;

        let recentItems = [];
        try { recentItems = JSON.parse(localStorage.getItem('recentItems') || '[]'); } catch (_) {}

        recentItems = recentItems.filter(function (r) { return r.id !== item.id; });
        recentItems.unshift(item);
        recentItems = recentItems.slice(0, 10);

        try { localStorage.setItem('recentItems', JSON.stringify(recentItems)); } catch (_) {}

        allItems.recent = recentItems;

        const recentEl = document.getElementById('recent');
        if (recentEl && recentEl.classList.contains('active')) {
            renderCards(recentItems, 'recentGrid', true);
        }
    }

    /* =============================================================
       6. SCROLL LOCK
       ============================================================= */
    function lockBodyScroll() {
        if (activeModals.length === 0) document.body.classList.add('modal-open');
        activeModals.push('lock');
    }

    function unlockBodyScroll() {
        activeModals.pop();
        if (activeModals.length === 0) document.body.classList.remove('modal-open');
    }

    function closeAllModals() {
        const ids = ['bookModal', 'detailView', 'settingsWindow'];
        let closedAny = false;
        ids.forEach(function (id) {
            const m = document.getElementById(id);
            if (m && m.classList.contains('active')) {
                m.classList.remove('active');
                closedAny = true;
            }
        });
        if (closedAny) {
            const ov = document.getElementById('overlay');
            if (ov) ov.classList.remove('active');
            activeModals = [];
            document.body.classList.remove('modal-open');
            currentBookId = null;
            try { history.replaceState(null, '', window.location.pathname); } catch (_) {}
        }
    }

    /* =============================================================
       7. SKELETONS
       ============================================================= */
    function renderSkeletons(gridId, count) {
        const grid = document.getElementById(gridId);
        if (!grid) return;
        count = count || 12;
        let html = '';
        for (let i = 0; i < count; i++) {
            html += '<div class="skeleton-card" aria-hidden="true">' +
                '<div class="skeleton-block skeleton-logo"></div>' +
                '<div class="skeleton-block skeleton-title"></div>' +
                '<div class="skeleton-block skeleton-title-2"></div>' +
                '<div class="skeleton-block skeleton-type"></div>' +
                '<div class="skeleton-block skeleton-btn"></div>' +
            '</div>';
        }
        grid.innerHTML = html;
    }

    /* =============================================================
       8. PAGINATION
       ============================================================= */
    function getPaginatedItems(items, section, reset) {
        if (reset) {
            currentPage[section] = 0;
            hasMoreItems[section] = items.length > 0;
        }
        const startIndex = currentPage[section] * CARDS_PER_PAGE;
        const endIndex = startIndex + CARDS_PER_PAGE;
        const slice = items.slice(startIndex, endIndex);
        hasMoreItems[section] = endIndex < items.length;
        return slice;
    }

    function loadMoreItems(section) {
        if (isLoading || !hasMoreItems[section]) return;
        isLoading = true;
        showLoadingIndicator(section);

        setTimeout(function () {
            currentPage[section]++;
            // FIXED: paginate from what's actually shown, not from master
            const items = displayedItems[section] || [];
            const paginated = getPaginatedItems(items, section, false);
            appendCards(paginated, section + 'Grid');

            isLoading = false;
            hideLoadingIndicator();

            if (!hasMoreItems[section]) showNoMoreItems(section);
        }, 500);
    }

    function showLoadingIndicator(section) {
        const el = document.getElementById('loadingIndicator');
        if (!el) return;
        el.style.display = 'block';
        el.innerHTML =
            '<div class="diya-loader" aria-hidden="true">' +
                '<div class="diya-flame"></div>' +
                '<div class="diya-base"></div>' +
            '</div>' +
            '<div class="loading-text">' + getLoadingMessage(section) + '</div>';
    }

    function hideLoadingIndicator() {
        const el = document.getElementById('loadingIndicator');
        if (el) el.style.display = 'none';
    }

    function showNoMoreItems(section) {
        const el = document.getElementById('loadingIndicator');
        if (!el) return;
        el.style.display = 'block';
        el.innerHTML =
            '<div class="no-more-items">' +
                '<i class="fas fa-circle-check"></i>' +
                '<div>' + getCompleteMessage(section) + '</div>' +
            '</div>';
        setTimeout(function () { el.style.display = 'none'; }, 2800);
    }

    function getLoadingMessage(section) {
        switch (section) {
            case 'all':      return 'ज्ञान का दीप जल रहा है...';
            case 'books':    return 'ग्रंथों का संग्रह खुल रहा है...';
            case 'journals': return 'शोध-पत्रिकाएँ आ रही हैं...';
            case 'recent':   return 'आपका पठन इतिहास लोड हो रहा है...';
            default:         return 'लोड हो रहा है...';
        }
    }

    function getCompleteMessage(section) {
        switch (section) {
            case 'all':      return 'समस्त संसाधन पूर्ण हुए';
            case 'books':    return 'समस्त ग्रंथ पूर्ण हुए';
            case 'journals': return 'समस्त शोध-पत्रिकाएँ पूर्ण हुईं';
            case 'recent':   return 'आपका पठन इतिहास पूर्ण हुआ';
            default:         return 'सब कुछ लोड हो गया';
        }
    }

    function isScrolledToBottom() {
        const st = window.scrollY || document.documentElement.scrollTop;
        const sh = document.documentElement.scrollHeight;
        const ch = document.documentElement.clientHeight;
        return st + ch >= sh - 250;
    }

    let scrollRafPending = false;
    function handleScroll() {
        if (scrollRafPending) return;
        scrollRafPending = true;
        requestAnimationFrame(function () {
            const active = document.querySelector('.section.active');
            if (active && isScrolledToBottom() && hasMoreItems[active.id] && !isLoading) {
                loadMoreItems(active.id);
            }
            scrollRafPending = false;
        });
    }

    /* =============================================================
       9. CARD RENDERING
       ============================================================= */
    function escapeAttr(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function buildProgressRing(percent) {
        if (!percent || percent <= 0) return '';
        const clamped = Math.max(0, Math.min(100, percent));
        const r = 14;
        const c = 2 * Math.PI * r;
        const offset = c - (clamped / 100) * c;
        return '<div class="progress-ring-wrap" title="पढ़ना जारी रखें — ' + clamped + '%">' +
            '<svg class="progress-ring" viewBox="0 0 34 34">' +
                '<circle class="progress-ring-bg" cx="17" cy="17" r="' + r + '"></circle>' +
                '<circle class="progress-ring-fg" cx="17" cy="17" r="' + r + '" ' +
                    'stroke-dasharray="' + c.toFixed(2) + '" ' +
                    'stroke-dashoffset="' + offset.toFixed(2) + '"></circle>' +
            '</svg>' +
            '<span class="progress-ring-text">' + clamped + '</span>' +
        '</div>';
    }

    function buildCardHtml(item) {
        const progress = SarvwigyanProgress.load(item.id);
        const percent = progress ? SarvwigyanProgress.estimatePercent(progress) : 0;
        const ring = buildProgressRing(percent);
        const fileUrl = item.file || item.downloadUrl || '';
        const verified = item.verified ? ' <i class="fas fa-circle-check"></i>' : '';

        return '<div class="card" data-item-id="' + escapeAttr(item.id) + '" role="button" tabindex="0">' +
            ring +
            '<img src="' + escapeAttr(item.logo) + '" alt="' + escapeAttr(item.title) + '" ' +
                'class="card-logo" loading="lazy">' +
            '<div class="card-title">' + escapeAttr(item.title) + '</div>' +
            '<div class="card-type">' + escapeAttr(item.type) + verified + '</div>' +
            '<button type="button" class="card-download" ' +
                'data-url="' + escapeAttr(fileUrl) + '" ' +
                'data-id="' + escapeAttr(item.id) + '">' +
                '<i class="fas fa-book-open-reader"></i> अध्ययन करें' +
            '</button>' +
        '</div>';
    }

    /* FIXED: attach image fallback via JS — no inline onerror */
    function attachImageFallbacks(grid) {
        grid.querySelectorAll('img.card-logo:not([data-fallback-bound])').forEach(function (img) {
            img.setAttribute('data-fallback-bound', '1');
            img.addEventListener('error', function () {
                if (this.src !== FALLBACK_IMG) this.src = FALLBACK_IMG;
            }, { once: true });
        });
    }

    function appendCards(items, gridId) {
        const grid = document.getElementById(gridId);
        if (!grid) return;
        grid.insertAdjacentHTML('beforeend', items.map(buildCardHtml).join(''));
        attachImageFallbacks(grid);
        bindCardsInGrid(grid);
    }

    function renderCards(items, gridId, reset) {
        const grid = document.getElementById(gridId);
        if (!grid) return;

        const noResults = document.getElementById(gridId.replace('Grid', 'NoResults'));
        const section = gridId.replace('Grid', '');

        // FIXED: only track what's DISPLAYED, never overwrite master
        displayedItems[section] = items;

        const indicator = document.getElementById('loadingIndicator');
        if (indicator && (gridId === 'booksGrid' || reset)) {
            indicator.style.display = 'none';
        }

        if (reset) {
            currentPage[section] = 0;
            hasMoreItems[section] = items.length > 0;
        }

        if (items.length === 0) {
            grid.innerHTML = '';
            if (noResults) noResults.style.display = 'block';
            return;
        }

        if (noResults) noResults.style.display = 'none';

        const paginated = getPaginatedItems(items, section, reset);

        if (reset) {
            grid.innerHTML = paginated.map(buildCardHtml).join('');
            attachImageFallbacks(grid);
            bindCardsInGrid(grid);
        } else {
            appendCards(paginated, gridId);
        }

        if (indicator && hasMoreItems[section] && items.length > CARDS_PER_PAGE && reset) {
            indicator.style.display = 'block';
            indicator.innerHTML =
                '<div class="scroll-hint">' +
                    '<i class="fas fa-hand-pointer"></i>' +
                    '<div>और देखने के लिए नीचे स्क्रॉल करें</div>' +
                '</div>';
            setTimeout(function () {
                if (indicator && indicator.querySelector('.scroll-hint')) {
                    indicator.style.display = 'none';
                }
            }, 4500);
        }
    }

    function bindCardsInGrid(grid) {
        if (grid.dataset.delegated === 'true') return;
        grid.dataset.delegated = 'true';

        grid.addEventListener('click', function (e) {
            const dl = e.target.closest('.card-download');
            if (dl) {
                e.stopPropagation();
                handleDownloadClick(e, dl.getAttribute('data-url'), dl.getAttribute('data-id'));
                return;
            }
            const card = e.target.closest('.card');
            if (card) {
                const item = findItemById(card.getAttribute('data-item-id'));
                if (item) openDetail(item);
            }
        });

        grid.addEventListener('keydown', function (e) {
            if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('card')) {
                e.preventDefault();
                const item = findItemById(e.target.getAttribute('data-item-id'));
                if (item) openDetail(item);
            }
        });
    }

    function findItemById(id) {
        const all = storeData.books.concat(storeData.journals);
        for (let i = 0; i < all.length; i++) {
            if (all[i].id == id) return all[i];
        }
        return null;
    }

    /* =============================================================
       10. TABS
       ============================================================= */
    function switchTab(tabId) {
        $$('.section').forEach(function (s) { s.classList.remove('active'); });
        $$('.tab').forEach(function (t) {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
        });

        const section = document.getElementById(tabId);
        if (section) section.classList.add('active');

        const tab = document.querySelector('[data-tab="' + tabId + '"]');
        if (tab) {
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
        }

        // Clear search box when switching tabs
        const search = document.getElementById('searchInput');
        if (search && search.value) {
            search.value = '';
        }

        if (tabId === 'recent') {
            let recent = [];
            try { recent = JSON.parse(localStorage.getItem('recentItems') || '[]'); } catch (_) {}
            allItems.recent = recent;
            renderCards(recent, 'recentGrid', true);
        }
    }

    function initTabs() {
        $$('.tab').forEach(function (tab) {
            tab.addEventListener('click', function (e) {
                e.preventDefault();
                switchTab(tab.getAttribute('data-tab'));
            });
            tab.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    switchTab(tab.getAttribute('data-tab'));
                }
            });
        });
    }

    /* =============================================================
       11. SEARCH (FIXED — no longer corrupts master data)
       ============================================================= */
    function initSearch() {
        const input = document.getElementById('searchInput');
        if (!input) return;

        let timer;
        input.addEventListener('input', function () {
            clearTimeout(timer);
            timer = setTimeout(function () {
                const query = input.value.toLowerCase().trim();
                const active = document.querySelector('.section.active');
                if (!active) return;
                const sectionId = active.id;

                // FIXED: always filter from the MASTER list
                let source = [];
                switch (sectionId) {
                    case 'all':      source = allItems.all; break;
                    case 'books':    source = allItems.books; break;
                    case 'journals': source = allItems.journals; break;
                    case 'recent':   source = allItems.recent; break;
                }

                if (!query) {
                    renderCards(source, sectionId + 'Grid', true);
                    return;
                }

                const filtered = source.filter(function (i) {
                    return (i.title || '').toLowerCase().indexOf(query) !== -1 ||
                        (i.shortDesc && i.shortDesc.toLowerCase().indexOf(query) !== -1) ||
                        (i.longDesc && i.longDesc.toLowerCase().indexOf(query) !== -1) ||
                        (i.type || '').toLowerCase().indexOf(query) !== -1;
                });
                renderCards(filtered, sectionId + 'Grid', true);
            }, 180);
        });

        document.addEventListener('keydown', function (e) {
            const isMac = (navigator.platform || '').toUpperCase().indexOf('MAC') !== -1;
            const mod = isMac ? e.metaKey : e.ctrlKey;
            if (mod && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                input.focus();
                input.select();
            }
            if (e.key === 'Escape' && document.activeElement === input) {
                input.value = '';
                input.dispatchEvent(new Event('input'));
                input.blur();
            }
        });
    }

    /* =============================================================
       12. SETTINGS
       ============================================================= */
    function initSettings() {
        applyTheme(readTheme());
    }

    function toggleSettings() {
        const sw = document.getElementById('settingsWindow');
        const ov = document.getElementById('overlay');
        if (!sw || !ov) return;

        const wasOpen = sw.classList.contains('active');
        if (!wasOpen) closeAllModals();

        sw.classList.toggle('active');
        ov.classList.toggle('active');

        if (!wasOpen) {
            lockBodyScroll();
            try { history.pushState({ modal: 'settings' }, '', '#settings'); } catch (_) {}
        } else {
            unlockBodyScroll();
            try { history.replaceState(null, '', window.location.pathname); } catch (_) {}
        }
    }

    function saveSettings() {
        const sel = document.getElementById('theme');
        if (sel) applyTheme(sel.value);
        toggleSettings();
    }

    /* =============================================================
       13. DETAIL VIEW
       ============================================================= */
    function openDetail(item) {
        addToRecentItems(item);

        const logoEl = document.getElementById('detailLogo');
        if (logoEl) { logoEl.src = item.logo; logoEl.alt = item.title + ' logo'; }

        const titleEl = document.getElementById('detailTitle');
        if (titleEl) titleEl.textContent = item.title;

        const typeEl = document.getElementById('detailType');
        if (typeEl) typeEl.textContent = item.type;

        const verifiedEl = document.getElementById('detailVerified');
        if (verifiedEl) {
            verifiedEl.innerHTML = item.verified
                ? '<i class="fas fa-circle-check" style="color:var(--success)"></i> प्रमाणित'
                : '';
            const progress = SarvwigyanProgress.load(item.id);
            if (progress) {
                const pct = SarvwigyanProgress.estimatePercent(progress);
                const info = document.createElement('div');
                info.className = 'detail-progress';
                info.innerHTML = '<i class="fas fa-bookmark"></i> ' + pct + '% पूर्ण — जहाँ छोड़ा था वहीं से जारी रखें';
                verifiedEl.appendChild(info);
            }
        }

        const shortEl = document.getElementById('detailShortDesc');
        if (shortEl) shortEl.textContent = item.shortDesc || '';

        const longEl = document.getElementById('detailLongDesc');
        if (longEl) longEl.textContent = item.longDesc || '';

        const imagesDiv = document.getElementById('detailImages');
        if (imagesDiv) {
            imagesDiv.innerHTML = '';
            if (item.images && item.images.length) {
                item.images.forEach(function (src, idx) {
                    const img = document.createElement('img');
                    img.src = src;
                    img.alt = (item.imageAlts && item.imageAlts[idx]) || (item.title + ' image ' + (idx + 1));
                    img.style.cursor = 'pointer';
                    img.loading = 'lazy';
                    img.onerror = function () { this.src = FALLBACK_IMG; };
                    img.onclick = function () { window.open(src, '_blank', 'noopener,noreferrer'); };
                    imagesDiv.appendChild(img);
                });
            }
        }

        const btn = document.getElementById('detailDownload');
        if (btn) {
            const progress = SarvwigyanProgress.load(item.id);
            const span = btn.querySelector('span');
            if (span) span.textContent = progress ? 'जारी रखें' : 'अध्ययन करें';
            btn.onclick = function () {
                handleDownloadClick(null, item.file || item.downloadUrl || '', item.id);
            };
        }

        closeAllModals();

        const detail = document.getElementById('detailView');
        const ov = document.getElementById('overlay');
        if (detail) detail.classList.add('active');
        if (ov) ov.classList.add('active');
        lockBodyScroll();
        try { history.pushState({ modal: 'detail' }, '', '#detail'); } catch (_) {}
    }

    function closeDetail() {
        const el = document.getElementById('detailView');
        const ov = document.getElementById('overlay');
        if (el) el.classList.remove('active');
        if (ov) ov.classList.remove('active');
        unlockBodyScroll();
        try { history.replaceState(null, '', window.location.pathname); } catch (_) {}
    }

    /* =============================================================
       14. BOOK MODAL
       ============================================================= */
    function handleDownloadClick(event, url, itemId) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }

        currentBookId = itemId;

        if (event) {
            const card = event.target.closest('.card');
            if (card) {
                const item = findItemById(card.getAttribute('data-item-id'));
                if (item) addToRecentItems(item);
            }
        }

        if (!url) {
            alert('यह सामग्री अभी उपलब्ध नहीं है।');
            return;
        }

        closeAllModals();

        const iframe = document.getElementById('bookIframe');
        const modal = document.getElementById('bookModal');
        const ov = document.getElementById('overlay');

        if (iframe) {
            iframe.src = url;
            iframe.style.transform = 'scale(1)';
            readerScale = 1.0;
        }

        const currentItem = findItemById(itemId);
        const titleEl = document.getElementById('readerBookTitle');
        if (titleEl) {
            titleEl.innerHTML = '<i class="fas fa-book-open"></i> ' +
                (currentItem ? currentItem.title : 'डिजिटल ग्रंथ वाचक');
        }

        if (modal) modal.classList.add('active');
        if (ov) ov.classList.add('active');
        lockBodyScroll();
        try { history.pushState({ modal: 'book' }, '', '#book'); } catch (_) {}

        setTimeout(function () {
            if (iframe) setupScrollTracking(iframe, itemId);
        }, 1000);
    }

    function closeBookModal() {
        if (currentBookId) {
            try {
                const iframe = document.getElementById('bookIframe');
                if (iframe && iframe.contentWindow) {
                    const y = iframe.contentWindow.scrollY || iframe.contentDocument.documentElement.scrollTop;
                    if (y > 100) {
                        const doc = iframe.contentDocument;
                        const docH = Math.max(doc.documentElement.scrollHeight, (doc.body && doc.body.scrollHeight) || 0);
                        const viewport = iframe.contentWindow.innerHeight || 800;
                        const total = Math.max(1, docH - viewport);
                        const pct = Math.min(100, Math.round((y / total) * 100));
                        SarvwigyanProgress.save(currentBookId, { scrollY: y, percent: pct });
                    }
                }
            } catch (_) {}
        }

        const modal = document.getElementById('bookModal');
        const iframe = document.getElementById('bookIframe');
        const ov = document.getElementById('overlay');

        if (modal) modal.classList.remove('active');
        if (iframe) iframe.src = '';
        if (ov) ov.classList.remove('active');
        unlockBodyScroll();
        try { history.replaceState(null, '', window.location.pathname); } catch (_) {}
        currentBookId = null;
    }

    function initReaderToolbar() {
        const zoomIn = document.getElementById('readerZoomIn');
        const zoomOut = document.getElementById('readerZoomOut');
        const zoomReset = document.getElementById('readerZoomReset');
        const fullscreenBtn = document.getElementById('readerFullscreen');
        const iframe = document.getElementById('bookIframe');
        const modal = document.getElementById('bookModal');
        if (!iframe) return;

        if (zoomIn) {
            zoomIn.addEventListener('click', function () {
                readerScale = Math.min(readerScale + 0.15, 2.5);
                iframe.style.transform = 'scale(' + readerScale + ')';
            });
        }
        if (zoomOut) {
            zoomOut.addEventListener('click', function () {
                readerScale = Math.max(readerScale - 0.15, 0.4);
                iframe.style.transform = 'scale(' + readerScale + ')';
            });
        }
        if (zoomReset) {
            zoomReset.addEventListener('click', function () {
                readerScale = 1.0;
                iframe.style.transform = 'scale(1)';
            });
        }
        if (fullscreenBtn && modal) {
            fullscreenBtn.addEventListener('click', function () {
                if (!document.fullscreenElement) {
                    if (modal.requestFullscreen) modal.requestFullscreen().catch(function () {});
                } else {
                    document.exitFullscreen().catch(function () {});
                }
            });
        }
    }

    /* =============================================================
       15. FILTERS
       ============================================================= */
    function toggleLanguageDropdown() {
        const dd = document.getElementById('languageCheckboxes');
        const arrow = document.getElementById('langDropdownArrow');
        if (!dd || !arrow) return;
        const open = dd.classList.contains('active') || dd.style.display === 'block';
        dd.classList.toggle('active', !open);
        dd.style.display = open ? 'none' : 'block';
        arrow.classList.toggle('rotate', !open);
    }

    function toggleAllLanguages(cb) {
        $$('.lang-checkbox').forEach(function (c) { c.checked = cb.checked; });
        updateSelectedLanguagesLabel();
        filterBooksByLanguage();
    }

    function updateSelectedLanguagesLabel() {
        const checked = $$('.lang-checkbox:checked');
        const labels = checked.map(function (cb) {
            return cb.value.charAt(0).toUpperCase() + cb.value.slice(1);
        }).join(', ');
        const el = document.getElementById('selectedLanguagesLabel');
        if (el) el.textContent = labels || 'भाषा चुनें';
    }

    function filterBooksByLanguage() {
        const sel = $$('.lang-checkbox:checked').map(function (cb) { return cb.value.toLowerCase(); });
        let filtered = storeData.books;
        if (sel.length) {
            filtered = filtered.filter(function (b) {
                return sel.indexOf((b.language || '').toLowerCase()) !== -1;
            });
        }
        // Update master for books tab
        allItems.books = filtered;
        renderCards(filtered, 'booksGrid', true);
    }

    function handleMainFilterChange() {
        const f = document.getElementById('booksFilter');
        if (!f) return;
        const v = f.value;
        const wrapper = document.getElementById('languageFilterWrapper');
        const arrow = document.getElementById('mainFilterArrow');
        if (arrow) arrow.classList.toggle('rotate', v !== '');

        if (v === 'language') {
            if (wrapper) wrapper.style.display = 'block';
            filterBooksByLanguage();
        } else {
            if (wrapper) wrapper.style.display = 'none';
            allItems.books = storeData.books;
            renderCards(storeData.books, 'booksGrid', true);
        }
    }

    /* =============================================================
       16. DATA LOADER
       ============================================================= */
    async function loadDataFromJSON() {
        renderSkeletons('allGrid', 12);
        renderSkeletons('booksGrid', 12);
        renderSkeletons('journalsGrid', 8);

        function fetchJson(url) {
            return fetch(url).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });
        }

        try {
            const results = await Promise.all([
                fetchJson('books.json'),
                fetchJson('journals.json')
            ]);
            storeData.books = results[0] || [];
            storeData.journals = results[1] || [];

            allItems.all = storeData.books.concat(storeData.journals);
            allItems.books = storeData.books;
            allItems.journals = storeData.journals;
            try { allItems.recent = JSON.parse(localStorage.getItem('recentItems') || '[]'); } catch (_) { allItems.recent = []; }
        } catch (err) {
            console.error('Data load error:', err);
        }
    }

    /* =============================================================
       17. GLOBAL HANDLERS
       ============================================================= */
    function handleOverlayClick(e) {
        const ov = document.getElementById('overlay');
        if (e.target !== ov) return;
        if (document.getElementById('bookModal').classList.contains('active')) closeBookModal();
        else if (document.getElementById('detailView').classList.contains('active')) closeDetail();
        else if (document.getElementById('settingsWindow').classList.contains('active')) toggleSettings();
    }

    function handlePopState() {
        if (document.getElementById('bookModal').classList.contains('active')) closeBookModal();
        else if (document.getElementById('detailView').classList.contains('active')) closeDetail();
        else if (document.getElementById('settingsWindow').classList.contains('active')) toggleSettings();
    }

    function handleEscapeKey(e) {
        if (e.key !== 'Escape') return;
        if (document.getElementById('bookModal').classList.contains('active')) closeBookModal();
        else if (document.getElementById('detailView').classList.contains('active')) closeDetail();
        else if (document.getElementById('settingsWindow').classList.contains('active')) toggleSettings();
        else {
            const langBox = document.getElementById('languageCheckboxes');
            if (langBox && (langBox.classList.contains('active') || langBox.style.display === 'block')) {
                toggleLanguageDropdown();
            }
        }
    }

    function clearAllReadingProgress() {
        SarvwigyanProgress.clearAll();
        renderCards(allItems.all, 'allGrid', true);
        renderCards(allItems.books, 'booksGrid', true);
        renderCards(allItems.journals, 'journalsGrid', true);
        if (allItems.recent.length) renderCards(allItems.recent, 'recentGrid', true);
    }

    function initThemeToggle() {
        const btn = document.getElementById('themeToggle');
        if (!btn) return;
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const current = document.documentElement.getAttribute('data-theme') || 'light';
            applyTheme(current === 'dark' ? 'light' : 'dark');
        });
    }

    /* =============================================================
       18. BOOT
       ============================================================= */
    async function boot() {
        initSettings();

        await loadDataFromJSON();

        renderCards(allItems.all, 'allGrid', true);
        renderCards(allItems.books, 'booksGrid', true);
        renderCards(allItems.journals, 'journalsGrid', true);
        renderCards(allItems.recent, 'recentGrid', true);

        initTabs();
        initSearch();
        initReaderToolbar();
        initThemeToggle();

        window.addEventListener('scroll', handleScroll, { passive: true });

        const bind = function (id, fn) {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', fn);
        };

        bind('closeBtn', closeDetail);
        bind('bookModalClose', closeBookModal);
        bind('settingsIcon', toggleSettings);
        bind('saveSettings', saveSettings);

        const overlay = document.getElementById('overlay');
        if (overlay) overlay.addEventListener('click', handleOverlayClick);

        $$('.lang-checkbox').forEach(function (cb) {
            cb.addEventListener('change', function () {
                const all = document.getElementById('selectAllLanguages');
                if (all) {
                    all.checked = $$('.lang-checkbox').length === $$('.lang-checkbox:checked').length;
                }
                updateSelectedLanguagesLabel();
                filterBooksByLanguage();
            });
        });

        window.addEventListener('popstate', handlePopState);
        document.addEventListener('keydown', handleEscapeKey);

        switchTab('all');

        console.log('%cकोष तैयार है ✨', 'color:#C5442C;font-weight:bold;font-size:14px');
    }

    // Expose handlers used by inline HTML attributes
    window.toggleSettings = toggleSettings;
    window.saveSettings = saveSettings;
    window.clearAllReadingProgress = clearAllReadingProgress;
    window.handleMainFilterChange = handleMainFilterChange;
    window.toggleLanguageDropdown = toggleLanguageDropdown;
    window.toggleAllLanguages = toggleAllLanguages;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();