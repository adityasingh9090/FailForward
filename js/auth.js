// ========================================
// Authentication Module
// ========================================

const Auth = (() => {
    let currentUser = null;

    // DOM Elements
    const authModal = document.getElementById('authModal');
    const authBtn = document.getElementById('authBtn');
    const heroAuthBtn = document.getElementById('heroAuthBtn');
    const closeAuthModal = document.getElementById('closeAuthModal');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const authTabs = document.querySelectorAll('.auth-tab');
    const authError = document.getElementById('authError');
    const logoutBtn = document.getElementById('logoutBtn');
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    const googleSignupBtn = document.getElementById('googleSignupBtn');
    const userMenu = document.getElementById('userMenu');
    const userAvatar = document.getElementById('userAvatar');
    const userDropdown = document.getElementById('userDropdown');

    function init() {
        // Check if Firebase auth is available
        if (typeof auth === 'undefined') {
            console.error('Firebase auth is not initialized');
            return;
        }

        // Auth state listener
        auth.onAuthStateChanged(handleAuthStateChange);

        // Event listeners
        if (authBtn) authBtn.addEventListener('click', () => showModal());
        if (heroAuthBtn) heroAuthBtn.addEventListener('click', () => showModal());
        if (closeAuthModal) closeAuthModal.addEventListener('click', hideModal);
        
        if (authModal) {
            authModal.addEventListener('click', (e) => {
                if (e.target === authModal) hideModal();
            });
        }

        // Auth tabs
        authTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                authTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const isLogin = tab.dataset.tab === 'login';
                if (loginForm) loginForm.style.display = isLogin ? 'flex' : 'none';
                if (signupForm) signupForm.style.display = isLogin ? 'none' : 'flex';
                hideError();
            });
        });

        // Login form - REMOVED DUPLICATE
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('loginEmail').value.trim();
                const password = document.getElementById('loginPassword').value;
                
                // Disable button while loading
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
                hideError();
                
                try {
                    await auth.signInWithEmailAndPassword(email, password);
                    hideModal();
                    if (App && App.showToast) {
                        App.showToast('Welcome back, truth-teller! 🔥', 'success');
                    }
                } catch (error) {
                    console.error('🔴 LOGIN ERROR:', error.code, error.message, error);
                    showError(getErrorMessage(error.code));
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            });
        }

        // Signup form - REMOVED DUPLICATE
        if (signupForm) {
            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('signupName').value.trim();
                const email = document.getElementById('signupEmail').value.trim();
                const password = document.getElementById('signupPassword').value;
                
                const submitBtn = signupForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
                hideError();
                
                try {
                    const cred = await auth.createUserWithEmailAndPassword(email, password);
                    await cred.user.updateProfile({ displayName: name });
                    
                    if (db && db.collection) {
                        await db.collection('users').doc(cred.user.uid).set({
                            displayName: name,
                            email: email,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            postCount: 0,
                            resonateCount: 0,
                            wisdomCount: 0
                        });
                        
                        await db.collection('stats').doc('global').set({
                            totalUsers: firebase.firestore.FieldValue.increment(1)
                        }, { merge: true });
                    }
                    
                    hideModal();
                    if (App && App.showToast) {
                        App.showToast('Welcome to FailForward! Time to get real. 💪', 'success');
                    }
                } catch (error) {
                    console.error('🔴 SIGNUP ERROR:', error.code, error.message, error);
                    showError(getErrorMessage(error.code));
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            });
        }

        // Google auth
        const googleAuth = async () => {
            try {
                const provider = new firebase.auth.GoogleAuthProvider();
                const result = await auth.signInWithPopup(provider);
                if (result.additionalUserInfo.isNewUser) {
                    if (db && db.collection) {
                        await db.collection('users').doc(result.user.uid).set({
                            displayName: result.user.displayName,
                            email: result.user.email,
                            photoURL: result.user.photoURL,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            postCount: 0,
                            resonateCount: 0,
                            wisdomCount: 0
                        });
                        await db.collection('stats').doc('global').set({
                            totalUsers: firebase.firestore.FieldValue.increment(1)
                        }, { merge: true });
                    }
                }
                hideModal();
                if (App && App.showToast) {
                    App.showToast('Welcome, truth-teller! 🔥', 'success');
                }
            } catch (error) {
                showError(getErrorMessage(error.code));
            }
        };

        if (googleLoginBtn) googleLoginBtn.addEventListener('click', googleAuth);
        if (googleSignupBtn) googleSignupBtn.addEventListener('click', googleAuth);

        // Logout
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await auth.signOut();
                if (App && App.showToast) {
                    App.showToast('Logged out. Come back when you have more failures! 👋', 'info');
                }
            });
        }

        // User avatar dropdown
        if (userAvatar && userMenu) {
            userAvatar.addEventListener('click', () => {
                userDropdown.style.display = userDropdown.style.display === 'none' ? 'block' : 'none';
            });

            document.addEventListener('click', (e) => {
                if (!userMenu.contains(e.target)) {
                    if (userDropdown) userDropdown.style.display = 'none';
                }
            });
        }
    }

    function handleAuthStateChange(user) {
        currentUser = user;
        if (user) {
            // User signed in
            const initial = (user.displayName || user.email || '?')[0].toUpperCase();
            
            const userInitial = document.getElementById('userInitial');
            const profileInitial = document.getElementById('profileInitial');
            const createInitial = document.getElementById('createInitial');
            const profileName = document.getElementById('profileName');
            const dropdownName = document.getElementById('dropdownName');
            const dropdownEmail = document.getElementById('dropdownEmail');
            
            if (userInitial) userInitial.textContent = initial;
            if (profileInitial) profileInitial.textContent = initial;
            if (createInitial) createInitial.textContent = initial;
            if (profileName) profileName.textContent = user.displayName || 'Truth-Teller';
            if (dropdownName) dropdownName.textContent = user.displayName || 'Truth-Teller';
            if (dropdownEmail) dropdownEmail.textContent = user.email;

            if (authBtn) authBtn.style.display = 'none';
            if (userMenu) userMenu.style.display = 'block';
            
            const heroSection = document.getElementById('heroSection');
            const mainApp = document.getElementById('mainApp');
            const navSearch = document.getElementById('navSearch');
            const navLinks = document.querySelectorAll('.nav-link');
            
            if (heroSection) heroSection.style.display = 'none';
            if (mainApp) mainApp.style.display = 'block';
            if (navSearch) navSearch.style.display = 'block';
            navLinks.forEach(l => l.style.display = 'inline-flex');

            // Load user stats
            loadUserStats(user.uid);
            // Init posts and wisdom if they exist
            if (typeof Posts !== 'undefined' && Posts.loadPosts) {
                Posts.loadPosts();
            }
            if (typeof AIWisdom !== 'undefined' && AIWisdom.loadWisdom) {
                AIWisdom.loadWisdom();
            }
        } else {
            // User signed out
            if (authBtn) authBtn.style.display = 'inline-flex';
            if (userMenu) userMenu.style.display = 'none';
            
            const heroSection = document.getElementById('heroSection');
            const mainApp = document.getElementById('mainApp');
            const navSearch = document.getElementById('navSearch');
            const navLinks = document.querySelectorAll('.nav-link');
            
            if (heroSection) heroSection.style.display = 'flex';
            if (mainApp) mainApp.style.display = 'none';
            if (navSearch) navSearch.style.display = 'none';
            navLinks.forEach(l => l.style.display = 'none');
        }
    }

    async function loadUserStats(uid) {
        try {
            if (db && db.collection) {
                const doc = await db.collection('users').doc(uid).get();
                if (doc.exists) {
                    const data = doc.data();
                    const myPostCount = document.getElementById('myPostCount');
                    const myResonateCount = document.getElementById('myResonateCount');
                    const myWisdomCount = document.getElementById('myWisdomCount');
                    
                    if (myPostCount) myPostCount.textContent = data.postCount || 0;
                    if (myResonateCount) myResonateCount.textContent = data.resonateCount || 0;
                    if (myWisdomCount) myWisdomCount.textContent = data.wisdomCount || 0;
                }
            }
        } catch (e) {
            console.error('Error loading user stats:', e);
        }
    }

    function showModal() {
        if (authModal) authModal.style.display = 'flex';
    }

    function hideModal() {
        if (authModal) authModal.style.display = 'none';
        hideError();
    }

    function showError(msg) {
        if (authError) {
            authError.textContent = msg;
            authError.style.display = 'block';
        }
    }

    function hideError() {
        if (authError) authError.style.display = 'none';
    }

    function getErrorMessage(code) {
        const messages = {
            'auth/email-already-in-use': 'Email already in use. Try logging in instead.',
            'auth/invalid-email': 'Invalid email address format.',
            'auth/weak-password': 'Password too weak. Use at least 6 characters.',
            'auth/user-not-found': 'No account found with this email. Sign up first!',
            'auth/wrong-password': 'Incorrect password. Try again.',
            'auth/invalid-credential': 'Invalid email or password. Please check and try again.',
            'auth/invalid-login-credentials': 'Invalid email or password. Please check and try again.',
            'auth/popup-closed-by-user': 'Sign-in popup was closed.',
            'auth/popup-blocked': 'Popup blocked by browser. Please allow popups.',
            'auth/too-many-requests': 'Too many failed attempts. Please wait a few minutes.',
            'auth/network-request-failed': 'Network error. Check your internet connection.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/operation-not-allowed': 'Email/Password sign-in is not enabled. Enable it in Firebase Console.',
            'auth/api-key-not-valid': 'Firebase API key is invalid. Check your config.',
            'auth/configuration-not-found': 'Firebase Auth not configured. Enable Email/Password in Firebase Console.',
        };
        return messages[code] || `Error: ${code || 'Unknown error'}. Check console for details.`;
    }   

    function getUser() {
        return currentUser;
    }

    return { init, getUser };
})();