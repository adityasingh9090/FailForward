// ========================================
// Firebase Configuration
// ========================================

const firebaseConfig = {
    apiKey: "AIzaSyCQTLffqC6wAlbKtUjb43k30nJoYVDyuKw",
    authDomain: "failforward-52571.firebaseapp.com",
    projectId: "failforward-52571",
    storageBucket: "failforward-52571.firebasestorage.app",
    messagingSenderId: "431556159198",
    appId: "1:431556159198:web:400348d5272ceca451044f",
    measurementId: "G-LM8XMX8VD4"
};

// Global Firebase variables
let auth = null;
let db = null;

// Validate Firebase configuration
function validateFirebaseConfig(config) {
    const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'];
    const missingFields = requiredFields.filter(field => !config[field]);
    
    if (missingFields.length > 0) {
        console.error('❌ Firebase Config Error: Missing required fields:', missingFields.join(', '));
        return false;
    }
    
    // Validate API key format (basic check)
    if (!config.apiKey.startsWith('AIza') && config.apiKey.length < 30) {
        console.warn('⚠️ Firebase Warning: API key format looks unusual');
    }
    
    return true;
}

// Initialize Firebase with error handling
function initializeFirebase() {
    if (!validateFirebaseConfig(firebaseConfig)) {
        console.error('❌ Firebase initialization failed: Invalid configuration');
        return false;
    }
    
    try {
        // Check if Firebase is already initialized
        if (firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase initialized successfully');
        } else {
            console.log('ℹ️ Firebase already initialized, using existing instance');
        }
        
        // Initialize services
        auth = firebase.auth();
        db = firebase.firestore();
        
        // Configure Firestore settings
        const settings = {
            cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
            ignoreUndefinedProperties: true
        };
        db.settings(settings);
        
        // Enable offline persistence with error handling
        enableOfflinePersistence();
        
        // Test connection
        testFirebaseConnection();
        
        return true;
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        return false;
    }
}

// Enable offline persistence with fallback
async function enableOfflinePersistence() {
    try {
        await db.enablePersistence({
            synchronizeTabs: true  // Enable cross-tab synchronization
        });
        console.log('✅ Firestore offline persistence enabled');
    } catch (err) {
        if (err.code === 'failed-precondition') {
            console.warn('⚠️ Offline persistence failed: Multiple tabs open in same browser');
            console.warn('   Persistence can only be enabled in one tab at a time');
        } else if (err.code === 'unimplemented') {
            console.warn('⚠️ Offline persistence not supported by browser');
        } else {
            console.error('❌ Persistence error:', err.code, err.message);
        }
    }
}

// Test Firebase connection
async function testFirebaseConnection() {
    try {
        // Quick test to verify connection
        const testRef = db.collection('_test_').doc('connection');
        await testRef.set({ timestamp: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        await testRef.delete();
        console.log('✅ Firebase connection test successful');
    } catch (error) {
        console.error('❌ Firebase connection test failed:', error);
        console.warn('   Check your network connection and Firebase rules');
    }
}

// Initialize Firebase
const initSuccess = initializeFirebase();

// Export for other modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { auth, db, initSuccess };
}

// Helper function to check Firebase health
function checkFirebaseHealth() {
    if (!auth || !db) {
        return { healthy: false, error: 'Firebase not initialized' };
    }
    
    const currentUser = auth.currentUser;
    return {
        healthy: true,
        authReady: !!auth,
        dbReady: !!db,
        userLoggedIn: !!currentUser,
        userId: currentUser?.uid || null
    };
}

// Optional: Add connection state listener
if (firebase.apps.length > 0) {
    firebase.firestore().enableNetwork()
        .then(() => console.log('🌐 Firestore network enabled'))
        .catch(err => console.error('❌ Network enable error:', err));
    
    // Listen for connection state changes
    firebase.firestore().onSnapshotsInSync(() => {
        console.log('📡 Firestore snapshots in sync');
    });
}

console.log('🔥 Firebase module loaded');