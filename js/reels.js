// ========================================
// Reels Module — Cloudinary Powered (COMMENTS FIXED)
// ========================================

const Reels = (() => {
    let currentVideoFile = null;
    let unsubscribeReels = null;
    let observer = null;
    let isUploading = false;
    const REELS_LIMIT = 20;

    function init() {
        const uploadReelBtn = document.getElementById('uploadReelBtn');
        const closeUploadModal = document.getElementById('closeUploadModal');
        const cancelUpload = document.getElementById('cancelUpload');
        const uploadArea = document.getElementById('uploadArea');
        const videoFileInput = document.getElementById('videoFile');
        const changeVideoBtn = document.getElementById('changeVideoBtn');
        const reelCaption = document.getElementById('reelCaption');
        const uploadReelForm = document.getElementById('uploadReelForm');

        if (uploadReelBtn) uploadReelBtn.addEventListener('click', openUploadModal);
        if (closeUploadModal) closeUploadModal.addEventListener('click', closeUploadModal);
        if (cancelUpload) cancelUpload.addEventListener('click', closeUploadModal);
        
        if (uploadArea && videoFileInput) {
            uploadArea.addEventListener('click', () => videoFileInput.click());
            videoFileInput.addEventListener('change', handleFileSelect);
        }
        
        if (changeVideoBtn && videoFileInput) {
            changeVideoBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                videoFileInput.click();
            });
        }
        
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('drag-over');
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('drag-over');
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('video/') && videoFileInput) {
                    videoFileInput.files = e.dataTransfer.files;
                    handleFileSelect({ target: { files: [file] } });
                } else if (file) {
                    if (App && App.showToast) App.showToast('Please drop a video file', 'error');
                }
            });
        }
        
        if (reelCaption) {
            reelCaption.addEventListener('input', (e) => {
                const captionCount = document.getElementById('captionCount');
                if (captionCount) captionCount.textContent = e.target.value.length;
            });
        }
        
        if (uploadReelForm) uploadReelForm.addEventListener('submit', uploadReel);
        
        initReelCategoryPicker();
    }

    // ===== CATEGORY PICKER =====
    function initReelCategoryPicker() {
        const btn = document.getElementById('reelCategoryBtn');
        const dropdown = document.getElementById('reelCategoryDropdown');
        const searchInput = document.getElementById('reelCategorySearch');
        
        if (!btn || !dropdown) return;

        btn.removeEventListener('click', handleReelCategoryClick);
        btn.addEventListener('click', handleReelCategoryClick);

        if (searchInput) {
            searchInput.removeEventListener('input', handleReelCategorySearch);
            searchInput.addEventListener('input', handleReelCategorySearch);
        }

        document.removeEventListener('click', handleOutsideReelClick);
        document.addEventListener('click', handleOutsideReelClick);
    }

    function handleReelCategoryClick(e) {
        e.preventDefault();
        e.stopPropagation();
        const dropdown = document.getElementById('reelCategoryDropdown');
        if (!dropdown) return;
        
        const isOpen = dropdown.style.display === 'block';
        dropdown.style.display = isOpen ? 'none' : 'block';
        
        if (!isOpen) {
            renderReelCategoryList('');
            const searchInput = document.getElementById('reelCategorySearch');
            setTimeout(() => searchInput?.focus(), 100);
        }
    }

    function handleReelCategorySearch(e) {
        renderReelCategoryList(e.target.value.toLowerCase().trim());
    }

    function handleOutsideReelClick(e) {
        const dropdown = document.getElementById('reelCategoryDropdown');
        const btn = document.getElementById('reelCategoryBtn');
        if (dropdown && btn && 
            !btn.contains(e.target) && 
            !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    }

    function renderReelCategoryList(searchQuery = '') {
        const list = document.getElementById('reelCategoryList');
        if (!list) return;
        
        if (typeof Categories === 'undefined' || !Categories.getAllCategories) {
            list.innerHTML = '<div class="picker-no-results">Categories not loaded</div>';
            return;
        }
        
        const allCats = Categories.getAllCategories();
        const filtered = allCats.filter(cat =>
            cat.label.toLowerCase().includes(searchQuery) ||
            cat.id.toLowerCase().includes(searchQuery)
        );

        if (filtered.length === 0) {
            list.innerHTML = `<div class="picker-no-results">No category matches "${escapeHtml(searchQuery)}"</div>`;
            return;
        }

        list.innerHTML = filtered.map(cat => `
            <button type="button" class="picker-item" data-cat="${escapeHtml(cat.id)}" data-emoji="${cat.emoji}" data-label="${escapeHtml(cat.label)}">
                <span class="picker-emoji">${cat.emoji}</span>
                <span class="picker-label">${escapeHtml(cat.label)}</span>
            </button>
        `).join('');

        list.querySelectorAll('.picker-item').forEach(item => {
            item.removeEventListener('click', handleReelCategorySelect);
            item.addEventListener('click', handleReelCategorySelect);
        });
    }

    function handleReelCategorySelect(e) {
        const item = e.currentTarget;
        const categoryInput = document.getElementById('reelCategory');
        const selectedDisplay = document.getElementById('reelSelectedCategory');
        const dropdown = document.getElementById('reelCategoryDropdown');
        
        if (categoryInput) categoryInput.value = item.dataset.cat;
        if (selectedDisplay) {
            selectedDisplay.innerHTML = `${item.dataset.emoji} ${item.dataset.label}`;
            selectedDisplay.style.color = 'var(--text-primary)';
        }
        if (dropdown) dropdown.style.display = 'none';
    }

    // ===== MODAL CONTROLS =====
    function openUploadModal() {
        const user = Auth.getUser();
        if (!user) {
            if (App && App.showToast) App.showToast('Login to upload reels', 'error');
            return;
        }
        
        const modal = document.getElementById('uploadReelModal');
        if (modal) modal.style.display = 'flex';
    }

    function closeUploadModal() {
        const modal = document.getElementById('uploadReelModal');
        const form = document.getElementById('uploadReelForm');
        const uploadPlaceholder = document.getElementById('uploadPlaceholder');
        const uploadPreview = document.getElementById('uploadPreview');
        const uploadProgress = document.getElementById('uploadProgress');
        const captionCount = document.getElementById('captionCount');
        const selectedCategory = document.getElementById('reelSelectedCategory');
        const progressFill = document.getElementById('progressFill');
        
        if (modal) modal.style.display = 'none';
        if (form) form.reset();
        if (uploadPlaceholder) uploadPlaceholder.style.display = 'block';
        if (uploadPreview) uploadPreview.style.display = 'none';
        if (uploadProgress) uploadProgress.style.display = 'none';
        if (captionCount) captionCount.textContent = '0';
        if (selectedCategory) {
            selectedCategory.innerHTML = '📌 Select category...';
            selectedCategory.style.color = '';
        }
        if (progressFill) progressFill.style.width = '0%';
        
        currentVideoFile = null;
        isUploading = false;
    }

    // ===== FILE HANDLING =====
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('video/')) {
            if (App && App.showToast) App.showToast('Please select a video file', 'error');
            return;
        }
        
        if (file.size > 50 * 1024 * 1024) {
            if (App && App.showToast) App.showToast('Video must be less than 50MB', 'error');
            return;
        }
        
        currentVideoFile = file;
        
        const previewVideo = document.getElementById('previewVideo');
        const uploadPlaceholder = document.getElementById('uploadPlaceholder');
        const uploadPreview = document.getElementById('uploadPreview');
        
        if (!previewVideo) return;
        
        const url = URL.createObjectURL(file);
        previewVideo.src = url;
        
        previewVideo.onloadedmetadata = () => {
            if (previewVideo.duration > 60) {
                if (App && App.showToast) App.showToast('Video must be 60 seconds or less', 'error');
                currentVideoFile = null;
                if (uploadPlaceholder) uploadPlaceholder.style.display = 'block';
                if (uploadPreview) uploadPreview.style.display = 'none';
                return;
            }
            if (uploadPlaceholder) uploadPlaceholder.style.display = 'none';
            if (uploadPreview) uploadPreview.style.display = 'block';
        };
    }

    // ===== CLOUDINARY UPLOAD =====
    async function uploadToCloudinary(file, onProgress) {
        return new Promise((resolve, reject) => {
            if (typeof CLOUDINARY_CONFIG === 'undefined' || !CLOUDINARY_CONFIG.cloudName) {
                reject(new Error('Cloudinary not configured'));
                return;
            }
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
            formData.append('folder', CLOUDINARY_CONFIG.folder);
            
            const xhr = new XMLHttpRequest();
            const uploadUrl = `${CLOUDINARY_CONFIG.apiUrl}/${CLOUDINARY_CONFIG.cloudName}/video/upload`;
            xhr.open('POST', uploadUrl, true);
            
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && onProgress) {
                    const percent = (e.loaded / e.total) * 100;
                    onProgress(percent);
                }
            });
            
            xhr.onload = () => {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (error) {
                        reject(new Error('Invalid response from Cloudinary'));
                    }
                } else {
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        reject(new Error(errorResponse.error?.message || 'Upload failed'));
                    } catch (error) {
                        reject(new Error(`Upload failed with status ${xhr.status}`));
                    }
                }
            };
            
            xhr.onerror = () => reject(new Error('Network error during upload'));
            xhr.send(formData);
        });
    }

    // ===== POST REEL =====
    async function uploadReel(e) {
        e.preventDefault();
        
        if (isUploading) {
            if (App && App.showToast) App.showToast('Upload in progress...', 'info');
            return;
        }
        
        const user = Auth.getUser();
        if (!user) {
            if (App && App.showToast) App.showToast('Please login first', 'error');
            return;
        }
        
        if (!currentVideoFile) {
            if (App && App.showToast) App.showToast('Please select a video', 'error');
            return;
        }
        
        const caption = document.getElementById('reelCaption')?.value.trim() || '';
        const category = document.getElementById('reelCategory')?.value;
        const tagsRaw = document.getElementById('reelTags')?.value || '';
        
        if (!category) {
            if (App && App.showToast) App.showToast('Please select a category', 'error');
            return;
        }
        
        const tags = tagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(t => t && t.length > 0);
        
        const submitBtn = document.getElementById('submitUpload');
        const progressContainer = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (submitBtn) submitBtn.disabled = true;
        if (progressContainer) progressContainer.style.display = 'block';
        isUploading = true;
        
        try {
            const cloudinaryResponse = await uploadToCloudinary(currentVideoFile, (percent) => {
                if (progressFill) progressFill.style.width = `${percent}%`;
                if (progressText) progressText.textContent = `Uploading to Cloudinary... ${Math.round(percent)}%`;
            });
            
            if (progressText) progressText.textContent = 'Saving to database...';
            
            let wisdom = '';
            if (typeof AIWisdom !== 'undefined' && AIWisdom.extractWisdom) {
                wisdom = AIWisdom.extractWisdom(caption, caption, category);
            }
            
            let userDisplayName = user.displayName || 'Truth-Teller';
            let userUsername = 'user';
            
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    userDisplayName = userData.displayName || userDisplayName;
                    userUsername = userData.username || userUsername;
                }
            } catch (err) {
                console.warn('Could not fetch user data:', err);
            }
            
            const thumbnailUrl = cloudinaryResponse.secure_url
                .replace('/video/upload/', '/video/upload/so_2,w_400,h_700,c_fill/')
                .replace(/\.[^/.]+$/, '.jpg');
            
            const optimizedVideoUrl = cloudinaryResponse.secure_url
                .replace('/video/upload/', '/video/upload/q_auto,f_auto/');
            
            const previewVideo = document.getElementById('previewVideo');
            const duration = previewVideo ? previewVideo.duration : (cloudinaryResponse.duration || 0);
            
            await db.collection('reels').add({
                videoUrl: optimizedVideoUrl,
                originalVideoUrl: cloudinaryResponse.secure_url,
                thumbnailUrl: thumbnailUrl,
                caption,
                category,
                tags,
                wisdom,
                duration: duration,
                cloudinaryPublicId: cloudinaryResponse.public_id,
                cloudinaryAssetId: cloudinaryResponse.asset_id || '',
                fileSize: cloudinaryResponse.bytes || currentVideoFile.size,
                width: cloudinaryResponse.width || 0,
                height: cloudinaryResponse.height || 0,
                authorId: user.uid,
                authorName: userDisplayName,
                authorUsername: userUsername,
                authorInitial: (userDisplayName[0] || '?').toUpperCase(),
                likeCount: 0,
                commentCount: 0,
                viewCount: 0,
                shareCount: 0,
                likedBy: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            await db.collection('stats').doc('global').set({
                totalReels: firebase.firestore.FieldValue.increment(1)
            }, { merge: true });
            
            if (App && App.showToast) App.showToast('Reel posted! 🎬', 'success');
            closeUploadModal();
            loadReels();
            
        } catch (error) {
            console.error('Upload error:', error);
            if (App && App.showToast) App.showToast('Upload failed: ' + error.message, 'error');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
            if (progressContainer) progressContainer.style.display = 'none';
            isUploading = false;
        }
    }

    // ===== LOAD REELS =====
    function loadReels() {
        if (unsubscribeReels && typeof unsubscribeReels === 'function') {
            unsubscribeReels();
        }
        
        // Close all comment panels before loading new reels
        const allPanels = document.querySelectorAll('.reel-comments-panel');
        allPanels.forEach(panel => {
            panel.style.display = 'none';
        });
        
        const container = document.getElementById('reelsContainer');
        if (!container) return;
        
        container.innerHTML = '<div class="reels-loading"><div class="spinner"></div><p>Loading reels...</p></div>';
        
        unsubscribeReels = db.collection('reels')
            .orderBy('createdAt', 'desc')
            .limit(REELS_LIMIT)
            .onSnapshot((snapshot) => {
                if (snapshot.empty) {
                    container.innerHTML = `
                        <div class="reels-empty">
                            <i class="fas fa-video-slash"></i>
                            <h3>No reels yet</h3>
                            <p>Be the first to share a video confession!</p>
                            <button class="btn btn-primary" id="emptyUploadBtn">
                                <i class="fas fa-plus"></i> Upload First Reel
                            </button>
                        </div>
                    `;
                    const emptyBtn = document.getElementById('emptyUploadBtn');
                    if (emptyBtn) emptyBtn.addEventListener('click', openUploadModal);
                    return;
                }
                
                container.innerHTML = '';
                snapshot.forEach(doc => {
                    const reel = { id: doc.id, ...doc.data() };
                    container.appendChild(createReelCard(reel));
                });
                
                setupVideoObserver();
            }, (error) => {
                console.error('Reels load error:', error);
                container.innerHTML = `
                    <div class="reels-empty">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Error loading reels</h3>
                        <p>${escapeHtml(error.message)}</p>
                        <button class="btn btn-primary" onclick="Reels.loadReels()">
                            <i class="fas fa-sync-alt"></i> Retry
                        </button>
                    </div>
                `;
            });
    }

    // ===== REEL CARD =====
    function createReelCard(reel) {
        const card = document.createElement('div');
        card.className = 'reel-card';
        card.dataset.id = reel.id;
        
        const user = Auth.getUser();
        const hasLiked = reel.likedBy && Array.isArray(reel.likedBy) && reel.likedBy.includes(user?.uid);
        const timeAgo = reel.createdAt ? getTimeAgo(reel.createdAt.toDate()) : 'Just now';
        
        let categoryEmoji = '📌';
        let categoryLabel = reel.category || 'uncategorized';
        
        if (typeof Categories !== 'undefined' && Categories.getCategoryEmoji && Categories.getCategoryLabel) {
            categoryEmoji = Categories.getCategoryEmoji(reel.category);
            categoryLabel = Categories.getCategoryLabel(reel.category);
        }
        
        card.innerHTML = `
            <div class="reel-video-wrapper">
                <video 
                    class="reel-video" 
                    src="${escapeHtml(reel.videoUrl || '')}" 
                    poster="${escapeHtml(reel.thumbnailUrl || '')}"
                    loop 
                    playsinline 
                    muted
                    preload="metadata"
                    data-id="${reel.id}">
                </video>
                
                <div class="reel-play-overlay">
                    <i class="fas fa-play"></i>
                </div>
                
                <button class="reel-mute-btn" data-id="${reel.id}">
                    <i class="fas fa-volume-mute"></i>
                </button>
                
                <div class="reel-progress">
                    <div class="reel-progress-fill" data-id="${reel.id}"></div>
                </div>
                
                <div class="reel-views">
                    <i class="fas fa-eye"></i> ${formatCount(reel.viewCount || 0)}
                </div>
                
                <div class="reel-actions">
                    <button class="reel-action-btn like-btn ${hasLiked ? 'liked' : ''}" data-id="${reel.id}">
                        <i class="${hasLiked ? 'fas' : 'far'} fa-heart"></i>
                        <span class="action-count">${formatCount(reel.likeCount || 0)}</span>
                    </button>
                    <button class="reel-action-btn comment-btn" data-id="${reel.id}">
                        <i class="far fa-comment"></i>
                        <span class="action-count">${formatCount(reel.commentCount || 0)}</span>
                    </button>
                    <button class="reel-action-btn share-btn" data-id="${reel.id}">
                        <i class="fas fa-share"></i>
                        <span class="action-count">${formatCount(reel.shareCount || 0)}</span>
                    </button>
                    ${reel.authorId === user?.uid ? `
                        <button class="reel-action-btn delete-btn" data-id="${reel.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
                
                <div class="reel-info">
                    <div class="reel-author">
                        <div class="reel-avatar" data-uid="${escapeHtml(reel.authorId)}">
                            ${escapeHtml(reel.authorInitial || '?')}
                        </div>
                        <div class="reel-author-info">
                            <div class="reel-author-name" data-uid="${escapeHtml(reel.authorId)}">
                                ${escapeHtml(reel.authorName || 'Anonymous')}
                                <span class="reel-username">@${escapeHtml(reel.authorUsername || 'user')}</span>
                            </div>
                            <div class="reel-meta">
                                <span class="reel-category">${categoryEmoji} ${escapeHtml(categoryLabel)}</span>
                                <span>•</span>
                                <span>${timeAgo}</span>
                            </div>
                        </div>
                    </div>
                    <p class="reel-caption">${escapeHtml(reel.caption || '')}</p>
                    ${reel.tags && reel.tags.length > 0 ? `
                        <div class="reel-tags">
                            ${reel.tags.map(t => `<span class="reel-tag">#${escapeHtml(t)}</span>`).join('')}
                        </div>
                    ` : ''}
                    ${reel.wisdom ? `
                        <div class="reel-wisdom">
                            <i class="fas fa-robot"></i>
                            <span>"${escapeHtml(reel.wisdom)}"</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Create comments panel
        const commentsPanel = createCommentsPanel(reel);
        card.appendChild(commentsPanel);
        
        attachReelEvents(card, reel);
        return card;
    }

    // ===== CREATE COMMENTS PANEL =====
    function createCommentsPanel(reel) {
        const panel = document.createElement('div');
        panel.className = 'reel-comments-panel';
        panel.id = `comments-${reel.id}`;
        panel.style.display = 'none';
        
        panel.innerHTML = `
            <div class="comments-panel-header">
                <div class="comments-header-left">
                    <i class="fas fa-comment-dots"></i>
                    <h4>Comments <span class="comment-count-badge">${reel.commentCount || 0}</span></h4>
                </div>
                <button class="close-comments-btn" data-reel-id="${reel.id}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="comments-panel-list" id="commentsList-${reel.id}">
                <div class="comments-loading">
                    <div class="spinner-small"></div>
                    <p>Loading comments...</p>
                </div>
            </div>
            <div class="comments-panel-input">
                <div class="comment-input-wrapper">
                    <div class="comment-input-avatar">
                        ${escapeHtml(Auth.getUser()?.displayName?.[0] || '?')}
                    </div>
                    <input type="text" placeholder="Add a comment..." data-reel-id="${reel.id}" class="comment-input-reel">
                    <button class="submit-comment-reel" data-reel-id="${reel.id}">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
        
        return panel;
    }

    // ===== EVENTS =====
    function attachReelEvents(card, reel) {
        // Get elements
        const video = card.querySelector('.reel-video');
        const videoWrapper = card.querySelector('.reel-video-wrapper');
        const playOverlay = card.querySelector('.reel-play-overlay');
        const muteBtn = card.querySelector('.reel-mute-btn');
        const progressFill = card.querySelector('.reel-progress-fill');
        const panel = card.querySelector('.reel-comments-panel');
        
        if (!video) return;
        
        // Video play/pause
        if (videoWrapper) {
            videoWrapper.addEventListener('click', (e) => {
                if (e.target.closest('.reel-actions') || 
                    e.target.closest('.reel-info') || 
                    e.target.closest('.reel-mute-btn') ||
                    e.target.closest('.reel-comments-panel') ||
                    e.target.closest('.reel-views')) return;
                
                if (video.paused) {
                    video.play().catch(err => console.warn('Play failed:', err));
                    if (playOverlay) playOverlay.style.opacity = '0';
                } else {
                    video.pause();
                    if (playOverlay) playOverlay.style.opacity = '1';
                }
            });
        }
        
        // Progress bar
        video.addEventListener('timeupdate', () => {
            if (video.duration) {
                const progress = (video.currentTime / video.duration) * 100;
                if (progressFill) progressFill.style.width = `${progress}%`;
            }
        });
        
        // View tracking
        let viewTracked = false;
        video.addEventListener('timeupdate', async () => {
            if (!viewTracked && video.currentTime > 3) {
                viewTracked = true;
                try {
                    await db.collection('reels').doc(reel.id).update({
                        viewCount: firebase.firestore.FieldValue.increment(1)
                    });
                } catch (err) {
                    console.warn('View count update failed:', err);
                }
            }
        });
        
        // Mute button
        if (muteBtn) {
            muteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                video.muted = !video.muted;
                muteBtn.innerHTML = video.muted ? 
                    '<i class="fas fa-volume-mute"></i>' : 
                    '<i class="fas fa-volume-up"></i>';
            });
        }
        
        // Profile clicks
        const avatar = card.querySelector('.reel-avatar');
        const authorName = card.querySelector('.reel-author-name');
        
        if (avatar) {
            avatar.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof Profile !== 'undefined' && Profile.openProfile) {
                    Profile.openProfile(reel.authorId);
                }
            });
        }
        
        if (authorName) {
            authorName.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof Profile !== 'undefined' && Profile.openProfile) {
                    Profile.openProfile(reel.authorId);
                }
            });
        }
        
        // Like button
        const likeBtn = card.querySelector('.like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await toggleLike(reel.id, likeBtn);
            });
        }
        
        // Double-tap to like
        if (videoWrapper) {
            let lastTap = 0;
            videoWrapper.addEventListener('click', (e) => {
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTap;
                if (tapLength < 300 && tapLength > 0 && likeBtn && !likeBtn.classList.contains('liked')) {
                    toggleLike(reel.id, likeBtn);
                    showDoubleTapHeart(e, videoWrapper);
                }
                lastTap = currentTime;
            });
        }
        
        // ===== COMMENT BUTTON - OPEN PANEL =====
        const commentBtn = card.querySelector('.comment-btn');
        if (commentBtn && panel) {
            commentBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Close all other panels first
                document.querySelectorAll('.reel-comments-panel').forEach(p => {
                    if (p !== panel) p.style.display = 'none';
                });
                
                // Toggle current panel
                if (panel.style.display === 'flex') {
                    panel.style.display = 'none';
                } else {
                    panel.style.display = 'flex';
                    video.pause();
                    if (playOverlay) playOverlay.style.opacity = '1';
                    // Load comments when opening panel
                    loadReelComments(reel.id);
                }
            });
        }
        
        // ===== CLOSE BUTTON =====
        const closeBtn = panel ? panel.querySelector('.close-comments-btn') : null;
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (panel) {
                    panel.style.display = 'none';
                }
                return false;
            });
        }
        
        // ===== SUBMIT COMMENT =====
        const submitBtn = panel ? panel.querySelector('.submit-comment-reel') : null;
        const commentInput = panel ? panel.querySelector('.comment-input-reel') : null;
        
        if (submitBtn && commentInput) {
            submitBtn.addEventListener('click', async () => {
                const text = commentInput.value.trim();
                if (text) {
                    await submitReelComment(reel.id, text);
                    commentInput.value = '';
                    // Reload comments after submitting
                    loadReelComments(reel.id);
                }
            });
            
            commentInput.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const text = commentInput.value.trim();
                    if (text) {
                        await submitReelComment(reel.id, text);
                        commentInput.value = '';
                        // Reload comments after submitting
                        loadReelComments(reel.id);
                    }
                }
            });
        }
        
        // Share button
        const shareBtn = card.querySelector('.share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await shareReel(reel);
            });
        }
        
        // Delete button
        const deleteBtn = card.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm('Delete this reel? This cannot be undone.')) {
                    await deleteReel(reel);
                }
            });
        }
    }

    function showDoubleTapHeart(e, wrapper) {
        const heart = document.createElement('div');
        heart.className = 'double-tap-heart';
        heart.innerHTML = '❤️';
        const rect = wrapper.getBoundingClientRect();
        heart.style.left = `${e.clientX - rect.left - 40}px`;
        heart.style.top = `${e.clientY - rect.top - 40}px`;
        wrapper.appendChild(heart);
        setTimeout(() => heart.remove(), 1000);
    }

    // ===== LIKE =====
    async function toggleLike(reelId, btn) {
        const user = Auth.getUser();
        if (!user) {
            if (App && App.showToast) App.showToast('Login to like reels', 'error');
            return;
        }
        
        const reelRef = db.collection('reels').doc(reelId);
        const isLiked = btn.classList.contains('liked');
        
        try {
            if (isLiked) {
                await reelRef.update({
                    likeCount: firebase.firestore.FieldValue.increment(-1),
                    likedBy: firebase.firestore.FieldValue.arrayRemove(user.uid)
                });
                btn.classList.remove('liked');
                const icon = btn.querySelector('i');
                if (icon) icon.className = 'far fa-heart';
            } else {
                await reelRef.update({
                    likeCount: firebase.firestore.FieldValue.increment(1),
                    likedBy: firebase.firestore.FieldValue.arrayUnion(user.uid)
                });
                btn.classList.add('liked');
                const icon = btn.querySelector('i');
                if (icon) icon.className = 'fas fa-heart';
                createHeartBurst(btn);
            }
            
            const updatedDoc = await reelRef.get();
            const countSpan = btn.querySelector('.action-count');
            if (countSpan) countSpan.textContent = formatCount(updatedDoc.data().likeCount || 0);
        } catch (error) {
            console.error('Like error:', error);
        }
    }

    function createHeartBurst(btn) {
        const burst = document.createElement('div');
        burst.className = 'heart-burst';
        burst.innerHTML = '❤️';
        btn.appendChild(burst);
        setTimeout(() => burst.remove(), 1000);
    }

    // ===== COMMENTS - FIXED VERSION =====
    async function loadReelComments(reelId) {
        const listContainer = document.getElementById(`commentsList-${reelId}`);
        if (!listContainer) {
            console.error('Comments list container not found for reel:', reelId);
            return;
        }
        
        try {
            // Show loading state
            listContainer.innerHTML = `
                <div class="comments-loading">
                    <div class="spinner-small"></div>
                    <p>Loading comments...</p>
                </div>
            `;
            
            // Fetch comments from Firestore
            const commentsRef = db.collection('reels').doc(reelId).collection('comments');
            const snapshot = await commentsRef
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();
            
            if (snapshot.empty) {
                listContainer.innerHTML = `
                    <div class="no-comments">
                        <i class="far fa-comment-dots"></i>
                        <p>No comments yet</p>
                        <span>Be the first to share your wisdom</span>
                    </div>
                `;
                return;
            }
            
            // Clear container
            listContainer.innerHTML = '';
            
            // Display each comment
            snapshot.forEach(doc => {
                const comment = doc.data();
                const timeAgo = comment.createdAt ? getTimeAgo(comment.createdAt.toDate()) : 'Just now';
                
                const commentElement = document.createElement('div');
                commentElement.className = 'reel-comment';
                commentElement.innerHTML = `
                    <div class="reel-comment-avatar" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        ${escapeHtml(comment.authorInitial || '?')}
                    </div>
                    <div class="reel-comment-content">
                        <div class="reel-comment-header">
                            <div class="reel-comment-author">
                                <strong>${escapeHtml(comment.authorName || 'Anonymous')}</strong>
                                <span class="reel-comment-time">${timeAgo}</span>
                            </div>
                        </div>
                        <p class="reel-comment-text">${escapeHtml(comment.text)}</p>
                    </div>
                `;
                listContainer.appendChild(commentElement);
            });
            
            // Scroll to bottom of comments (like Instagram)
            listContainer.scrollTop = listContainer.scrollHeight;
            
        } catch (error) {
            console.error('Error loading comments:', error);
            listContainer.innerHTML = `
                <div class="comments-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load comments</p>
                    <button class="retry-comments-btn" onclick="Reels.loadReelComments('${reelId}')">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    async function submitReelComment(reelId, text) {
        const user = Auth.getUser();
        if (!user) {
            if (App && App.showToast) App.showToast('Login to comment', 'error');
            return false;
        }
        
        try {
            // Get user data
            let userName = user.displayName || 'Truth-Teller';
            let userInitial = (userName[0] || '?').toUpperCase();
            
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    userName = userData.displayName || userName;
                    userInitial = (userName[0] || '?').toUpperCase();
                }
            } catch (err) {
                console.warn('Could not fetch user data:', err);
            }
            
            // Add comment to Firestore
            await db.collection('reels').doc(reelId).collection('comments').add({
                text: text,
                authorId: user.uid,
                authorName: userName,
                authorInitial: userInitial,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Update comment count on reel
            await db.collection('reels').doc(reelId).update({
                commentCount: firebase.firestore.FieldValue.increment(1)
            });
            
            // Update UI comment count
            const commentBtn = document.querySelector(`.comment-btn[data-id="${reelId}"]`);
            if (commentBtn) {
                const countSpan = commentBtn.querySelector('.action-count');
                const currentCount = parseInt(countSpan?.textContent) || 0;
                if (countSpan) countSpan.textContent = formatCount(currentCount + 1);
            }
            
            // Update panel header count
            const panel = document.getElementById(`comments-${reelId}`);
            if (panel) {
                const badge = panel.querySelector('.comment-count-badge');
                if (badge) {
                    const currentCount = parseInt(badge.textContent) || 0;
                    badge.textContent = currentCount + 1;
                }
            }
            
            if (App && App.showToast) App.showToast('Comment added! 💬', 'success');
            return true;
            
        } catch (error) {
            console.error('Comment error:', error);
            if (App && App.showToast) App.showToast('Failed to post comment', 'error');
            return false;
        }
    }

    // ===== SHARE =====
    async function shareReel(reel) {
        const shareUrl = `${window.location.origin}${window.location.pathname}?reel=${reel.id}`;
        const shareData = {
            title: 'FailForward Reel',
            text: reel.caption || 'Check out this FailForward reel!',
            url: shareUrl
        };
        
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareUrl);
                if (App && App.showToast) App.showToast('Link copied! 🔗', 'success');
            }
            
            await db.collection('reels').doc(reel.id).update({
                shareCount: firebase.firestore.FieldValue.increment(1)
            });
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Share error:', error);
            }
        }
    }

    // ===== DELETE =====
    async function deleteReel(reel) {
        try {
            await db.collection('reels').doc(reel.id).delete();
            if (App && App.showToast) App.showToast('Reel deleted', 'info');
            loadReels();
        } catch (error) {
            console.error('Delete error:', error);
            if (App && App.showToast) App.showToast('Failed to delete', 'error');
        }
    }

    // ===== AUTO-PLAY ON SCROLL =====
    function setupVideoObserver() {
        if (observer && typeof observer.disconnect === 'function') {
            observer.disconnect();
        }
        
        observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                const playOverlay = video?.parentElement?.querySelector('.reel-play-overlay');
                const card = video.closest('.reel-card');
                const panel = card?.querySelector('.reel-comments-panel');
                
                // Don't autoplay if comments panel is open
                const isPanelOpen = panel && panel.style.display === 'flex';
                
                if (entry.isIntersecting && entry.intersectionRatio > 0.6 && !isPanelOpen) {
                    video.play().catch(err => console.warn('Auto-play failed:', err));
                    if (playOverlay) playOverlay.style.opacity = '0';
                } else {
                    video.pause();
                    if (playOverlay) playOverlay.style.opacity = '1';
                }
            });
        }, { threshold: [0, 0.6, 1] });
        
        const videos = document.querySelectorAll('.reel-video');
        videos.forEach(v => observer.observe(v));
    }

    // Expose loadReelComments globally for retry button
    window.loadReelComments = loadReelComments;

    // ===== UTILS =====
    function formatCount(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    function getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d`;
        return date.toLocaleDateString();
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function openUpload() {
        openUploadModal();
    }

    return { init, loadReels, openUpload, loadReelComments };
})();