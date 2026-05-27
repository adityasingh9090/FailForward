// ========================================
// Cloudinary Configuration
// ========================================

const CLOUDINARY_CONFIG = {
    cloudName: 'drvlegv85',          // Your Cloudinary cloud name
    uploadPreset: 'failforward_reels', // Upload preset (must be configured in Cloudinary)
    folder: 'failforward/reels',      // Folder path in Cloudinary media library
    apiUrl: 'https://api.cloudinary.com/v1_1',
    
    // Optional: Max file size (in bytes)
    maxFileSize: 100 * 1024 * 1024,   // 100MB (adjust as needed)
    
    // Optional: Allowed file types
    allowedFormats: ['mp4', 'mov', 'avi', 'webm', 'jpg', 'jpeg', 'png', 'gif'],
    
    // Optional: Upload options
    uploadOptions: {
        resource_type: 'auto',        // Automatically detect image/video
        quality: 'auto',
        fetch_format: 'auto',
        flags: 'attachment',          // For reels/videos
        transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' }
        ]
    }
};

// Validate configuration on load
(function validateCloudinaryConfig() {
    if (!CLOUDINARY_CONFIG.cloudName || CLOUDINARY_CONFIG.cloudName === 'your_cloud_name') {
        console.error('❌ Cloudinary Error: Invalid cloud name. Please check your Cloudinary credentials.');
        console.error('   Get your cloud name from: https://cloudinary.com/console');
        return;
    }
    
    if (!CLOUDINARY_CONFIG.uploadPreset || CLOUDINARY_CONFIG.uploadPreset === 'your_upload_preset') {
        console.error('❌ Cloudinary Error: Upload preset not configured.');
        console.error('   Create an upload preset in Cloudinary Settings → Upload');
        return;
    }
    
    console.log('✅ Cloudinary configured successfully');
    console.log(`   📁 Cloud Name: ${CLOUDINARY_CONFIG.cloudName}`);
    console.log(`   📂 Upload Preset: ${CLOUDINARY_CONFIG.uploadPreset}`);
    console.log(`   📍 Folder: ${CLOUDINARY_CONFIG.folder}`);
    
    // Test URL construction
    const testUrl = `${CLOUDINARY_CONFIG.apiUrl}/${CLOUDINARY_CONFIG.cloudName}/auto/upload`;
    console.log(`   🔗 Upload URL: ${testUrl}`);
})();

// Helper function to get full upload URL
function getCloudinaryUploadUrl(resourceType = 'auto') {
    if (!CLOUDINARY_CONFIG.cloudName) {
        throw new Error('Cloudinary cloud name not configured');
    }
    return `${CLOUDINARY_CONFIG.apiUrl}/${CLOUDINARY_CONFIG.cloudName}/${resourceType}/upload`;
}

// Helper function to validate file before upload
function validateCloudinaryFile(file) {
    // Check file size
    if (file.size > CLOUDINARY_CONFIG.maxFileSize) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const maxMB = (CLOUDINARY_CONFIG.maxFileSize / (1024 * 1024)).toFixed(0);
        throw new Error(`File too large: ${sizeMB}MB. Maximum size is ${maxMB}MB.`);
    }
    
    // Check file type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!CLOUDINARY_CONFIG.allowedFormats.includes(fileExtension)) {
        throw new Error(`Unsupported file format: ${fileExtension}. Allowed formats: ${CLOUDINARY_CONFIG.allowedFormats.join(', ')}`);
    }
    
    return true;
}

// Export configuration (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CLOUDINARY_CONFIG, getCloudinaryUploadUrl, validateCloudinaryFile };
}