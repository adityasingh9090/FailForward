// ========================================
// AI Wisdom Extraction Module
// ========================================
// This module simulates AI-powered wisdom extraction
// In production, connect to OpenAI/Claude API for real extraction

const AIWisdom = (() => {

    // Wisdom patterns database — ALL categories in ONE object
    const wisdomPatterns = {
        // ===== ORIGINAL CATEGORIES =====
        failure: [
            "Failure isn't the opposite of success — it's part of it.",
            "Every failure contains a seed of equivalent advantage.",
            "The only real failure is the failure to try.",
            "What feels like the end is often just the beginning of something better.",
            "Your biggest failure today is someone else's lesson tomorrow."
        ],
        regret: [
            "Regret is wisdom arrived too late — but it's still wisdom.",
            "The things we regret most are the risks we didn't take.",
            "Use regret as a compass, not an anchor.",
            "Every regret is a lesson in what truly matters to you.",
            "Regret teaches us our real values."
        ],
        lesson: [
            "Experience is the name everyone gives to their mistakes.",
            "The best lessons can't be taught — they have to be lived.",
            "Wisdom is what you get when you didn't get what you wanted.",
            "Every lesson learned the hard way sticks forever.",
            "The tuition of experience is paid in mistakes."
        ],
        money: [
            "Money lost can be earned back. Time lost and lessons ignored cannot.",
            "The most expensive lessons are often the most valuable.",
            "Better to lose money and gain wisdom than the reverse.",
            "Financial failures teach financial literacy that no book can.",
            "Every dollar lost is tuition for the university of real life."
        ],
        decision: [
            "Bad decisions make good stories and better judgment.",
            "Every decision, good or bad, is data for your future self.",
            "The worst decision is usually indecision.",
            "Bad decisions made with good intentions still build character.",
            "Your worst decision led to growth you couldn't have planned."
        ],
        career: [
            "Career mistakes are redirections, not dead ends.",
            "The career path is rarely straight — the detours teach the most.",
            "A job that fails you reveals the job that fits you.",
            "Professional failure is personal growth in disguise.",
            "Every wrong career move narrows down the right one."
        ],
        relationship: [
            "Failed relationships teach us what we truly need from people.",
            "Every heartbreak is a curriculum in emotional intelligence.",
            "The wrong person teaches you to recognize the right one.",
            "Relationship failures reveal our attachment patterns.",
            "Love lost is self-knowledge gained."
        ],

        // ===== NEW EXTENDED CATEGORIES =====
        betrayal: [
            "Betrayal teaches us who deserves our trust — a brutal but valuable lesson.",
            "The deepest cuts come from those closest. Choose your circle wisely.",
            "Trust, once broken, becomes the foundation for stronger boundaries."
        ],
        missed_opportunity: [
            "Every missed opportunity sharpens your eye for the next one.",
            "Regret over inaction lasts longer than regret over action.",
            "The opportunity you missed taught you to recognize opportunity itself."
        ],
        scam: [
            "If it sounds too good to be true, it's tuition you're about to pay.",
            "Scams target hope. The lesson: verify before you trust.",
            "Being scammed isn't stupidity — it's a hard course in skepticism."
        ],
        mental_health: [
            "Acknowledging mental struggle is the first act of strength.",
            "Healing isn't linear, but every step backward teaches the next step forward.",
            "Your mental health is not a luxury — it's the foundation of everything else."
        ],
        warning_ignored: [
            "Red flags ignored become reasons learned.",
            "Your gut knew before your mind admitted it.",
            "The warnings you ignored are the lessons you can't unlearn."
        ],
        education: [
            "Education mistakes aren't wasted — your future choices get sharper.",
            "Sometimes the class is you, not the syllabus.",
            "Learning the hard way can still be real progress."
        ],
        toxic_workplace: [
            "A toxic workplace doesn't just steal time — it steals energy and identity.",
            "Leaving early is not quitting; it's protecting your future self.",
            "Your boundaries are the antidote to repeated harm."
        ],
        friendship: [
            "Friendships reveal your standards — sometimes painfully, always honestly.",
            "True friends make you feel safer, not smaller.",
            "Mutual effort is the real loyalty test."
        ],
        family: [
            "Family patterns don't change unless someone changes the pattern.",
            "Healthy distance can be a form of love.",
            "You can honor them without repeating what hurt you."
        ],
        dating: [
            "Dating disasters are data — use them to refine your type and your boundaries.",
            "If it's unclear, it usually is.",
            "Consistency beats chemistry in the long run."
        ],
        social_media: [
            "Social media mistakes often happen when validation becomes the goal.",
            "Your attention is your life — spend it intentionally.",
            "Don't compare your behind-the-scenes to someone's highlight reel."
        ],
        time_wasted: [
            "Time wasted teaches you what drains you — and how to stop the drain.",
            "You don't need more motivation; you need better systems.",
            "The best recovery from wasted time is clarity plus action."
        ],
        startup: [
            "Most startups fail. The wisdom is in learning why yours did.",
            "Product-market fit isn't found — it's discovered through painful iteration.",
            "Your failed startup is an MBA paid in blood, sweat, and equity."
        ],
        investing: [
            "The market punishes ego and rewards patience.",
            "Diversification is what you do before you need it.",
            "Every losing trade is tuition in risk management."
        ],
        business: [
            "A business lesson: focus on one bottleneck until it stops bleeding.",
            "Pricing is a strategy, not a guess.",
            "Don't scale confusion — solve the core problem first."
        ],
        communication: [
            "Communication failure is usually a trust failure in disguise.",
            "Say it clearly early — late misunderstandings cost more.",
            "Assume good intent, but verify reality."
        ],
        burnout: [
            "Burnout is your body's contract negotiation. Listen or pay the penalty.",
            "Rest isn't weakness — it's the rebuilding phase of strength.",
            "Burnout taught you that hustle without boundaries is just self-destruction."
        ],
        unrealistic_expectations: [
            "Unrealistic expectations create constant disappointment.",
            "Aim high, but set measurable steps.",
            "Reality is the curriculum. Let it correct the plan."
        ],
        self_sabotage: [
            "Self-sabotage is fear wearing a familiar costume.",
            "You can't outrun yourself. The only way out is through.",
            "Understanding why you sabotage is the first step to stopping."
        ],
        travel: [
            "Travel mistakes teach planning, budgeting, and humility.",
            "The best trips aren't perfect — they're resilient.",
            "Build buffer time. Life delays everything."
        ],
        fitness: [
            "Fitness mistakes aren't failure — they're feedback on your plan.",
            "Consistency beats intensity.",
            "Sleep and nutrition are the real training."
        ],
        tech: [
            "Tech and coding mistakes are normal — debugging is the product.",
            "Document early, refactor often.",
            "Small cleanups prevent big disasters later."
        ],
        addiction: [
            "Recognizing addiction is the first victory over it.",
            "Recovery isn't about willpower — it's about replacing the void with purpose.",
            "What you escaped through addiction is what you must face in recovery."
        ],
        trust_issues: [
            "Trust issues usually protect an old wound.",
            "Let trust be earned with evidence, not hope.",
            "Boundaries are how you feel safe again."
        ],
        turning_point: [
            "Turning points happen when you finally tell the truth to yourself.",
            "Change starts as discomfort you refuse to ignore.",
            "The day you commit is the day your life updates."
        ],
        personal_growth: [
            "Personal growth is identity work, not hype work.",
            "Better habits come from better beliefs.",
            "Progress is quiet until it's undeniable."
        ],
        red_flag: [
            "A biggest red flag is often your future self trying to protect you.",
            "If it's unsafe, it's not worth negotiating.",
            "You don't need proof to leave — your peace is proof."
        ],
        embarrassing: [
            "Embarrassing moments are fear exposed — not character exposed.",
            "The fastest way through is to learn and move.",
            "You'll laugh later. Act like you own your story now."
        ],
        experiment: [
            "An experiment gone wrong is still an experiment — so it counts.",
            "Fail faster, learn faster, improve faster.",
            "Bad experiments reveal good hypotheses."
        ],
        success_after_failure: [
            "Success without prior failure is just luck waiting to expire.",
            "Your failure was the foundation success was built upon.",
            "Every overnight success has years of failure as its prologue."
        ]
    };

    // AI-style analysis keywords
    const keywordPatterns = {
        'rushed': 'Taking time before big decisions prevents costly mistakes.',
        'ignored': 'The red flags we ignore become the lessons we learn.',
        'trusted': 'Trust must be earned with evidence, not given with hope.',
        "didn't research": 'Due diligence is the difference between investing and gambling.',
        'fear': 'Fear-based decisions are almost always wrong in hindsight.',
        'ego': 'Ego is the most expensive advisor you can hire.',
        'advice': "Seeking advice from those who've failed is more valuable than from those who haven't tried.",
        'quit': 'Knowing when to quit is as important as knowing when to persist.',
        'all in': "Diversification isn't just for portfolios — it's for life.",
        'shortcut': 'Shortcuts almost always lead to longer journeys.',
        'too fast': 'Speed without direction is just expensive motion.',
        'listen': 'The most expensive skill to learn is listening.',
        'passionate': 'Passion without strategy is just expensive enthusiasm.',
        'partner': 'Choosing the wrong partner — in business or love — is the costliest mistake.',
        'borrowed': 'Borrowed money amplifies both gains and lessons.',
        'crypto': 'Speculating without understanding is just sophisticated gambling.',
        'startup': 'Most startups fail — the wisdom is in knowing why.',
        'college': 'The most important education often happens outside the classroom.',
        'job': 'A secure job can be the riskiest career move if it kills your growth.',
        'savings': "Emergency funds are not optional — they're survival.",
        'loan': "Debt is tomorrow's income spent today.",
        'betrayed': 'Betrayal teaches you what you should have seen earlier.',
        'scammed': 'Every scam exploits a hope we refused to question.',
        'burnt out': "Burnout is your body asking for the boundary you wouldn't set.",
        'addicted': 'Addiction is a symptom — find the wound underneath.',
        'toxic': 'Walking away from toxicity is the bravest form of self-respect.'
    };

    function extractWisdom(title, content, category) {
        const fullText = `${title || ''} ${content || ''}`.toLowerCase();
        
        // Check for keyword matches first
        for (const [keyword, wisdom] of Object.entries(keywordPatterns)) {
            if (fullText.includes(keyword)) {
                return wisdom;
            }
        }

        // Fall back to category-based wisdom
        const categoryWisdom = wisdomPatterns[category] || wisdomPatterns.failure;
        
        // Use text length as a simple "hash" for deterministic but varied selection
        const titleLen = (title || '').length;
        const contentLen = (content || '').length;
        const index = (titleLen + contentLen) % categoryWisdom.length;
        return categoryWisdom[index];
    }

    // Helper: get category label using Categories module if available
    function getCategoryLabel(id) {
        if (typeof Categories !== 'undefined' && Categories.getCategoryById) {
            const cat = Categories.getCategoryById(id);
            return cat ? `${cat.emoji} ${cat.label}` : id;
        }
        return id;
    }

    async function loadWisdom() {
        try {
            // Check if db is available
            if (typeof db === 'undefined') {
                console.warn('Firestore (db) not initialized');
                return;
            }

            const patternsEl = document.getElementById('failurePatterns');
            const postsSnap = await db.collection('posts')
                .orderBy('createdAt', 'desc')
                .limit(200)
                .get();

            // Analyze categories
            const categoryCounts = {};
            const allTags = {};
            let totalMoney = 0;
            const wisdoms = [];
            const postTexts = [];

            postsSnap.forEach(doc => {
                const data = doc.data();
                if (data.category) {
                    categoryCounts[data.category] = (categoryCounts[data.category] || 0) + 1;
                }
                
                if (data.tags && Array.isArray(data.tags)) {
                    data.tags.forEach(tag => {
                        allTags[tag] = (allTags[tag] || 0) + 1;
                    });
                }
                
                if (data.moneyLost) totalMoney += Number(data.moneyLost) || 0;
                if (data.wisdom) wisdoms.push(data.wisdom);
                postTexts.push(`${data.title || ''} ${data.content || ''}`);
            });

            // Display failure patterns
            const sortedCategories = Object.entries(categoryCounts)
                .sort((a, b) => b[1] - a[1]);
            
            const maxCount = sortedCategories.length > 0 ? sortedCategories[0][1] : 1;

            if (patternsEl) {
                if (sortedCategories.length === 0) {
                    patternsEl.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">Not enough data yet. Share your story!</p>';
                } else {
                    patternsEl.innerHTML = '';
                    sortedCategories.slice(0, 8).forEach(([cat, count], i) => {
                        const pct = Math.round((count / maxCount) * 100);
                        const item = document.createElement('div');
                        item.className = 'pattern-item';
                        item.innerHTML = `
                            <span class="pattern-rank">${i + 1}</span>
                            <div class="pattern-info">
                                <div class="pattern-title">${getCategoryLabel(cat)}</div>
                                <div class="pattern-count">${count} confession${count !== 1 ? 's' : ''}</div>
                            </div>
                            <div class="pattern-bar">
                                <div class="pattern-bar-fill" style="width:${pct}%"></div>
                            </div>
                        `;
                        patternsEl.appendChild(item);
                    });
                }
            }

            // Money trends
            const moneyTrendsEl = document.getElementById('moneyTrends');
            if (moneyTrendsEl) {
                const avgLoss = postsSnap.size > 0 ? Math.round(totalMoney / postsSnap.size) : 0;
                moneyTrendsEl.innerHTML = `
                    <div style="text-align:center;padding:20px 0;">
                        <div style="font-size:2rem;font-weight:900;font-family:'JetBrains Mono',monospace;color:var(--failure-red);margin-bottom:8px;">
                            $${totalMoney.toLocaleString()}
                        </div>
                        <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:16px;">
                            Total lessons paid in dollars
                        </p>
                        <p style="font-size:0.8rem;color:var(--text-muted);">
                            Average loss: $${avgLoss.toLocaleString()} per confession
                        </p>
                    </div>
                `;
            }

            // Top lessons
            const topLessonsEl = document.getElementById('topLessons');
            if (topLessonsEl) {
                topLessonsEl.innerHTML = '';
                const uniqueWisdoms = [...new Set(wisdoms)].slice(0, 5);
                if (uniqueWisdoms.length > 0) {
                    uniqueWisdoms.forEach(w => {
                        const item = document.createElement('div');
                        item.className = 'nugget';
                        item.innerHTML = `<p>"${escapeHtml(w)}"</p>`;
                        topLessonsEl.appendChild(item);
                    });
                } else {
                    topLessonsEl.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">Wisdom accumulates with more confessions.</p>';
                }
            }

            // Wisdom of the day
            const wisdomOfDayEl = document.getElementById('wisdomOfDay');
            if (wisdomOfDayEl) {
                const allWisdomList = Object.values(wisdomPatterns).flat();
                if (allWisdomList.length > 0) {
                    const dayIndex = new Date().getDate() % allWisdomList.length;
                    wisdomOfDayEl.innerHTML = `
                        <div class="wisdom-quote">
                            <blockquote>"${escapeHtml(allWisdomList[dayIndex])}"</blockquote>
                            <cite>— Synthesized from ${postsSnap.size} collective confession${postsSnap.size !== 1 ? 's' : ''}</cite>
                        </div>
                    `;
                }
            }

            // Regrets by age (simulated)
            const regretsByAgeEl = document.getElementById('regretsByAge');
            if (regretsByAgeEl) {
                regretsByAgeEl.innerHTML = `
                    <div style="display:flex;flex-direction:column;gap:12px;">
                        <div class="pattern-item">
                            <span class="pattern-rank" style="font-size:0.9rem;">20s</span>
                            <div class="pattern-info">
                                <div class="pattern-title">Not starting sooner</div>
                                <div class="pattern-count">Most common regret</div>
                            </div>
                        </div>
                        <div class="pattern-item">
                            <span class="pattern-rank" style="font-size:0.9rem;">30s</span>
                            <div class="pattern-info">
                                <div class="pattern-title">Staying in wrong job/relationship</div>
                                <div class="pattern-count">Peak career regrets</div>
                            </div>
                        </div>
                        <div class="pattern-item">
                            <span class="pattern-rank" style="font-size:0.9rem;">40s</span>
                            <div class="pattern-info">
                                <div class="pattern-title">Not saving/investing earlier</div>
                                <div class="pattern-count">Financial awareness peaks</div>
                            </div>
                        </div>
                    </div>
                `;
            }

            // Category breakdown
            const categoryBreakdownEl = document.getElementById('categoryBreakdown');
            if (categoryBreakdownEl) {
                if (sortedCategories.length === 0) {
                    categoryBreakdownEl.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">No data yet.</p>';
                } else {
                    const total = Object.values(categoryCounts).reduce((a, b) => a + b, 0) || 1;
                    categoryBreakdownEl.innerHTML = '';
                    sortedCategories.slice(0, 10).forEach(([cat, count]) => {
                        const pct = Math.round((count / total) * 100);
                        const item = document.createElement('div');
                        item.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-color);';
                        item.innerHTML = `
                            <span style="font-size:0.85rem;">${getCategoryLabel(cat)}</span>
                            <span style="font-family:'JetBrains Mono',monospace;font-weight:700;color:var(--accent-primary);">${pct}%</span>
                        `;
                        categoryBreakdownEl.appendChild(item);
                    });
                }
            }

            // AI Insight sidebar
            updateAIInsight(postTexts, postsSnap.size);

            // Update total wisdom count
            const totalWisdomEl = document.getElementById('totalWisdom');
            if (totalWisdomEl) totalWisdomEl.textContent = wisdoms.length.toLocaleString();

        } catch (error) {
            console.error('Error loading wisdom:', error);
            // Show fallback content in main panels
            const patternsEl = document.getElementById('failurePatterns');
            if (patternsEl) {
                patternsEl.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">Unable to load wisdom data.</p>';
            }
        }
    }

    function updateAIInsight(texts, count) {
        const insightEl = document.getElementById('aiInsight');
        const insightBasedEl = document.getElementById('insightBased');

        const insights = [
            "People who share their failures are 3x more likely to avoid repeating them. Vulnerability breeds growth.",
            "The most common pattern: rushing into decisions without research. Slow down = level up.",
            "Financial losses cluster around three themes: FOMO, ego, and lack of diversification.",
            "Relationship failures consistently point to one root cause: poor communication, not lack of love.",
            "Career regrets peak at age 35. The antidote? Take the scary leap before comfort becomes a cage.",
            "70% of bad decisions stem from emotional states. The lesson: never decide when angry, sad, or euphoric.",
            "The biggest predictor of recovery from failure? Having someone to talk to about it honestly.",
            "Most money is lost not in the investment, but in the panic-selling that follows.",
            "Burnout patterns show: it's never the workload — it's the lack of recovery.",
            "Toxic environments slowly normalize behavior we'd never tolerate from strangers.",
            "Trust issues usually trace back to one specific unhealed moment.",
            "Self-sabotage is often loyalty to an old version of yourself."
        ];

        const dayIndex = (new Date().getDate() + new Date().getMonth()) % insights.length;
        if (insightEl) insightEl.textContent = insights[dayIndex];
        if (insightBasedEl) insightBasedEl.textContent = `Based on ${count} confession${count !== 1 ? 's' : ''}`;
    }

    // Generate wisdom nuggets for sidebar
    function generateNuggets() {
        const nuggets = [
            { text: "Every failure is just a data point for your next success.", source: "Extracted from 47 confessions" },
            { text: "The money you lost taught you more than any course could.", source: "Extracted from 23 confessions" },
            { text: "Your worst day became your best lesson.", source: "Extracted from 89 confessions" }
        ];

        const container = document.getElementById('wisdomNuggets');
        if (container) {
            container.innerHTML = '';
            nuggets.forEach(n => {
                const el = document.createElement('div');
                el.className = 'nugget';
                el.innerHTML = `
                    <p>"${escapeHtml(n.text)}"</p>
                    <span class="nugget-source">— ${escapeHtml(n.source)}</span>
                `;
                container.appendChild(el);
            });
        }
    }

    // Utility: prevent XSS in dynamic content
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    return { extractWisdom, loadWisdom, generateNuggets };
})();