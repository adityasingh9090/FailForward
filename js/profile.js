// ========================================
// User Profile & Search Module
// ========================================

const Profile = (() => {
    let currentProfileTab = 'posts';
    let currentProfileUid = null;
    let searchDebounceTimeout = null;

    function init() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchDropdown = document.getElementById('searchDropdown');

        if (!searchInput || !searchDropdown) return;

        searchInput.addEventListener('input', debounce(async (e) => {
            const query = e.target.value.trim();
            if (query.length === 0) {
                searchDropdown.style.display = 'none';
                return;
            }
            if (query.length < 2) {
                searchDropdown.innerHTML = '<div class="search-no-results">Type at least 2 characters...</div>';
                searchDropdown.style.display = 'block';
                return;
            }
            await performSearch(query);
        }, 300));

        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim().length >= 2) {
                searchDropdown.style.display = 'block';
            }
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-search')) {
                searchDropdown.style.display = 'none';
            }
        });

        // My Posts button → opens own profile
        const myPostsBtn = document.getElementById('myPostsBtn');
        if (myPostsBtn) {
            myPostsBtn.addEventListener('click', () => {
                const userDropdown = document.getElementById('userDropdown');
                if (userDropdown) userDropdown.style.display = 'none';
                const user = Auth.getUser();
                if (user) loadProfile(user.uid);
            });
        }

        // Check URL for profile link
        checkUrlProfile();
    }

    async function performSearch(query) {
        const searchDropdown = document.getElementById('searchDropdown');
        if (!searchDropdown) return;
        
        searchDropdown.innerHTML = '<div class="search-no-results"><div class="spinner" style="margin:10px auto;"></div></div>';
        searchDropdown.style.display = 'block';

        const cleanQuery = query.toLowerCase().replace(/[@#]/g, '');
        let html = '';

        try {
            // Search users by display name (simplified - removed username_lower)
            const usersByName = await db.collection('users')
                .orderBy('displayName')
                .limit(20)
                .get();

            // Filter and match users
            const usersMap = new Map();
            usersByName.forEach(doc => {
                const userData = doc.data();
                const displayName = (userData.displayName || '').toLowerCase();
                if (displayName.includes(cleanQuery)) {
                    usersMap.set(doc.id, userData);
                }
            });

            if (usersMap.size > 0) {
                html += '<div class="search-section-title">👥 People</div>';
                usersMap.forEach((user, uid) => {
                    const initial = (user.displayName || '?')[0].toUpperCase();
                    html += `
                        <button class="search-result-item" data-uid="${escapeHtml(uid)}">
                            <div class="search-result-avatar">${escapeHtml(initial)}</div>
                            <div class="search-result-info">
                                <div class="search-result-name">${escapeHtml(user.displayName || 'Truth-Teller')}</div>
                                <div class="search-result-username">@${escapeHtml(user.username || 'user')}</div>
                                <div class="search-result-meta">${user.postCount || 0} confessions • ${user.wisdomCount || 0} wisdom shared</div>
                            </div>
                        </button>
                    `;
                });
            }

            // Search posts
            const postsSnap = await db.collection('posts')
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();

            const matchingPosts = [];
            postsSnap.forEach(doc => {
                const data = doc.data();
                const searchStr = `${data.title || ''} ${data.content || ''} ${(data.tags || []).join(' ')}`.toLowerCase();
                if (searchStr.includes(cleanQuery)) {
                    matchingPosts.push({ id: doc.id, ...data });
                }
            });

            if (matchingPosts.length > 0) {
                html += '<div class="search-section-title">📝 Confessions</div>';
                matchingPosts.slice(0, 5).forEach(post => {
                    html += `
                        <button class="search-result-item" data-postid="${escapeHtml(post.id)}">
                            <div class="search-result-avatar" style="background:var(--bg-input);color:var(--text-muted);font-size:0.8rem;">
                                <i class="fas fa-file-alt"></i>
                            </div>
                            <div class="search-result-info">
                                <div class="search-result-name">${escapeHtml(post.title || 'Untitled')}</div>
                                <div class="search-result-post">${escapeHtml((post.content || '').substring(0, 60))}...</div>
                                <div class="search-result-meta">by ${escapeHtml(post.authorName || 'Anonymous')} • ${post.resonateCount || 0} resonates</div>
                            </div>
                        </button>
                    `;
                });
            }

            if (usersMap.size === 0 && matchingPosts.length === 0) {
                html = '<div class="search-no-results">No results found for "' + escapeHtml(query) + '"</div>';
            }

            searchDropdown.innerHTML = html;

            // Attach event listeners to search results
            searchDropdown.querySelectorAll('.search-result-item[data-uid]').forEach(item => {
                item.addEventListener('click', () => {
                    const uid = item.dataset.uid;
                    openProfile(uid);
                });
            });

            searchDropdown.querySelectorAll('.search-result-item[data-postid]').forEach(item => {
                item.addEventListener('click', () => {
                    const postId = item.dataset.postid;
                    scrollToPost(postId);
                });
            });

        } catch (error) {
            console.error('Search error:', error);
            searchDropdown.innerHTML = '<div class="search-no-results">Search error. Try again.</div>';
        }
    }

    function openProfile(uid) {
        const searchDropdown = document.getElementById('searchDropdown');
        const searchInput = document.getElementById('searchInput');
        
        if (searchDropdown) searchDropdown.style.display = 'none';
        if (searchInput) searchInput.value = '';
        
        loadProfile(uid);
    }

    function scrollToPost(postId) {
        const searchDropdown = document.getElementById('searchDropdown');
        const searchInput = document.getElementById('searchInput');
        
        if (searchDropdown) searchDropdown.style.display = 'none';
        if (searchInput) searchInput.value = '';
        
        showFeedSection();
        
        setTimeout(() => {
            const postEl = document.querySelector(`.post-card[data-id="${postId}"]`);
            if (postEl) {
                postEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                postEl.style.boxShadow = '0 0 0 3px var(--accent-primary)';
                setTimeout(() => {
                    if (postEl) postEl.style.boxShadow = '';
                }, 2000);
            } else {
                // If post not found, reload posts and try again
                if (typeof Posts !== 'undefined' && Posts.loadPosts) {
                    Posts.loadPosts();
                    setTimeout(() => {
                        const retryPost = document.querySelector(`.post-card[data-id="${postId}"]`);
                        if (retryPost) {
                            retryPost.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            retryPost.style.boxShadow = '0 0 0 3px var(--accent-primary)';
                            setTimeout(() => {
                                if (retryPost) retryPost.style.boxShadow = '';
                            }, 2000);
                        }
                    }, 1000);
                }
            }
        }, 500);
    }

    async function loadProfile(uid) {
        if (!uid) return;
        
        currentProfileUid = uid;
        
        // Hide other sections
        const feedSection = document.getElementById('feedSection');
        const wisdomSection = document.getElementById('wisdomSection');
        const leaderboardSection = document.getElementById('leaderboardSection');
        const profileSection = document.getElementById('profileSection');
        
        if (feedSection) feedSection.style.display = 'none';
        if (wisdomSection) wisdomSection.style.display = 'none';
        if (leaderboardSection) leaderboardSection.style.display = 'none';
        if (profileSection) profileSection.style.display = 'block';
        
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

        const profilePage = document.getElementById('profilePage');
        if (!profilePage) return;
        
        profilePage.innerHTML = '<div class="spinner"></div>';

        try {
            const userDoc = await db.collection('users').doc(uid).get();
            
            if (!userDoc.exists) {
                profilePage.innerHTML = `
                    <div class="profile-not-found">
                        <i class="fas fa-user-slash"></i>
                        <h3>User not found</h3>
                        <p>This truth-teller doesn't exist or was removed.</p>
                    </div>
                `;
                return;
            }

            const user = userDoc.data();
            const currentUser = Auth.getUser();
            const isOwnProfile = currentUser && currentUser.uid === uid;
            const initial = (user.displayName || '?')[0].toUpperCase();
            const joinDate = user.createdAt ? user.createdAt.toDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'recently';

            profilePage.innerHTML = `
                <div class="profile-banner"></div>
                <div class="profile-header-section">
                    <div class="profile-page-avatar">${escapeHtml(initial)}</div>
                    <h1 class="profile-page-name">${escapeHtml(user.displayName || 'Truth-Teller')}</h1>
                    <p class="profile-page-username">@${escapeHtml(user.username || 'user')}</p>
                    ${user.bio ? `<p class="profile-page-bio">${escapeHtml(user.bio)}</p>` : ''}
                    <div class="profile-page-meta">
                        <span><i class="fas fa-calendar"></i> Joined ${joinDate}</span>
                        ${user.email && isOwnProfile ? `<span><i class="fas fa-envelope"></i> ${escapeHtml(user.email)}</span>` : ''}
                    </div>
                    <div class="profile-page-actions">
                        ${isOwnProfile ? `
                            <button class="btn btn-ghost" id="editProfileBtn">
                                <i class="fas fa-edit"></i> Edit Profile
                            </button>
                            <button class="btn btn-ghost" id="copyProfileLink">
                                <i class="fas fa-link"></i> Copy Profile Link
                            </button>
                        ` : `
                            <button class="btn btn-primary" id="messageBtn">
                                <i class="fas fa-comment"></i> Resonate with this person
                            </button>
                            <button class="btn btn-ghost" id="copyProfileLink">
                                <i class="fas fa-link"></i> Share Profile
                            </button>
                        `}
                    </div>
                </div>
                <div class="profile-page-stats">
                    <div class="profile-stat-box">
                        <span class="profile-stat-value">${user.postCount || 0}</span>
                        <span class="profile-stat-label">Confessions</span>
                    </div>
                    <div class="profile-stat-box">
                        <span class="profile-stat-value">${user.resonateCount || 0}</span>
                        <span class="profile-stat-label">Resonated</span>
                    </div>
                    <div class="profile-stat-box">
                        <span class="profile-stat-value">${user.wisdomCount || 0}</span>
                        <span class="profile-stat-label">Wisdom Given</span>
                    </div>
                    <div class="profile-stat-box">
                        <span class="profile-stat-value" id="profileMoneyLost">$0</span>
                        <span class="profile-stat-label">Money Lost</span>
                    </div>
                </div>
                <div class="profile-tabs">
                    <button class="profile-tab active" data-tab="posts">
                        <i class="fas fa-stream"></i> Confessions
                    </button>
                    <button class="profile-tab" data-tab="wisdom">
                        <i class="fas fa-lightbulb"></i> Wisdom Given
                    </button>
                    <button class="profile-tab" data-tab="resonated">
                        <i class="fas fa-heart"></i> Resonated
                    </button>
                </div>
                <div class="profile-content" id="profileContent">
                    <div class="spinner"></div>
                </div>
            `;

            // Profile tab handlers
            document.querySelectorAll('.profile-tab').forEach(tab => {
                tab.removeEventListener('click', handleProfileTabClick);
                tab.addEventListener('click', handleProfileTabClick);
            });

            // Copy profile link
            const copyProfileLink = document.getElementById('copyProfileLink');
            if (copyProfileLink) {
                copyProfileLink.removeEventListener('click', handleCopyProfileLink);
                copyProfileLink.addEventListener('click', () => handleCopyProfileLink(user.username));
            }

            // Edit profile (own)
            const editProfileBtn = document.getElementById('editProfileBtn');
            if (editProfileBtn) {
                editProfileBtn.removeEventListener('click', handleEditProfile);
                editProfileBtn.addEventListener('click', () => handleEditProfile(user));
            }

            // Message button
            const messageBtn = document.getElementById('messageBtn');
            if (messageBtn) {
                messageBtn.removeEventListener('click', handleMessageUser);
                messageBtn.addEventListener('click', () => handleMessageUser(user));
            }

            // Load initial content
            await loadProfileContent(uid);
            
        } catch (error) {
            console.error('Error loading profile:', error);
            profilePage.innerHTML = `
                <div class="profile-not-found">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error loading profile</h3>
                    <p>${escapeHtml(error.message)}</p>
                </div>
            `;
        }
    }

    function handleProfileTabClick(e) {
        const tab = e.currentTarget;
        document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentProfileTab = tab.dataset.tab;
        if (currentProfileUid) {
            loadProfileContent(currentProfileUid);
        }
    }

    function handleCopyProfileLink(username) {
        const url = `${window.location.origin}${window.location.pathname}?u=${username || 'user'}`;
        navigator.clipboard.writeText(url);
        if (App && App.showToast) {
            App.showToast(`Copied @${username || 'user'}'s profile link! 🔗`, 'success');
        }
    }

    function handleEditProfile(user) {
        const newBio = prompt('Update your bio (max 100 chars):', user.bio || '');
        if (newBio !== null && newBio !== user.bio) {
            const currentUser = Auth.getUser();
            if (currentUser) {
                db.collection('users').doc(currentUser.uid).update({
                    bio: newBio.substring(0, 100)
                }).then(() => {
                    if (App && App.showToast) App.showToast('Profile updated! ✨', 'success');
                    loadProfile(currentUser.uid);
                }).catch(err => {
                    console.error('Update error:', err);
                    if (App && App.showToast) App.showToast('Failed to update', 'error');
                });
            }
        }
    }

    function handleMessageUser(user) {
        if (App && App.showToast) {
            App.showToast(`This feature is coming soon! You'll be able to message @${user.username || 'user'}`, 'info');
        }
    }

    async function loadProfileContent(uid) {
        const container = document.getElementById('profileContent');
        if (!container) return;
        
        container.innerHTML = '<div class="spinner"></div>';

        try {
            let posts = [];
            let totalMoney = 0;

            if (currentProfileTab === 'posts') {
                const snap = await db.collection('posts')
                    .where('authorId', '==', uid)
                    .orderBy('createdAt', 'desc')
                    .limit(50)
                    .get();
                snap.forEach(doc => {
                    const data = { id: doc.id, ...doc.data() };
                    posts.push(data);
                    if (data.moneyLost) totalMoney += data.moneyLost;
                });
                const profileMoneyLost = document.getElementById('profileMoneyLost');
                if (profileMoneyLost) {
                    profileMoneyLost.textContent = `$${totalMoney.toLocaleString()}`;
                }
            } else if (currentProfileTab === 'resonated') {
                const snap = await db.collection('posts')
                    .where('resonatedBy', 'array-contains', uid)
                    .orderBy('createdAt', 'desc')
                    .limit(50)
                    .get();
                snap.forEach(doc => {
                    posts.push({ id: doc.id, ...doc.data() });
                });
            } else if (currentProfileTab === 'wisdom') {
                // Get comments by user
                // Note: This requires a collection group index in Firebase
                try {
                    const commentsSnap = await db.collectionGroup('comments')
                        .where('authorId', '==', uid)
                        .orderBy('createdAt', 'desc')
                        .limit(30)
                        .get();
                    
                    if (commentsSnap.empty) {
                        container.innerHTML = `
                            <div class="empty-state">
                                <i class="fas fa-lightbulb"></i>
                                <h3>No Wisdom Shared Yet</h3>
                                <p>This user hasn't shared wisdom on any confessions yet.</p>
                            </div>
                        `;
                        return;
                    }
                    
                    container.innerHTML = '<div class="wisdom-list"></div>';
                    const wisdomList = container.querySelector('.wisdom-list');
                    commentsSnap.forEach(doc => {
                        const comment = doc.data();
                        const timeAgo = comment.createdAt ? getTimeAgo(comment.createdAt.toDate()) : 'Just now';
                        const wisdomDiv = document.createElement('div');
                        wisdomDiv.className = 'wisdom-item';
                        wisdomDiv.innerHTML = `
                            <div class="wisdom-header">
                                <span class="wisdom-time">${timeAgo}</span>
                            </div>
                            <p class="wisdom-text">"${escapeHtml(comment.text)}"</p>
                        `;
                        wisdomList.appendChild(wisdomDiv);
                    });
                    return;
                } catch (error) {
                    console.error('Error loading wisdom comments:', error);
                    container.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-lightbulb"></i>
                            <h3>Wisdom Coming Soon</h3>
                            <p>This view requires a Firebase index. Check console for details.</p>
                        </div>
                    `;
                    return;
                }
            }

            if (posts.length === 0) {
                const emptyMessages = {
                    posts: { icon: 'fa-ghost', title: 'No confessions yet', text: 'No vulnerable stories shared yet.' },
                    resonated: { icon: 'fa-heart-broken', title: 'Nothing resonated yet', text: 'No posts resonated with this user yet.' }
                };
                const msg = emptyMessages[currentProfileTab] || emptyMessages.posts;
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas ${msg.icon}"></i>
                        <h3>${msg.title}</h3>
                        <p>${msg.text}</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = '';
            posts.forEach(post => {
                container.appendChild(createCompactPostCard(post));
            });
        } catch (error) {
            console.error('Error loading profile content:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error loading</h3>
                    <p>${escapeHtml(error.message)}</p>
                </div>
            `;
        }
    }

    function createCompactPostCard(post) {
        const card = document.createElement('div');
        card.className = 'post-card';
        card.dataset.id = post.id;
        const timeAgo = post.createdAt ? getTimeAgo(post.createdAt.toDate()) : 'Just now';
        
        // Use Categories module if available
        let categoryEmoji = '📌';
        let categoryLabel = post.category || 'uncategorized';
        
        if (typeof Categories !== 'undefined' && Categories.getCategoryEmoji) {
            categoryEmoji = Categories.getCategoryEmoji(post.category);
            categoryLabel = Categories.getCategoryLabel(post.category);
        }

        card.innerHTML = `
            <div class="post-header">
                <div class="post-avatar ${post.isAnonymous ? 'anonymous' : ''}">
                    <span>${escapeHtml(post.authorInitial || '?')}</span>
                </div>
                <div class="post-user-info">
                    <div class="post-username">${escapeHtml(post.authorName || 'Anonymous')}</div>
                    <div class="post-meta">
                        <span class="post-category-badge ${post.category || ''}">
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
            <h3 class="post-title">${escapeHtml(post.title || 'Untitled')}</h3>
            <p class="post-content">${escapeHtml(post.content || '')}</p>
            ${post.wisdom ? `
                <div class="post-wisdom">
                    <div class="post-wisdom-label">
                        <i class="fas fa-robot"></i> AI-Extracted Wisdom
                    </div>
                    <p class="post-wisdom-text">"${escapeHtml(post.wisdom)}"</p>
                </div>
            ` : ''}
            <div class="post-actions">
                <span class="post-action-btn">
                    <i class="fas fa-heart"></i> ${post.resonateCount || 0}
                </span>
                <span class="post-action-btn">
                    <i class="fas fa-comment"></i> ${post.commentCount || 0}
                </span>
            </div>
        `;
        return card;
    }

    function showFeedSection() {
        const feedSection = document.getElementById('feedSection');
        const wisdomSection = document.getElementById('wisdomSection');
        const leaderboardSection = document.getElementById('leaderboardSection');
        const profileSection = document.getElementById('profileSection');
        
        if (feedSection) feedSection.style.display = 'block';
        if (wisdomSection) wisdomSection.style.display = 'none';
        if (leaderboardSection) leaderboardSection.style.display = 'none';
        if (profileSection) profileSection.style.display = 'none';
    }

    // Check URL for direct profile links (?u=username)
    async function checkUrlProfile() {
        const params = new URLSearchParams(window.location.search);
        const username = params.get('u');
        if (username && Auth.getUser()) {
            try {
                // Query users collection for matching username
                const usersSnap = await db.collection('users')
                    .where('username', '==', username)
                    .limit(1)
                    .get();
                
                if (!usersSnap.empty) {
                    const userDoc = usersSnap.docs[0];
                    loadProfile(userDoc.id);
                }
            } catch (e) {
                console.error('URL profile error:', e);
            }
        }
    }

    // Utils
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

    function debounce(fn, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), delay);
        };
    }

    return { init, loadProfile, openProfile, scrollToPost, checkUrlProfile };
})();