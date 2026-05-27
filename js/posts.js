// ========================================
// Posts Module
// ========================================

const Posts = (() => {
    let currentCategory = 'all';
    let currentSort = 'recent';
    let unsubscribe = null;
    let currentSearchQuery = '';

    function init() {
        // Create post toggle
        const openCreatePost = document.getElementById('openCreatePost');
        const closeCreatePost = document.getElementById('closeCreatePost');
        const cancelPost = document.getElementById('cancelPost');
        
        if (openCreatePost) openCreatePost.addEventListener('click', showCreateForm);
        if (closeCreatePost) closeCreatePost.addEventListener('click', hideCreateForm);
        if (cancelPost) cancelPost.addEventListener('click', hideCreateForm);

        // Create post form
        const createPostForm = document.getElementById('createPostForm');
        if (createPostForm) createPostForm.addEventListener('submit', createPost);

        // Category filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.removeEventListener('click', handleFilterClick);
            btn.addEventListener('click', handleFilterClick);
        });

        // Sort buttons
        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.removeEventListener('click', handleSortClick);
            btn.addEventListener('click', handleSortClick);
        });

        // Search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.removeEventListener('input', handleSearchInput);
            searchInput.addEventListener('input', handleSearchInput);
        }

        // Navigation sections
        document.querySelectorAll('.nav-link').forEach(link => {
            link.removeEventListener('click', handleNavClick);
            link.addEventListener('click', handleNavClick);
        });
    }

    function handleFilterClick(e) {
        const btn = e.currentTarget;
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        loadPosts();
    }

    function handleSortClick(e) {
        const btn = e.currentTarget;
        document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSort = btn.dataset.sort;
        loadPosts();
    }

    function handleSearchInput(e) {
        const query = e.target.value.toLowerCase().trim();
        currentSearchQuery = query;
        debounce(() => {
            if (currentSearchQuery.length > 2) {
                searchPosts(currentSearchQuery);
            } else if (currentSearchQuery.length === 0) {
                loadPosts();
            }
        }, 300)();
    }

    function handleNavClick(e) {
        const link = e.currentTarget;
        const section = link.dataset.section;
        showSection(section);
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    }

    function showSection(section) {
        const feedSection = document.getElementById('feedSection');
        const wisdomSection = document.getElementById('wisdomSection');
        const leaderboardSection = document.getElementById('leaderboardSection');
        const reelsSection = document.getElementById('reelsSection');
        const profileSection = document.getElementById('profileSection');
        
        if (feedSection) feedSection.style.display = section === 'feed' ? 'block' : 'none';
        if (wisdomSection) wisdomSection.style.display = section === 'wisdom' ? 'block' : 'none';
        if (leaderboardSection) leaderboardSection.style.display = section === 'leaderboard' ? 'block' : 'none';
        if (reelsSection) reelsSection.style.display = section === 'reels' ? 'block' : 'none';
        if (profileSection) profileSection.style.display = 'none';

        if (section === 'wisdom' && typeof AIWisdom !== 'undefined' && AIWisdom.loadWisdom) {
            AIWisdom.loadWisdom();
        }
        if (section === 'leaderboard') loadLeaderboard();
        if (section === 'reels' && typeof Reels !== 'undefined' && Reels.loadReels) {
            Reels.loadReels();
        }
    }

    function showCreateForm() {
        const createCard = document.getElementById('createPostCard');
        const expanded = document.getElementById('createPostExpanded');
        const postTitle = document.getElementById('postTitle');
        
        if (createCard) createCard.style.display = 'none';
        if (expanded) expanded.style.display = 'block';
        if (postTitle) postTitle.focus();
    }

    function hideCreateForm() {
        const createCard = document.getElementById('createPostCard');
        const expanded = document.getElementById('createPostExpanded');
        const createForm = document.getElementById('createPostForm');
        
        if (createCard) createCard.style.display = 'block';
        if (expanded) expanded.style.display = 'none';
        if (createForm) createForm.reset();
        
        // Reset category display
        const selectedDisplay = document.getElementById('selectedCategoryDisplay');
        if (selectedDisplay) selectedDisplay.innerHTML = 'Select category';
    }

    async function createPost(e) {
        e.preventDefault();
        const user = Auth.getUser();
        if (!user) {
            App.showToast('Please login to share your confession', 'error');
            return;
        }

        const title = document.getElementById('postTitle')?.value.trim();
        const content = document.getElementById('postContent')?.value.trim();
        const category = document.getElementById('postCategory')?.value;
        const moneyLost = parseInt(document.getElementById('postMoneyLost')?.value) || 0;
        const tagsRaw = document.getElementById('postTags')?.value || '';
        const isAnonymous = document.getElementById('postAnonymous')?.checked || false;

        if (!title || !content || !category) {
            App.showToast('Please fill in all required fields', 'error');
            return;
        }

        const tags = tagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(t => t && t.length > 0);

        // AI wisdom extraction
        let wisdom = '';
        if (typeof AIWisdom !== 'undefined' && AIWisdom.extractWisdom) {
            wisdom = AIWisdom.extractWisdom(title, content, category);
        }

        const postData = {
            title,
            content,
            category,
            moneyLost,
            tags,
            isAnonymous,
            wisdom,
            authorId: user.uid,
            authorName: isAnonymous ? 'Anonymous' : (user.displayName || 'Truth-Teller'),
            authorInitial: isAnonymous ? '?' : (user.displayName?.[0] || user.email?.[0] || '?').toUpperCase(),
            resonateCount: 0,
            commentCount: 0,
            resonatedBy: [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection('posts').add(postData);

            // Update user stats
            await db.collection('users').doc(user.uid).set({
                postCount: firebase.firestore.FieldValue.increment(1)
            }, { merge: true });

            // Update global stats
            const statsUpdate = {
                totalPosts: firebase.firestore.FieldValue.increment(1)
            };
            if (moneyLost > 0) {
                statsUpdate.totalMoneyLost = firebase.firestore.FieldValue.increment(moneyLost);
            }
            await db.collection('stats').doc('global').set(statsUpdate, { merge: true });

            // Update category stats
            await db.collection('stats').doc('categories').set({
                [category]: firebase.firestore.FieldValue.increment(1)
            }, { merge: true });

            // Store tags for trending
            for (const tag of tags) {
                await db.collection('tags').doc(tag).set({
                    count: firebase.firestore.FieldValue.increment(1),
                    lastUsed: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            }

            hideCreateForm();
            if (App && App.showToast) {
                App.showToast('Confession shared! The AI is extracting wisdom... 🧠', 'success');
            }

            // Update local counts
            const countEl = document.getElementById('myPostCount');
            if (countEl) countEl.textContent = parseInt(countEl.textContent || '0') + 1;

            loadPosts();
        } catch (error) {
            console.error('Error creating post:', error);
            if (App && App.showToast) {
                App.showToast('Failed to share confession. Try again.', 'error');
            }
        }
    }

    function loadPosts() {
        if (unsubscribe && typeof unsubscribe === 'function') unsubscribe();

        const feed = document.getElementById('postsFeed');
        if (!feed) return;
        
        feed.innerHTML = '<div class="loading-posts"><div class="spinner"></div><p>Loading confessions...</p></div>';

        let query = db.collection('posts');

        // Category filter
        if (currentCategory !== 'all') {
            query = query.where('category', '==', currentCategory);
        }

        // Sort
        switch (currentSort) {
            case 'resonated':
                query = query.orderBy('resonateCount', 'desc');
                break;
            case 'money':
                query = query.orderBy('moneyLost', 'desc');
                break;
            case 'wisdom':
                query = query.orderBy('commentCount', 'desc');
                break;
            default:
                query = query.orderBy('createdAt', 'desc');
        }

        query = query.limit(50);

        unsubscribe = query.onSnapshot((snapshot) => {
            if (snapshot.empty) {
                feed.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-ghost"></i>
                        <h3>No confessions yet</h3>
                        <p>Be the first to share your failure. Someone needs to hear it.</p>
                    </div>
                `;
                return;
            }

            feed.innerHTML = '';
            snapshot.forEach(doc => {
                const post = { id: doc.id, ...doc.data() };
                feed.appendChild(createPostCard(post));
            });

            updateGlobalStats();
        }, (error) => {
            console.error('Error loading posts:', error);
            feed.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error loading posts</h3>
                    <p>${escapeHtml(error.message)}</p>
                </div>
            `;
        });
    }

    function createPostCard(post) {
        const card = document.createElement('div');
        card.className = 'post-card';
        card.dataset.id = post.id;

        const user = Auth.getUser();
        const hasResonated = post.resonatedBy && Array.isArray(post.resonatedBy) && post.resonatedBy.includes(user?.uid);
        const timeAgo = post.createdAt ? getTimeAgo(post.createdAt.toDate()) : 'Just now';

        const categoryEmoji = Categories.getCategoryEmoji(post.category);
        const categoryLabel = Categories.getCategoryLabel(post.category);

        card.innerHTML = `
            <div class="post-header">
                <div class="post-avatar ${post.isAnonymous ? 'anonymous' : ''}">
                    <span>${escapeHtml(post.authorInitial || '?')}</span>
                </div>
                <div class="post-user-info">
                    <div class="post-username">${escapeHtml(post.authorName || 'Anonymous')}</div>
                    <div class="post-meta">
                        <span class="post-category-badge ${post.category}">
                            ${categoryEmoji} ${escapeHtml(categoryLabel)}
                        </span>
                        <span>•</span>
                        <span>${timeAgo}</span>
                    </div>
                </div>
                ${post.moneyLost > 0 ? `
                    <div class="post-money-lost">
                        <i class="fas fa-arrow-down"></i>
                        $${post.moneyLost.toLocaleString()}
                    </div>
                ` : ''}
            </div>
            <h3 class="post-title">${escapeHtml(post.title)}</h3>
            <p class="post-content">${escapeHtml(post.content)}</p>
            ${post.tags && post.tags.length > 0 ? `
                <div class="post-tags">
                    ${post.tags.map(t => `<span class="post-tag">#${escapeHtml(t)}</span>`).join('')}
                </div>
            ` : ''}
            ${post.wisdom ? `
                <div class="post-wisdom">
                    <div class="post-wisdom-label">
                        <i class="fas fa-robot"></i> AI-Extracted Wisdom
                    </div>
                    <p class="post-wisdom-text">"${escapeHtml(post.wisdom)}"</p>
                </div>
            ` : ''}
            <div class="post-actions">
                <button class="post-action-btn resonate-btn ${hasResonated ? 'resonated' : ''}" data-post-id="${post.id}">
                    <i class="${hasResonated ? 'fas' : 'far'} fa-heart"></i>
                    <span>${post.resonateCount || 0}</span> Resonate
                </button>
                <button class="post-action-btn comment-btn" data-post-id="${post.id}">
                    <i class="far fa-comment"></i>
                    <span>${post.commentCount || 0}</span> Wisdom
                </button>
                <button class="post-action-btn share-btn" data-post-id="${post.id}">
                    <i class="far fa-share-square"></i> Share
                </button>
            </div>
            <div class="comments-section" id="comments-${post.id}" style="display:none;">
                <div class="comments-list" id="commentsList-${post.id}"></div>
                <div class="comment-input-row">
                    <input type="text" placeholder="Share your wisdom on this..." class="comment-input" data-post-id="${post.id}">
                    <button class="btn btn-primary btn-sm submit-comment" data-post-id="${post.id}">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;

        // Resonate button
        const resonateBtn = card.querySelector('.resonate-btn');
        if (resonateBtn) {
            resonateBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleResonate(post.id, resonateBtn);
            });
        }

        // Comment toggle
        const commentBtn = card.querySelector('.comment-btn');
        if (commentBtn) {
            commentBtn.addEventListener('click', () => {
                const section = card.querySelector(`#comments-${post.id}`);
                if (section) {
                    const isVisible = section.style.display === 'block';
                    section.style.display = isVisible ? 'none' : 'block';
                    if (!isVisible) {
                        loadComments(post.id);
                    }
                }
            });
        }

        // Submit comment
        const submitBtn = card.querySelector('.submit-comment');
        const commentInput = card.querySelector('.comment-input');
        
        if (submitBtn && commentInput) {
            submitBtn.addEventListener('click', () => {
                if (commentInput.value.trim()) {
                    submitComment(post.id, commentInput.value.trim());
                    commentInput.value = '';
                }
            });

            commentInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                    submitComment(post.id, e.target.value.trim());
                    e.target.value = '';
                }
            });
        }

        // Share button
        const shareBtn = card.querySelector('.share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                const text = `Check out this confession on FailForward: "${post.title}"`;
                if (navigator.share) {
                    navigator.share({ title: 'FailForward', text });
                } else {
                    navigator.clipboard.writeText(text);
                    if (App && App.showToast) App.showToast('Copied to clipboard!', 'info');
                }
            });
        }

        return card;
    }

    async function toggleResonate(postId, btn) {
        const user = Auth.getUser();
        if (!user) {
            if (App && App.showToast) App.showToast('Please login to resonate', 'error');
            return;
        }

        const postRef = db.collection('posts').doc(postId);
        const isResonated = btn.classList.contains('resonated');

        try {
            if (isResonated) {
                await postRef.update({
                    resonateCount: firebase.firestore.FieldValue.increment(-1),
                    resonatedBy: firebase.firestore.FieldValue.arrayRemove(user.uid)
                });
                btn.classList.remove('resonated');
                const icon = btn.querySelector('i');
                if (icon) icon.className = 'far fa-heart';
            } else {
                await postRef.update({
                    resonateCount: firebase.firestore.FieldValue.increment(1),
                    resonatedBy: firebase.firestore.FieldValue.arrayUnion(user.uid)
                });
                btn.classList.add('resonated');
                const icon = btn.querySelector('i');
                if (icon) icon.className = 'fas fa-heart';
            }

            // Update count display
            const post = await postRef.get();
            const countSpan = btn.querySelector('span');
            if (countSpan) countSpan.textContent = post.data().resonateCount || 0;
        } catch (error) {
            console.error('Resonate error:', error);
            if (App && App.showToast) App.showToast('Failed to resonate. Try again.', 'error');
        }
    }

    function filterByCategory(category) {
        currentCategory = category;
        loadPosts();
    }

    async function loadComments(postId) {
        const list = document.getElementById(`commentsList-${postId}`);
        if (!list) return;
        
        list.innerHTML = '<div class="spinner"></div>';

        try {
            const snapshot = await db.collection('posts').doc(postId)
                .collection('comments')
                .orderBy('createdAt', 'asc')
                .limit(20)
                .get();

            list.innerHTML = '';
            if (snapshot.empty) {
                list.innerHTML = '<p style="font-size:0.8rem;color:var(--text-muted);padding:10px;">No wisdom shared yet. Be the first!</p>';
                return;
            }

            snapshot.forEach(doc => {
                const comment = doc.data();
                const timeAgo = comment.createdAt ? getTimeAgo(comment.createdAt.toDate()) : 'Just now';
                const el = document.createElement('div');
                el.className = 'comment';
                el.innerHTML = `
                    <div class="comment-avatar">${escapeHtml(comment.authorInitial || '?')}</div>
                    <div class="comment-body">
                        <span class="comment-author">${escapeHtml(comment.authorName || 'Anonymous')}</span>
                        <span class="comment-time"> • ${timeAgo}</span>
                        <p class="comment-text">${escapeHtml(comment.text)}</p>
                    </div>
                `;
                list.appendChild(el);
            });
        } catch (error) {
            console.error('Error loading comments:', error);
            list.innerHTML = '<p style="color:var(--failure-red);font-size:0.8rem;">Error loading comments</p>';
        }
    }

    async function submitComment(postId, text) {
        const user = Auth.getUser();
        if (!user) {
            if (App && App.showToast) App.showToast('Please login to share wisdom', 'error');
            return;
        }

        try {
            await db.collection('posts').doc(postId).collection('comments').add({
                text,
                authorId: user.uid,
                authorName: user.displayName || 'Truth-Teller',
                authorInitial: (user.displayName?.[0] || user.email?.[0] || '?').toUpperCase(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await db.collection('posts').doc(postId).update({
                commentCount: firebase.firestore.FieldValue.increment(1)
            });

            await db.collection('users').doc(user.uid).set({
                wisdomCount: firebase.firestore.FieldValue.increment(1)
            }, { merge: true });

            loadComments(postId);
            if (App && App.showToast) App.showToast('Wisdom shared! 💡', 'success');
        } catch (error) {
            console.error('Comment error:', error);
            if (App && App.showToast) App.showToast('Failed to post comment.', 'error');
        }
    }

    async function searchPosts(query) {
        const feed = document.getElementById('postsFeed');
        if (!feed) return;
        
        feed.innerHTML = '<div class="loading-posts"><div class="spinner"></div><p>Searching...</p></div>';

        try {
            const snapshot = await db.collection('posts')
                .orderBy('createdAt', 'desc')
                .limit(100)
                .get();

            const results = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                const searchStr = `${data.title} ${data.content} ${(data.tags || []).join(' ')}`.toLowerCase();
                if (searchStr.includes(query)) {
                    results.push({ id: doc.id, ...data });
                }
            });

            feed.innerHTML = '';
            if (results.length === 0) {
                feed.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <h3>No results found</h3>
                        <p>Try a different search term</p>
                    </div>
                `;
                return;
            }

            results.forEach(post => {
                feed.appendChild(createPostCard(post));
            });
        } catch (error) {
            console.error('Search error:', error);
            feed.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Search error</h3></div>';
        }
    }

    async function loadLeaderboard(type = 'vulnerable') {
        const container = document.getElementById('leaderboardContent');
        if (!container) return;
        
        container.innerHTML = '<div class="spinner"></div>';

        try {
            let query;
            let statField, statLabel;

            switch (type) {
                case 'wise':
                    query = db.collection('users').orderBy('wisdomCount', 'desc').limit(10);
                    statField = 'wisdomCount';
                    statLabel = 'wisdom shared';
                    break;
                case 'money':
                    // Aggregate from posts
                    const postsSnap = await db.collection('posts')
                        .where('moneyLost', '>', 0)
                        .orderBy('moneyLost', 'desc')
                        .limit(10)
                        .get();
                    
                    container.innerHTML = '';
                    let rank = 1;
                    postsSnap.forEach(doc => {
                        const data = doc.data();
                        const item = document.createElement('div');
                        item.className = 'lb-item';
                        item.innerHTML = `
                            <span class="lb-rank">#${rank}</span>
                            <div class="lb-avatar"><span>${escapeHtml(data.authorInitial || '?')}</span></div>
                            <div class="lb-info">
                                <div class="lb-name">${escapeHtml(data.authorName || 'Anonymous')}</div>
                                <div class="lb-subtitle">${escapeHtml(data.title || '')}</div>
                            </div>
                            <div class="lb-stat">
                                <div class="lb-stat-num" style="color:var(--failure-red)">-$${(data.moneyLost || 0).toLocaleString()}</div>
                                <div class="lb-stat-label">lost</div>
                            </div>
                        `;
                        container.appendChild(item);
                        rank++;
                    });
                    if (postsSnap.empty) {
                        container.innerHTML = '<div class="empty-state"><i class="fas fa-dollar-sign"></i><h3>No money losses reported yet</h3></div>';
                    }
                    return;
                default:
                    query = db.collection('users').orderBy('postCount', 'desc').limit(10);
                    statField = 'postCount';
                    statLabel = 'confessions';
            }

            const snapshot = await query.get();
            container.innerHTML = '';

            if (snapshot.empty) {
                container.innerHTML = '<div class="empty-state"><i class="fas fa-trophy"></i><h3>No rankings yet</h3></div>';
                return;
            }

            let rank = 1;
            snapshot.forEach(doc => {
                const data = doc.data();
                const item = document.createElement('div');
                item.className = 'lb-item';
                item.innerHTML = `
                    <span class="lb-rank">#${rank}</span>
                    <div class="lb-avatar"><span>${escapeHtml((data.displayName || '?')[0].toUpperCase())}</span></div>
                    <div class="lb-info">
                        <div class="lb-name">${escapeHtml(data.displayName || 'Anonymous')}</div>
                        <div class="lb-subtitle">Truth-Teller since ${data.createdAt ? data.createdAt.toDate().toLocaleDateString() : 'unknown'}</div>
                    </div>
                    <div class="lb-stat">
                        <div class="lb-stat-num">${data[statField] || 0}</div>
                        <div class="lb-stat-label">${statLabel}</div>
                    </div>
                `;
                container.appendChild(item);
                rank++;
            });
        } catch (error) {
            console.error('Leaderboard error:', error);
            if (container) {
                container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Error loading leaderboard</h3></div>';
            }
        }
    }

    async function updateGlobalStats() {
        try {
            const statsDoc = await db.collection('stats').doc('global').get();
            if (statsDoc.exists) {
                const data = statsDoc.data();
                const totalPosts = document.getElementById('totalPosts');
                const totalUsers = document.getElementById('totalUsers');
                const totalMoneyLost = document.getElementById('totalMoneyLost');
                
                if (totalPosts) totalPosts.textContent = data.totalPosts || 0;
                if (totalUsers) totalUsers.textContent = data.totalUsers || 0;
                if (totalMoneyLost) totalMoneyLost.textContent = `$${(data.totalMoneyLost || 0).toLocaleString()}`;
            }

            // Category breakdown
            const catDoc = await db.collection('stats').doc('categories').get();
            if (catDoc.exists) {
                const cats = catDoc.data();
                const total = Object.values(cats).reduce((a, b) => a + b, 0) || 1;
                
                const percents = {};
                for (const [key, val] of Object.entries(cats)) {
                    percents[key] = Math.round((val / total) * 100);
                }
                
                const failurePct = document.getElementById('failurePct');
                const regretPct = document.getElementById('regretPct');
                const lessonPct = document.getElementById('lessonPct');
                const moneyPct = document.getElementById('moneyPct');
                const decisionPct = document.getElementById('decisionPct');
                
                const failureFill = document.querySelector('.mini-stat-fill[data-cat="failure"]');
                const regretFill = document.querySelector('.mini-stat-fill[data-cat="regret"]');
                const lessonFill = document.querySelector('.mini-stat-fill[data-cat="lesson"]');
                const moneyFill = document.querySelector('.mini-stat-fill[data-cat="money"]');
                const decisionFill = document.querySelector('.mini-stat-fill[data-cat="decision"]');
                
                if (failurePct) failurePct.textContent = `${percents.failure || 0}%`;
                if (failureFill) failureFill.style.width = `${percents.failure || 0}%`;
                if (regretPct) regretPct.textContent = `${percents.regret || 0}%`;
                if (regretFill) regretFill.style.width = `${percents.regret || 0}%`;
                if (lessonPct) lessonPct.textContent = `${percents.lesson || 0}%`;
                if (lessonFill) lessonFill.style.width = `${percents.lesson || 0}%`;
                if (moneyPct) moneyPct.textContent = `${percents.money || 0}%`;
                if (moneyFill) moneyFill.style.width = `${percents.money || 0}%`;
                if (decisionPct) decisionPct.textContent = `${percents.decision || 0}%`;
                if (decisionFill) decisionFill.style.width = `${percents.decision || 0}%`;
            }

            // Load trending tags
            const tagsSnap = await db.collection('tags').orderBy('count', 'desc').limit(8).get();
            const tagsContainer = document.getElementById('trendingTags');
            if (tagsContainer) {
                tagsContainer.innerHTML = '';
                tagsSnap.forEach(doc => {
                    const tag = document.createElement('span');
                    tag.className = 'tag';
                    tag.textContent = `#${doc.id}`;
                    tag.addEventListener('click', () => {
                        const searchInput = document.getElementById('searchInput');
                        if (searchInput) {
                            searchInput.value = doc.id;
                            searchPosts(doc.id);
                        }
                    });
                    tagsContainer.appendChild(tag);
                });
            }

        } catch (error) {
            console.error('Stats update error:', error);
        }
    }

    // Utilities
    function getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    let debounceTimeout;
    function debounce(fn, delay) {
        return (...args) => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => fn(...args), delay);
        };
    }

    return { init, loadPosts, filterByCategory };
})();