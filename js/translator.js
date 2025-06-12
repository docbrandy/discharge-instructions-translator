/**
 * Production Translation Service
 * Handles multiple translation APIs with fallback support
 */

class TranslationService {
    constructor() {
        this.apiKeys = {
            google: window.APP_CONFIG?.GOOGLE_TRANSLATE_API_KEY || '',
            microsoft: window.APP_CONFIG?.MICROSOFT_TRANSLATOR_KEY || '',
            deepl: window.APP_CONFIG?.DEEPL_API_KEY || ''
        };
        this.apiEndpoint = window.APP_CONFIG?.API_ENDPOINT || '';
        this.rateLimiter = new Map();
        this.cache = new Map();
        this.retryAttempts = 3;
        this.retryDelay = 1000;
    }

    /**
     * Main translation method with fallback support
     * @param {string|Array} text - Text to translate
     * @param {string} targetLang - Target language code
     * @param {string} sourceLang - Source language code (default: 'en')
     * @returns {Promise<Object>} Translation result with confidence score
     */
    async translate(text, targetLang, sourceLang = 'en') {
        if (targetLang === sourceLang) {
            return {
                translatedText: text,
                confidence: 1.0,
                service: 'none',
                originalText: text
            };
        }

        const cacheKey = `${sourceLang}-${targetLang}-${JSON.stringify(text)}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Check rate limiting
        if (this.isRateLimited(targetLang)) {
            throw new Error('Rate limit exceeded. Please wait before making another request.');
        }

        let result = null;
        let lastError = null;

        // Try Google Translate first (most reliable for medical terms)
        if (this.apiKeys.google) {
            try {
                result = await this.translateWithGoogle(text, targetLang, sourceLang);
            } catch (error) {
                console.warn('Google Translate failed:', error.message);
                lastError = error;
            }
        }

        // Fallback to Microsoft Translator
        if (!result && this.apiKeys.microsoft) {
            try {
                result = await this.translateWithMicrosoft(text, targetLang, sourceLang);
            } catch (error) {
                console.warn('Microsoft Translator failed:', error.message);
                lastError = error;
            }
        }

        // Fallback to DeepL
        if (!result && this.apiKeys.deepl) {
            try {
                result = await this.translateWithDeepL(text, targetLang, sourceLang);
            } catch (error) {
                console.warn('DeepL failed:', error.message);
                lastError = error;
            }
        }

        // Fallback to custom backend API
        if (!result && this.apiEndpoint) {
            try {
                result = await this.translateWithBackend(text, targetLang, sourceLang);
            } catch (error) {
                console.warn('Backend API failed:', error.message);
                lastError = error;
            }
        }

        if (!result) {
            throw new Error(`Translation failed: ${lastError?.message || 'All translation services unavailable'}`);
        }

        // Cache successful result
        this.cache.set(cacheKey, result);
        this.updateRateLimit(targetLang);

        return result;
    }

    /**
     * Google Translate API integration
     */
    async translateWithGoogle(text, targetLang, sourceLang) {
        const url = `https://translation.googleapis.com/language/translate/v2?key=${this.apiKeys.google}`;
        
        const textArray = Array.isArray(text) ? text : [text];
        
        const response = await this.makeRequest(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: textArray,
                target: targetLang,
                source: sourceLang,
                format: 'text'
            })
        });

        if (!response.data?.translations) {
            throw new Error('Invalid response from Google Translate');
        }

        const translations = response.data.translations.map(t => t.translatedText);
        
        return {
            translatedText: Array.isArray(text) ? translations : translations[0],
            confidence: this.calculateConfidence(response.data.translations[0]),
            service: 'google',
            originalText: text,
            detectedLanguage: response.data.translations[0].detectedSourceLanguage || sourceLang
        };
    }

    /**
     * Microsoft Translator API integration
     */
    async translateWithMicrosoft(text, targetLang, sourceLang) {
        const url = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=${sourceLang}&to=${targetLang}`;
        
        const textArray = Array.isArray(text) ? text.map(t => ({ text: t })) : [{ text }];
        
        const response = await this.makeRequest(url, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': this.apiKeys.microsoft,
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Region': 'global'
            },
            body: JSON.stringify(textArray)
        });

        if (!Array.isArray(response) || !response[0]?.translations) {
            throw new Error('Invalid response from Microsoft Translator');
        }

        const translations = response.map(r => r.translations[0].text);
        
        return {
            translatedText: Array.isArray(text) ? translations : translations[0],
            confidence: response[0].translations[0].confidence || 0.8,
            service: 'microsoft',
            originalText: text,
            detectedLanguage: response[0].detectedLanguage?.language || sourceLang
        };
    }

    /**
     * DeepL API integration
     */
    async translateWithDeepL(text, targetLang, sourceLang) {
        const url = 'https://api-free.deepl.com/v2/translate';
        
        // DeepL language code mapping
        const langMap = {
            'zh': 'ZH',
            'zh-TW': 'ZH-HANT',
            'en': 'EN-US',
            'pt': 'PT-PT'
        };

        const mappedTarget = langMap[targetLang] || targetLang.toUpperCase();
        const mappedSource = langMap[sourceLang] || sourceLang.toUpperCase();
        
        const textArray = Array.isArray(text) ? text : [text];
        
        const formData = new FormData();
        formData.append('auth_key', this.apiKeys.deepl);
        formData.append('source_lang', mappedSource);
        formData.append('target_lang', mappedTarget);
        textArray.forEach(t => formData.append('text', t));
        
        const response = await this.makeRequest(url, {
            method: 'POST',
            body: formData
        });

        if (!response.translations) {
            throw new Error('Invalid response from DeepL');
        }

        const translations = response.translations.map(t => t.text);
        
        return {
            translatedText: Array.isArray(text) ? translations : translations[0],
            confidence: 0.9, // DeepL doesn't provide confidence scores
            service: 'deepl',
            originalText: text,
            detectedLanguage: response.translations[0].detected_source_language || sourceLang
        };
    }

    /**
     * Custom backend API integration
     */
    async translateWithBackend(text, targetLang, sourceLang) {
        const url = `${this.apiEndpoint}/translate`;
        
        const response = await this.makeRequest(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text,
                target_language: targetLang,
                source_language: sourceLang,
                medical_context: true
            })
        });

        return {
            translatedText: response.translated_text,
            confidence: response.confidence || 0.7,
            service: 'backend',
            originalText: text,
            detectedLanguage: response.detected_language || sourceLang
        };
    }

    /**
     * Enhanced request method with retry logic
     */
    async makeRequest(url, options, attempt = 1) {
        try {
            const response = await fetch(url, {
                ...options,
                timeout: 15000 // 15 second timeout
            });

            if (!response.ok) {
                if (response.status === 429 && attempt < this.retryAttempts) {
                    // Rate limited, wait and retry
                    await this.sleep(this.retryDelay * attempt);
                    return this.makeRequest(url, options, attempt + 1);
                }
                
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            if (attempt < this.retryAttempts && !error.message.includes('HTTP')) {
                // Network error, retry
                await this.sleep(this.retryDelay * attempt);
                return this.makeRequest(url, options, attempt + 1);
            }
            throw error;
        }
    }

    /**
     * Calculate confidence score from Google Translate response
     */
    calculateConfidence(translation) {
        // Google doesn't provide confidence scores, so we estimate based on various factors
        let confidence = 0.8; // Base confidence
        
        if (translation.detectedSourceLanguage) {
            confidence += 0.1; // Bonus if source language was detected
        }
        
        // Check for obvious translation issues
        const originalLength = translation.input?.length || 0;
        const translatedLength = translation.translatedText?.length || 0;
        
        if (translatedLength === 0) {
            confidence = 0;
        } else if (Math.abs(originalLength - translatedLength) > originalLength * 2) {
            confidence -= 0.2; // Penalize extreme length differences
        }
        
        return Math.max(0, Math.min(1, confidence));
    }

    /**
     * Rate limiting management
     */
    isRateLimited(language) {
        const key = `rate_limit_${language}`;
        const lastRequest = this.rateLimiter.get(key);
        
        if (!lastRequest) return false;
        
        const timeSinceLastRequest = Date.now() - lastRequest;
        return timeSinceLastRequest < 1000; // 1 second rate limit
    }

    updateRateLimit(language) {
        const key = `rate_limit_${language}`;
        this.rateLimiter.set(key, Date.now());
    }

    /**
     * Utility sleep function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get supported languages for each service
     */
    getSupportedLanguages() {
        return {
            google: [
                'af', 'sq', 'am', 'ar', 'hy', 'az', 'eu', 'be', 'bn', 'bs', 'bg', 'ca', 
                'ceb', 'zh', 'zh-TW', 'co', 'hr', 'cs', 'da', 'nl', 'en', 'eo', 'et', 
                'fi', 'fr', 'fy', 'gl', 'ka', 'de', 'el', 'gu', 'ht', 'ha', 'haw', 
                'he', 'hi', 'hmn', 'hu', 'is', 'ig', 'id', 'ga', 'it', 'ja', 'jv', 
                'kn', 'kk', 'km', 'rw', 'ko', 'ku', 'ky', 'lo', 'la', 'lv', 'lt', 
                'lb', 'mk', 'mg', 'ms', 'ml', 'mt', 'mi', 'mr', 'mn', 'my', 'ne', 
                'no', 'ny', 'or', 'ps', 'fa', 'pl', 'pt', 'pa', 'ro', 'ru', 'sm', 
                'gd', 'sr', 'st', 'sn', 'sd', 'si', 'sk', 'sl', 'so', 'es', 'su', 
                'sw', 'sv', 'tl', 'tg', 'ta', 'tt', 'te', 'th', 'tr', 'tk', 'uk', 
                'ur', 'ug', 'uz', 'vi', 'cy', 'xh', 'yi', 'yo', 'zu'
            ],
            microsoft: [
                'af', 'sq', 'am', 'ar', 'hy', 'as', 'az', 'bn', 'ba', 'eu', 'bg', 
                'yue', 'ca', 'lzh', 'zh', 'zh-TW', 'hr', 'cs', 'da', 'prs', 'dv', 
                'nl', 'en', 'et', 'fo', 'fj', 'fil', 'fi', 'fr', 'fr-CA', 'gl', 
                'ka', 'de', 'el', 'gu', 'ht', 'he', 'hi', 'mww', 'hu', 'is', 'id', 
                'ikt', 'iu', 'iu-Latn', 'ga', 'it', 'ja', 'kn', 'kk', 'km', 'tlh-Latn', 
                'ko', 'ku', 'kmr', 'ky', 'lo', 'lv', 'lt', 'mk', 'mg', 'ms', 'ml', 
                'mt', 'mi', 'mr', 'mn-Cyrl', 'mn-Mong', 'my', 'ne', 'nb', 'or', 'ps', 
                'fa', 'pl', 'pt', 'pt-PT', 'pa', 'otq', 'ro', 'ru', 'sm', 'sr-Cyrl', 
                'sr-Latn', 'sk', 'sl', 'so', 'es', 'sw', 'sv', 'ty', 'ta', 'tt', 
                'te', 'th', 'bo', 'ti', 'to', 'tr', 'tk', 'uk', 'hsb', 'ur', 'ug', 
                'uz', 'vi', 'cy', 'yua', 'zu'
            ],
            deepl: [
                'BG', 'CS', 'DA', 'DE', 'EL', 'EN', 'ES', 'ET', 'FI', 'FR', 'HU', 
                'ID', 'IT', 'JA', 'KO', 'LT', 'LV', 'NB', 'NL', 'PL', 'PT', 'RO', 
                'RU', 'SK', 'SL', 'SV', 'TR', 'UK', 'ZH'
            ]
        };
    }

    /**
     * Medical term enhancement
     * Post-processes translations to ensure medical accuracy
     */
    async enhanceMedicalTranslation(translatedText, originalText, targetLang) {
        // Medical term dictionary for common translations
        const medicalTerms = {
            'en': {
                'hypertension': ['high blood pressure', 'elevated blood pressure'],
                'myocardial infarction': ['heart attack', 'MI'],
                'cerebrovascular accident': ['stroke', 'CVA'],
                'diabetes mellitus': ['diabetes', 'DM'],
                'chronic obstructive pulmonary disease': ['COPD'],
                'acetaminophen': ['paracetamol', 'tylenol'],
                'ibuprofen': ['advil', 'motrin']
            }
            // Add more language-specific medical term mappings
        };

        // Simple term replacement for now
        // In production, this would use a comprehensive medical dictionary
        let enhanced = translatedText;
        
        if (medicalTerms[targetLang]) {
            Object.entries(medicalTerms[targetLang]).forEach(([term, alternatives]) => {
                alternatives.forEach(alt => {
                    const regex = new RegExp(`\\b${alt}\\b`, 'gi');
                    enhanced = enhanced.replace(regex, term);
                });
            });
        }

        return enhanced;
    }

    /**
     * Clear cache and reset rate limiters
     */
    clearCache() {
        this.cache.clear();
        this.rateLimiter.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            cacheSize: this.cache.size,
            rateLimitEntries: this.rateLimiter.size
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TranslationService;
} else {
    window.TranslationService = TranslationService;
}
