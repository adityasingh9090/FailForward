// ========================================
// Main Application Controller
// ========================================

const App = (() => {
    function init() {
        // Hide preloader after animation
        setTimeout(() => {
            const preloader = document.getElementById('preloader');
            if (preloader) {
                preloader.classList.add('hidden');
                setTimeout(() => {
                    preloader.style.display = 'none';
                }, 500);
            }
        }, 2500);

        // ========== INITIALIZE MODULES (order matters!) ==========
        if (typeof Auth !== 'undefined') Auth.init();
        if (typeof Categories !== 'undefined') Categories.init();
        if (typeof Posts !== 'undefined') Posts.init();
        if (typeof Profile !== 'undefined') Profile.init();   // ← ADDED
        if (typeof Reels !== 'undefined') Reels.init();
        if (typeof AIWisdom !== 'undefined') AIWisdom.generateNuggets();

        // ========== NAVIGATION LINKS ==========
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                const section = link.dataset.section;
                if (section) {
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                    showSection(section);
                }
            });
        });

        // ========== HERO: Browse button ==========
        document.getElementById('browseBtn')?.addEventListener('click', () => {
            document.getElementById('authModal').style.display = 'flex';
        });

        // ========== USER DROPDOWN: My Profile ==========
        document.getElementById('myPostsBtn')?.addEventListener('click', () => {
            document.getElementById('userDropdown').style.display = 'none';
            const user = Auth.getUser();
            if (user) {
                // Open profile page (preferred)
                if (typeof Profile !== 'undefined' && Profile.loadProfile) {
                    Profile.loadProfile(user.uid);
                } else {
                    // Fallback to inline post list
                    loadMyPosts(user.uid);
                }
            }
        });

        // ========== USER DROPDOWN: My Stats ==========
        document.getElementById('statsBtn')?.addEventListener('click', () => {
            document.getElementById('userDropdown').style.display = 'none';
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            const wisdomLink = document.querySelector('.nav-link[data-section="wisdom"]');
            if (wisdomLink) wisdomLink.classList.add('active');
            showSection('wisdom');
        });

        // ========== HERO STATS ==========
        loadHeroStats();

        // ========== URL PARAMS (deep links) ==========
        setTimeout(() => {
            handleUrlParams();
        }, 3000);

        console.log('🚀 FailForward initialized');
    }

    // ========== CENTRAL SECTION SWITCHER ==========
    function showSection(section) {
        const feedSection = document.getElementById('feedSection');
        const reelsSection = document.getElementById('reelsSection');
        const wisdomSection = document.getElementById('wisdomSection');
        const leaderboardSection = document.getElementById('leaderboardSection');
        const profileSection = document.getElementById('profileSection');

        // Hide all sections
        if (feedSection) feedSection.style.display = 'none';
        if (reelsSection) reelsSection.style.display = 'none';
        if (wisdomSection) wisdomSection.style.display = 'none';
        if (leaderboardSection) leaderboardSection.style.display = 'none';
        if (profileSection) profileSection.style.display = 'none';

        // Show selected section + trigger loading
        switch (section) {
            case 'feed':
                if (feedSection) feedSection.style.display = 'block';
                break;
            case 'reels':
                if (reelsSection) reelsSection.style.display = 'block';
                if (typeof Reels !== 'undefined' && Reels.loadReels) Reels.loadReels();
                break;
            case 'wisdom':
                if (wisdomSection) wisdomSection.style.display = 'block';
                if (typeof AIWisdom !== 'undefined' && AIWisdom.loadWisdom) AIWisdom.loadWisdom();
                break;
            case 'leaderboard':
                if (leaderboardSection) leaderboardSection.style.display = 'block';
                if (typeof Posts !== 'undefined' && Posts.loadLeaderboard) Posts.loadLeaderboard();
                break;
            case 'profile':
                if (profileSection) profileSection.style.display = 'block';
                break;
            default:
                if (feedSection) feedSection.style.display = 'block';
        }

        // Scroll to top on section change
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ========== HANDLE URL PARAMS (?u=username or ?reel=id) ==========
    async function handleUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const username = params.get('u');
        const reelId = params.get('reel');
        const postId = params.get('post');

        const user = Auth.getUser();
        if (!user) return; // Only handle if logged in

        // Open user profile from URL
        if (username && typeof Profile !== 'undefined') {
            try {
                const doc = await db.collection('usernames').doc(username.toLowerCase()).get();
                if (doc.exists) {
                    Profile.loadProfile(doc.data().uid);
                }
            } catch (e) {
                console.error('URL profile load error:', e);
            }
        }

        // Jump to reel from URL
        if (reelId && typeof Reels !== 'undefined') {
            showSection('reels');
            setTimeout(() => {
                const reelEl = document.querySelector(`.reel-card[data-id="${reelId}"]`);
                if (reelEl) {
                    reelEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    reelEl.style.boxShadow = '0 0 0 3px var(--accent-primary)';
                    setTimeout(() => reelEl.style.boxShadow = '', 2500);
                }
            }, 1500);
        }

        // Jump to post from URL
        if (postId) {
            showSection('feed');
            setTimeout(() => {
                const postEl = document.querySelector(`.post-card[data-id="${postId}"]`);
                if (postEl) {
                    postEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    postEl.style.boxShadow = '0 0 0 3px var(--accent-primary)';
                    setTimeout(() => postEl.style.boxShadow = '', 2500);
                }
            }, 1500);
        }
    }

    // ========== FALLBACK: My Posts (if Profile module unavailable) ==========
    async function loadMyPosts(uid) {
        const feed = document.getElementById('postsFeed');
        if (!feed) return;

        feed.innerHTML = '<div class="loading-posts"><div class="spinner"></div><p>Loading your confessions...</p></div>';

        try {
            const snapshot = await db.collection('posts')
                .where('authorId', '==', uid)
                .orderBy('createdAt', 'desc')
                .get();

            feed.innerHTML = '';
            
            if (snapshot.empty) {
                feed.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-pen"></i>
                        <h3>No confessions yet</h3>
                        <p>Your failures are waiting to help someone else. Share your story.</p>
                    </div>
                `;
                return;
            }

            snapshot.forEach(doc => {
                const post = { id: doc.id, ...doc.data() };
                feed.appendChild(createSimplePostCard(post));
            });
        } catch (error) {
            console.error('Error loading my posts:', error);
            feed.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error loading posts</h3>
                    <p>${escapeHtml(error.message)}</p>
                </div>
            `;
        }
    }

    function createSimplePostCard(post) {
        const card = document.createElement('div');
        card.className = 'post-card';
        card.dataset.id = post.id;
        const timeAgo = post.createdAt ? getTimeAgo(post.createdAt.toDate()) : 'Just now';
        
        // Get category label from Categories module if available
        let categoryDisplay = post.category;
        if (typeof Categories !== 'undefined' && Categories.getCategoryById) {
            const cat = Categories.getCategoryById(post.category);
            if (cat) categoryDisplay = `${cat.emoji} ${cat.label}`;
        }
        
        card.innerHTML = `
            <div class="post-header">
                <div class="post-avatar">
                    <span>${escapeHtml(post.authorInitial || '?')}</span>
                </div>
                <div class="post-user-info">
                    <div class="post-username">${escapeHtml(post.authorName || 'Anonymous')}</div>
                    <div class="post-meta">
                        <span class="post-category-badge ${escapeHtml(post.category)}">${escapeHtml(categoryDisplay)}</span>
                        <span>•</span>
                        <span>${timeAgo}</span>
                    </div>
                </div>
                ${post.moneyLost > 0 ? `
                    <div class="post-money-lost">
                        <i class="fas fa-arrow-down"></i>
                        $${Number(post.moneyLost).toLocaleString()}
                    </div>
                ` : ''}
            </div>
            <h3 class="post-title">${escapeHtml(post.title)}</h3>
            <p class="post-content">${escapeHtml(post.content)}</p>
            ${post.wisdom ? `
                <div class="post-wisdom">
                    <div class="post-wisdom-label">
                        <i class="fas fa-robot"></i> AI-Extracted Wisdom
                    </div>
                    <p class="post-wisdom-text">"${escapeHtml(post.wisdom)}"</p>
                </div>
            ` : ''}
        `;
        return card;
    }

    // ========== HERO STATS (counts shown on landing page) ==========
    async function loadHeroStats() {
        try {
            if (typeof db === 'undefined') return;
            
            const statsDoc = await db.collection('stats').doc('global').get();
            if (statsDoc.exists) {
                const data = statsDoc.data();
                animateCounter('totalPosts', data.totalPosts || 0);
                animateCounter('totalUsers', data.totalUsers || 0);
                animateCounter('totalWisdom', data.totalPosts || 0);
            }

            // Also count reels if you want
            try {
                const reelsSnap = await db.collection('reels').limit(1000).get();
                // Could update a hero stat for reels here if needed
            } catch (e) {
                // Silent fail
            }
        } catch (e) {
            console.warn('Hero stats failed (this is okay if no posts exist yet):', e.message);
        }
    }

    function animateCounter(elementId, target) {
        const el = document.getElementById(elementId);
        if (!el) return;
        if (target === 0) {
            el.textContent = '0';
            return;
        }
        
        let current = 0;
        const duration = 1500; // ms
        const stepTime = 30;
        const steps = duration / stepTime;
        const increment = Math.max(1, Math.ceil(target / steps));
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            el.textContent = current.toLocaleString();
        }, stepTime);
    }

    // ========== TOAST NOTIFICATIONS ==========
    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle',
            warning: 'fas fa-exclamation-triangle'
        };

        toast.innerHTML = `
            <i class="toast-icon ${icons[type] || icons.info}"></i>
            <span class="toast-message">${escapeHtml(message)}</span>
            <button class="toast-close" type="button">&times;</button>
        `;

        const removeToast = () => {
            if (!toast.parentElement) return;
            toast.style.animation = 'fadeIn 0.3s reverse forwards';
            setTimeout(() => toast.remove(), 300);
        };

        toast.querySelector('.toast-close').addEventListener('click', removeToast);
        container.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(removeToast, 5000);
    }

    // ========== UTILITIES ==========
    function getTimeAgo(date) {
        if (!date) return 'just now';
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    }

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    }

    // ========== INITIALIZE ON DOM READY ==========
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Public API
    return { 
        showToast, 
        showSection,
        getTimeAgo,
        escapeHtml
    };
})();