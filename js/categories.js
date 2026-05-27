// ========================================
// Categories Module - Full Category System
// ========================================

const Categories = (() => {
    // All categories with metadata
    const ALL_CATEGORIES = [
        // Original (top 7)
        { id: 'failure', emoji: '💥', label: 'Failure', color: '#ef4444', popular: true },
        { id: 'regret', emoji: '😔', label: 'Regret', color: '#f97316', popular: true },
        { id: 'lesson', emoji: '📖', label: 'Lesson', color: '#22c55e', popular: true },
        { id: 'money', emoji: '💸', label: 'Lost Money', color: '#eab308', popular: true },
        { id: 'decision', emoji: '🤦', label: 'Bad Decision', color: '#3b82f6', popular: true },
        { id: 'career', emoji: '🏢', label: 'Career', color: '#06b6d4', popular: true },
        { id: 'relationship', emoji: '💔', label: 'Relationship', color: '#ec4899', popular: true },
        
        // New extended categories
        { id: 'betrayal', emoji: '🗡️', label: 'Betrayal', color: '#dc2626' },
        { id: 'missed_opportunity', emoji: '📉', label: 'Missed Opportunity', color: '#f59e0b' },
        { id: 'scam', emoji: '💸', label: 'Scam / Fraud', color: '#b91c1c' },
        { id: 'mental_health', emoji: '🧠', label: 'Mental Health', color: '#a855f7' },
        { id: 'warning_ignored', emoji: '⚠️', label: 'Warning Sign Ignored', color: '#f97316' },
        { id: 'education', emoji: '🎓', label: 'Education Mistake', color: '#3b82f6' },
        { id: 'toxic_workplace', emoji: '🏢', label: 'Toxic Workplace', color: '#7c2d12' },
        { id: 'friendship', emoji: '🤝', label: 'Friendship', color: '#fbbf24' },
        { id: 'family', emoji: '👨‍👩‍👧', label: 'Family', color: '#f472b6' },
        { id: 'dating', emoji: '❤️', label: 'Dating Disaster', color: '#e11d48' },
        { id: 'social_media', emoji: '📱', label: 'Social Media Mistake', color: '#0ea5e9' },
        { id: 'time_wasted', emoji: '⏳', label: 'Time Wasted', color: '#94a3b8' },
        { id: 'startup', emoji: '🚀', label: 'Startup Failure', color: '#8b5cf6' },
        { id: 'investing', emoji: '📈', label: 'Investing Mistake', color: '#10b981' },
        { id: 'business', emoji: '🧾', label: 'Business Lesson', color: '#0891b2' },
        { id: 'communication', emoji: '🗣️', label: 'Communication Failure', color: '#6366f1' },
        { id: 'burnout', emoji: '🔥', label: 'Burnout', color: '#ea580c' },
        { id: 'unrealistic_expectations', emoji: '🎯', label: 'Unrealistic Expectations', color: '#dc2626' },
        { id: 'self_sabotage', emoji: '🧍', label: 'Self-Sabotage', color: '#7c3aed' },
        { id: 'travel', emoji: '🌍', label: 'Travel Mistake', color: '#0d9488' },
        { id: 'fitness', emoji: '🏋️', label: 'Fitness / Health', color: '#16a34a' },
        { id: 'tech', emoji: '💻', label: 'Tech / Coding Mistake', color: '#2563eb' },
        { id: 'addiction', emoji: '🎮', label: 'Addiction', color: '#991b1b' },
        { id: 'trust_issues', emoji: '😶', label: 'Trust Issues', color: '#475569' },
        { id: 'turning_point', emoji: '🧭', label: 'Turning Point', color: '#0e7490' },
        { id: 'personal_growth', emoji: '🌱', label: 'Personal Growth', color: '#15803d' },
        { id: 'red_flag', emoji: '🛑', label: 'Biggest Red Flag', color: '#b91c1c' },
        { id: 'embarrassing', emoji: '🎭', label: 'Embarrassing Moment', color: '#c026d3' },
        { id: 'experiment', emoji: '🧪', label: 'Experiment Gone Wrong', color: '#7e22ce' },
        { id: 'success_after_failure', emoji: '🏆', label: 'Success After Failure', color: '#facc15' },
    ];

    const INITIAL_SHOW_COUNT = 8; // Show top 8 initially
    let showAll = false;
    let currentSearchQuery = '';

    function init() {
        renderSidebarCategories();
        renderQuickCategories();
        initCategoryPicker();
        initSearchAndShowMore();
    }

    // ===== SIDEBAR FILTER CATEGORIES =====
    function renderSidebarCategories() {
        const container = document.getElementById('categoryFilters');
        if (!container) return;

        // Filter by search query
        let categories = [...ALL_CATEGORIES]; // Create a copy to avoid mutation
        if (currentSearchQuery) {
            categories = categories.filter(cat => 
                cat.label.toLowerCase().includes(currentSearchQuery) ||
                cat.id.toLowerCase().includes(currentSearchQuery)
            );
        }

        // Apply show more/less
        const visibleCategories = showAll ? categories : categories.slice(0, INITIAL_SHOW_COUNT);

        // Always include "All" at the top
        let html = `
            <button class="filter-btn active" data-category="all">
                <span class="filter-icon">🌍</span> All Confessions
            </button>
        `;

        visibleCategories.forEach(cat => {
            html += `
                <button class="filter-btn" data-category="${escapeHtml(cat.id)}">
                    <span class="filter-icon">${cat.emoji}</span> ${escapeHtml(cat.label)}
                </button>
            `;
        });

        if (visibleCategories.length === 0 && currentSearchQuery) {
            html += `<div class="no-categories">No categories match "${escapeHtml(currentSearchQuery)}"</div>`;
        }

        container.innerHTML = html;

        // Show/hide "Show More" button
        const showMoreBtn = document.getElementById('showMoreCategories');
        if (showMoreBtn) {
            if (currentSearchQuery || categories.length <= INITIAL_SHOW_COUNT) {
                showMoreBtn.style.display = 'none';
            } else {
                showMoreBtn.style.display = 'flex';
                const text = showMoreBtn.querySelector('.show-more-text');
                const icon = showMoreBtn.querySelector('i');
                if (text) {
                    text.textContent = showAll ? 'Show Less' : `Show More (${categories.length - INITIAL_SHOW_COUNT})`;
                }
                if (icon) {
                    icon.className = showAll ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
                }
            }
        }

        // Attach filter click events
        container.querySelectorAll('.filter-btn').forEach(btn => {
            // Remove existing listeners to avoid duplicates
            btn.removeEventListener('click', handleFilterClick);
            btn.addEventListener('click', handleFilterClick);
        });
    }

    // Separate handler function for filter clicks
    function handleFilterClick(e) {
        const btn = e.currentTarget;
        const container = btn.parentElement;
        
        container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const category = btn.dataset.category;
        if (typeof Posts !== 'undefined' && Posts.filterByCategory) {
            Posts.filterByCategory(category);
        }
    }

    // ===== QUICK CATEGORY BUTTONS (under create post trigger) =====
    function renderQuickCategories() {
        const container = document.getElementById('quickCategories');
        if (!container) return;

        // Show only 6 popular ones for quick access
        const popular = ALL_CATEGORIES.filter(c => c.popular).slice(0, 6);
        container.innerHTML = popular.map(cat => `
            <button class="cat-btn" data-cat="${escapeHtml(cat.id)}">
                <span>${cat.emoji}</span> ${escapeHtml(cat.label)}
            </button>
        `).join('');

        // Re-attach click events
        container.querySelectorAll('.cat-btn').forEach(btn => {
            btn.removeEventListener('click', handleQuickCategoryClick);
            btn.addEventListener('click', handleQuickCategoryClick);
        });
    }

    function handleQuickCategoryClick(e) {
        const btn = e.currentTarget;
        const createCard = document.getElementById('createPostCard');
        const expanded = document.getElementById('createPostExpanded');
        
        if (createCard) createCard.style.display = 'none';
        if (expanded) expanded.style.display = 'block';
        
        const categoryId = btn.dataset.cat;
        selectCategoryForPost(categoryId);
        
        const postTitle = document.getElementById('postTitle');
        if (postTitle) postTitle.focus();
    }

    // ===== CATEGORY PICKER (in create post form) =====
    function initCategoryPicker() {
        const btn = document.getElementById('categoryPickerBtn');
        const dropdown = document.getElementById('categoryPickerDropdown');
        const searchInput = document.getElementById('categoryPickerSearch');
        
        if (!btn || !dropdown) return;

        // Remove existing listeners to avoid duplicates
        btn.removeEventListener('click', handlePickerButtonClick);
        btn.addEventListener('click', handlePickerButtonClick);

        if (searchInput) {
            searchInput.removeEventListener('input', handlePickerSearch);
            searchInput.addEventListener('input', handlePickerSearch);
        }

        // Close dropdown when clicking outside
        document.removeEventListener('click', handleOutsideClick);
        document.addEventListener('click', handleOutsideClick);
    }

    function handlePickerButtonClick(e) {
        e.preventDefault();
        e.stopPropagation();
        const dropdown = document.getElementById('categoryPickerDropdown');
        if (!dropdown) return;
        
        const isOpen = dropdown.style.display === 'block';
        dropdown.style.display = isOpen ? 'none' : 'block';
        
        if (!isOpen) {
            renderCategoryPickerList('');
            const searchInput = document.getElementById('categoryPickerSearch');
            setTimeout(() => searchInput?.focus(), 100);
        }
    }

    function handlePickerSearch(e) {
        renderCategoryPickerList(e.target.value.toLowerCase().trim());
    }

    function handleOutsideClick(e) {
        const dropdown = document.getElementById('categoryPickerDropdown');
        const wrapper = e.target.closest('.category-picker-wrapper');
        if (!wrapper && dropdown) {
            dropdown.style.display = 'none';
        }
    }

    function renderCategoryPickerList(searchQuery = '') {
        const list = document.getElementById('categoryPickerList');
        if (!list) return;

        const filtered = ALL_CATEGORIES.filter(cat =>
            cat.label.toLowerCase().includes(searchQuery) ||
            cat.id.toLowerCase().includes(searchQuery)
        );

        if (filtered.length === 0) {
            list.innerHTML = `<div class="picker-no-results">No category matches "${escapeHtml(searchQuery)}"</div>`;
            return;
        }

        // Group: Popular first, then alphabetical
        const popular = filtered.filter(c => c.popular);
        const others = filtered.filter(c => !c.popular).sort((a, b) => a.label.localeCompare(b.label));

        let html = '';
        if (popular.length > 0 && !searchQuery) {
            html += '<div class="picker-group-title">⭐ Popular</div>';
            popular.forEach(cat => {
                html += renderPickerItem(cat);
            });
        }
        if (others.length > 0) {
            if (!searchQuery && popular.length > 0) {
                html += '<div class="picker-group-title">📚 All Categories</div>';
            } else if (!searchQuery) {
                html += '<div class="picker-group-title">📚 All Categories</div>';
            }
            others.forEach(cat => {
                html += renderPickerItem(cat);
            });
        }
        
        // For search results, show popular at the top
        if (searchQuery && popular.length > 0) {
            const popularHtml = popular.map(cat => renderPickerItem(cat)).join('');
            html = popularHtml + html.replace(/<div class="picker-group-title">.*?<\/div>/, '');
        }

        list.innerHTML = html;

        // Attach click events
        list.querySelectorAll('.picker-item').forEach(item => {
            item.removeEventListener('click', handlePickerItemClick);
            item.addEventListener('click', handlePickerItemClick);
        });
    }

    function handlePickerItemClick(e) {
        const item = e.currentTarget;
        const categoryId = item.dataset.cat;
        selectCategoryForPost(categoryId);
        
        const dropdown = document.getElementById('categoryPickerDropdown');
        const searchInput = document.getElementById('categoryPickerSearch');
        
        if (dropdown) dropdown.style.display = 'none';
        if (searchInput) searchInput.value = '';
    }

    function renderPickerItem(cat) {
        return `
            <button type="button" class="picker-item" data-cat="${escapeHtml(cat.id)}">
                <span class="picker-emoji">${cat.emoji}</span>
                <span class="picker-label">${escapeHtml(cat.label)}</span>
            </button>
        `;
    }

    function selectCategoryForPost(categoryId) {
        const category = ALL_CATEGORIES.find(c => c.id === categoryId);
        if (!category) return;

        const hiddenInput = document.getElementById('postCategory');
        const displaySpan = document.getElementById('selectedCategoryDisplay');
        
        if (hiddenInput) hiddenInput.value = categoryId;
        if (displaySpan) {
            displaySpan.innerHTML = `${category.emoji} ${escapeHtml(category.label)}`;
            displaySpan.style.color = 'var(--text-primary)';
        }
    }

    // ===== SEARCH AND SHOW MORE =====
    function initSearchAndShowMore() {
        const searchInput = document.getElementById('categorySearch');
        const showMoreBtn = document.getElementById('showMoreCategories');

        if (searchInput) {
            searchInput.removeEventListener('input', handleCategorySearch);
            searchInput.addEventListener('input', handleCategorySearch);
        }

        if (showMoreBtn) {
            showMoreBtn.removeEventListener('click', handleShowMoreClick);
            showMoreBtn.addEventListener('click', handleShowMoreClick);
        }
    }

    function handleCategorySearch(e) {
        currentSearchQuery = e.target.value.toLowerCase().trim();
        showAll = currentSearchQuery.length > 0; // Auto-show all when searching
        renderSidebarCategories();
    }

    function handleShowMoreClick() {
        showAll = !showAll;
        renderSidebarCategories();
    }

    // ===== HELPERS =====
    function getCategoryById(id) {
        return ALL_CATEGORIES.find(c => c.id === id);
    }

    function getCategoryEmoji(id) {
        const category = getCategoryById(id);
        return category ? category.emoji : '📌';
    }

    function getCategoryLabel(id) {
        const category = getCategoryById(id);
        return category ? category.label : id;
    }

    function getCategoryColor(id) {
        const category = getCategoryById(id);
        return category ? category.color : '#8b5cf6';
    }

    function getAllCategories() {
        return [...ALL_CATEGORIES]; // Return a copy to prevent mutation
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    return {
        init,
        getCategoryById,
        getCategoryEmoji,
        getCategoryLabel,
        getCategoryColor,
        getAllCategories,
        selectCategoryForPost
    };
})();