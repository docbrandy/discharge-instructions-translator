/**
 * Enhanced Translation Service with Azure Translator Support
 * Replace your current translator.js with this version
 */

class TranslationService {
    constructor() {
        // Azure Translator configuration
        this.azureConfig = {
            endpoint: 'https://api.cognitive.microsofttranslator.com',
            apiKey: null, // Will be set via setAzureKey() method
            region: 'global', // or your specific region like 'eastus'
            apiVersion: '3.0'
        };

        // Fallback translations for offline/emergency use
        this.fallbackTranslations = {
            'es': {
                // Complete medical phrases first (most specific)
                'you have a fractured mandible': 'usted tiene una mandíbula fracturada',
                'take tylenol by mouth three times daily': 'tome tylenol por vía oral tres veces al día',
                'you need to maintain a full liquid diet': 'necesita mantener una dieta líquida completa',
                'take tylenol 1000mg three times daily for pain': 'tome tylenol 1000mg tres veces al día para el dolor',
                'by mouth every 8 hours as needed for pain': 'por vía oral cada 8 horas según sea necesario para el dolor',
                'follow up with your doctor': 'haga seguimiento con su médico',
                'return if symptoms worsen': 'regrese si los síntomas empeoran',
                'call your doctor immediately': 'llame a su médico inmediatamente',
                'go to emergency room': 'vaya a la sala de emergencias',
                
                // Individual terms
                'take': 'tome',
                'by mouth': 'por vía oral',
                'three times daily': 'tres veces al día',
                'twice daily': 'dos veces al día',
                'once daily': 'una vez al día',
                'as needed': 'según sea necesario',
                'for pain': 'para el dolor',
                'with food': 'con comida',
                'fractured': 'fracturada',
                'mandible': 'mandíbula',
                'liquid diet': 'dieta líquida',
                'maintain': 'mantener',
                'tylenol': 'tylenol',
                'ibuprofen': 'ibuprofeno',
                'medication': 'medicamento',
                'doctor': 'médico',
                'emergency': 'emergencia'
            },
            'fr': {
                'you have a fractured mandible': 'vous avez une mandibule fracturée',
                'take tylenol by mouth three times daily': 'prenez tylenol par voie orale trois fois par jour',
                'you need to maintain a full liquid diet': 'vous devez maintenir un régime liquide complet',
                'take': 'prenez',
                'by mouth': 'par voie orale',
                'three times daily': 'trois fois par jour',
                'liquid diet': 'régime liquide',
                'maintain': 'maintenir'
            }
        };
        
        this.lastUsedMethod = 'none';
    }

    /**
     * Set Azure Translator API key and region
     */
    setAzureKey(apiKey, region = 'global') {
        this.azureConfig.apiKey = apiKey;
        this.azureConfig.region = region;
        console.log('✅ Azure Translator API key configured');
    }

    /**
     * Main translation method with Azure Translator priority
     */
    async translate(text, targetLang, sourceLang = 'en') {
        console.log('=== AZURE TRANSLATION DEBUG ===');
        console.log('Input:', text);
        console.log('Target language:', targetLang);
        console.log('Azure API key configured:', !!this.azureConfig.apiKey);
        
        if (targetLang === sourceLang || targetLang === 'en') {
            return {
                translatedText: text,
                confidence: 1.0,
                service: 'no_translation_needed'
            };
        }

        // Handle array input
        if (Array.isArray(text)) {
            const results = await Promise.all(
                text.map(item => this.translateSingle(item, targetLang, sourceLang))
            );
            
            return {
                translatedText: results.map(r => r.translatedText),
                confidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
                service: results[0]?.service || 'batch_translation'
            };
        }

        return this.translateSingle(text, targetLang, sourceLang);
    }

    /**
     * Translate single text with Azure Translator priority
     */
    async translateSingle(text, targetLang, sourceLang) {
        // Try translation methods in order of preference
        const methods = [
            () => this.translateWithAzure(text, targetLang, sourceLang),
            () => this.translateWithLibreTranslate(text, targetLang, sourceLang),
            () => this.translateWithEnhancedFallback(text, targetLang)
        ];

        for (let i = 0; i < methods.length; i++) {
            try {
                console.log(`🔄 Trying translation method ${i + 1}...`);
                const result = await methods[i]();
                console.log(`✅ Translation method ${i + 1} succeeded:`, result);
                return result;
            } catch (error) {
                console.warn(`⚠️ Translation method ${i + 1} failed:`, error.message);
            }
        }

        // Final fallback
        return {
            translatedText: text + ` [Translation to ${targetLang} unavailable]`,
            confidence: 0.1,
            service: 'all_methods_failed'
        };
    }

    /**
     * Azure Translator API implementation (PRIMARY METHOD)
     */
    async translateWithAzure(text, targetLang, sourceLang) {
        if (!this.azureConfig.apiKey) {
            throw new Error('Azure API key not configured');
        }

        console.log('🔄 Using Azure Translator...');

        const endpoint = `${this.azureConfig.endpoint}/translate`;
        const params = new URLSearchParams({
            'api-version': this.azureConfig.apiVersion,
            'from': sourceLang,
            'to': targetLang
        });

        const requestBody = [{
            'text': text.trim()
        }];

        try {
            const response = await fetch(`${endpoint}?${params}`, {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': this.azureConfig.apiKey,
                    'Ocp-Apim-Subscription-Region': this.azureConfig.region,
                    'Content-Type': 'application/json',
                    'X-ClientTraceId': this.generateTraceId()
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Azure API Error Response:', errorText);
                throw new Error(`Azure Translator API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('Azure API Response:', data);

            if (data && data[0] && data[0].translations && data[0].translations[0]) {
                const translation = data[0].translations[0];
                
                this.lastUsedMethod = 'Azure Translator';
                return {
                    translatedText: translation.text,
                    confidence: translation.confidence || 0.95,
                    service: 'Azure Translator',
                    detectedLanguage: data[0].detectedLanguage?.language,
                    originalText: text
                };
            } else {
                throw new Error('Invalid Azure Translator response format');
            }

        } catch (error) {
            console.error('Azure Translator error:', error);
            throw error;
        }
    }

    /**
     * LibreTranslate API (FALLBACK METHOD)
     */
    async translateWithLibreTranslate(text, targetLang, sourceLang) {
        const endpoints = [
            'https://libretranslate.com/translate',
            'https://libretranslate.de/translate'
        ];

        let lastError = null;

        for (const endpoint of endpoints) {
            try {
                console.log(`🔄 Trying LibreTranslate: ${endpoint}`);
                
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        q: text.trim(),
                        source: sourceLang,
                        target: targetLang,
                        format: 'text'
                    })
                });

                if (!response.ok) {
                    throw new Error(`LibreTranslate API error: ${response.status}`);
                }

                const data = await response.json();
                
                if (data.error) {
                    throw new Error(data.error);
                }
                
                this.lastUsedMethod = 'LibreTranslate';
                return {
                    translatedText: data.translatedText || text,
                    confidence: 0.8,
                    service: 'LibreTranslate'
                };

            } catch (error) {
                lastError = error;
                console.warn(`LibreTranslate endpoint failed: ${endpoint}`, error.message);
            }
        }

        throw lastError || new Error('All LibreTranslate endpoints failed');
    }

    /**
     * Enhanced fallback with medical dictionary
     */
    translateWithEnhancedFallback(text, targetLang) {
        console.log('🔄 Using enhanced fallback translation');
        
        const fallbackDict = this.fallbackTranslations[targetLang];
        if (!fallbackDict) {
            throw new Error(`No fallback translations for ${targetLang}`);
        }

        let translated = text.toLowerCase();
        let translationFound = false;
        
        // Sort by length (longest phrases first) for better matching
        const sortedEntries = Object.entries(fallbackDict)
            .sort((a, b) => b[0].length - a[0].length);
        
        // First pass: Look for complete sentence matches
        sortedEntries.forEach(([english, foreign]) => {
            if (english.length > 10) { // Focus on longer phrases first
                const regex = new RegExp(this.escapeRegex(english.toLowerCase()), 'gi');
                if (translated.includes(english.toLowerCase())) {
                    translated = translated.replace(regex, foreign);
                    translationFound = true;
                    console.log(`Complete phrase match: "${english}" → "${foreign}"`);
                }
            }
        });
        
        // Second pass: Fill in remaining words
        sortedEntries.forEach(([english, foreign]) => {
            if (english.length <= 10) { // Individual words and short phrases
                const regex = new RegExp(`\\b${this.escapeRegex(english.toLowerCase())}\\b`, 'gi');
                const beforeReplace = translated;
                translated = translated.replace(regex, foreign);
                if (translated !== beforeReplace) {
                    console.log(`Word replacement: "${english}" → "${foreign}"`);
                    translationFound = true;
                }
            }
        });

        // Capitalize first letter to maintain sentence structure
        translated = translated.charAt(0).toUpperCase() + translated.slice(1);

        if (!translationFound) {
            throw new Error('No translations found in fallback dictionary');
        }

        this.lastUsedMethod = 'Enhanced Fallback';
        return {
            translatedText: translated,
            confidence: 0.7,
            service: 'Enhanced Fallback Dictionary'
        };
    }

    /**
     * Get supported Azure Translator languages
     */
    async getSupportedLanguages() {
        if (this.azureConfig.apiKey) {
            try {
                const response = await fetch(`${this.azureConfig.endpoint}/languages?api-version=${this.azureConfig.apiVersion}`);
                const data = await response.json();
                return data.translation || {};
            } catch (error) {
                console.warn('Failed to get Azure languages:', error);
            }
        }

        // Return default supported languages
        return {
            'en': { name: 'English' },
            'es': { name: 'Spanish' },
            'fr': { name: 'French' },
            'de': { name: 'German' },
            'it': { name: 'Italian' },
            'pt': { name: 'Portuguese' },
            'zh': { name: 'Chinese Simplified' },
            'ja': { name: 'Japanese' },
            'ko': { name: 'Korean' },
            'ar': { name: 'Arabic' },
            'hi': { name: 'Hindi' }
        };
    }

    /**
     * Test Azure Translator connection
     */
    async testAzureConnection() {
        if (!this.azureConfig.apiKey) {
            return { success: false, error: 'No API key configured' };
        }

        try {
            const result = await this.translateWithAzure('Hello world', 'es', 'en');
            return { 
                success: true, 
                result: result,
                message: 'Azure Translator connection successful'
            };
        } catch (error) {
            return { 
                success: false, 
                error: error.message,
                message: 'Azure Translator connection failed'
            };
        }
    }

    /**
     * Utility methods
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    generateTraceId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            lastUsedMethod: this.lastUsedMethod,
            azureConfigured: !!this.azureConfig.apiKey,
            azureRegion: this.azureConfig.region,
            availableFallbackLanguages: Object.keys(this.fallbackTranslations)
        };
    }
}

// Export for use in main app
window.TranslationService = TranslationService;

// Add a method to easily configure Azure from console for testing
window.configureAzureTranslator = function(apiKey, region = 'global') {
    if (window.dischargeApp && window.dischargeApp.translationService) {
        window.dischargeApp.translationService.setAzureKey(apiKey, region);
        console.log('✅ Azure Translator configured for existing app');
    } else {
        console.log('⚠️ App not found. Configure after app loads.');
    }
};

console.log('✅ Azure Translation Service loaded');
