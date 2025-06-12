// config.js - Configuration management
class AppConfig {
    constructor() {
        this.loadEnvironmentConfig();
    }

    loadEnvironmentConfig() {
        // Load configuration from environment variables or defaults
        window.APP_CONFIG = {
            // Translation API Keys
            GOOGLE_TRANSLATE_API_KEY: 'YOUR_API_KEY_HERE',
            MICROSOFT_TRANSLATOR_KEY: '',
            DEEPL_API_KEY: '',
            
            // App settings
            DEBUG_MODE: false,
            SUPPORTED_LANGUAGES: [
                'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 
                'ja', 'ko', 'ar', 'hi', 'th', 'vi'
            ],
            DEFAULT_LANGUAGE: 'en'
        };
    }

    get(key, defaultValue = null) {
        return window.APP_CONFIG?.[key] ?? defaultValue;
    }

    getSupportedLanguages() {
        return this.get('SUPPORTED_LANGUAGES', ['en']);
    }
}

// Initialize configuration
window.appConfig = new AppConfig();
