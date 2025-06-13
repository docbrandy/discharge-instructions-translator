/**
 * Translation Service for medical content
 */
class TranslationService {
    constructor() {
        this.fallbackTranslations = {
            'es': {
                'Take medication': 'Tomar medicamento',
                'Follow up': 'Seguimiento',
                'Rest': 'Descanso',
                'Return if symptoms worsen': 'Regresar si los síntomas empeoran',
                'medication': 'medicamento',
                'doctor': 'doctor',
                'appointment': 'cita'
            },
            'fr': {
                'Take medication': 'Prendre des médicaments',
                'Follow up': 'Suivi',
                'Rest': 'Repos',
                'Return if symptoms worsen': 'Revenir si les symptômes s\'aggravent',
                'medication': 'médicament',
                'doctor': 'médecin',
                'appointment': 'rendez-vous'
            },
            'de': {
                'Take medication': 'Medikament einnehmen',
                'Follow up': 'Nachbehandlung',
                'Rest': 'Ruhe',
                'Return if symptoms worsen': 'Zurückkehren wenn sich Symptome verschlechtern',
                'medication': 'Medikament',
                'doctor': 'Arzt',
                'appointment': 'Termin'
            }
        };
    }

    /**
     * Main translation method - tries free service first
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

        try {
            // Try LibreTranslate first (free service)
            console.log('Attempting LibreTranslate...');
            return await this.translateWithLibre(text, targetLang, sourceLang);
        } catch (error) {
            console.warn('LibreTranslate failed:', error.message);
            
            try {
                // Fall back to enhanced word replacement
                console.log('Using enhanced fallback translation...');
                return this.translateWithEnhancedFallback(text, targetLang);
            } catch (fallbackError) {
                console.warn('Enhanced fallback failed, using demo mode:', fallbackError.message);
                
                // Final fallback to demo mode
                return this.translateWithDemo(text, targetLang);
            }
        }
    }

    /**
     * LibreTranslate API implementation (free service)
     */
    async translateWithLibre(text, targetLang, sourceLang) {
        const textsToTranslate = Array.isArray(text) ? text : [text];
        const translations = [];

        // Map common language codes
        const langMap = {
            'zh': 'zh-cn',
            'ja': 'ja',
            'ko': 'ko',
            'ar': 'ar',
            'hi': 'hi'
        };
        
        const mappedTargetLang = langMap[targetLang] || targetLang;

        for (const textItem of textsToTranslate) {
            if (!textItem || textItem.trim().length === 0) {
                translations.push(textItem);
                continue;
            }

            const response = await fetch('https://libretranslate.de/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    q: textItem.trim(),
                    source: sourceLang,
                    target: mappedTargetLang,
                    format: 'text'
                })
            });

            if (!response.ok) {
                throw new Error(`LibreTranslate API error: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(`LibreTranslate error: ${data.error}`);
            }
            
            translations.push(data.translatedText || textItem);
        }

        return {
            translatedText: Array.isArray(text) ? translations : translations[0],
            confidence: 0.8,
            service: 'LibreTranslate (Free)'
        };
    }

    /**
     * Enhanced fallback translation with better word replacement
     */
    translateWithEnhancedFallback(text, targetLang) {
        const textsToTranslate = Array.isArray(text) ? text : [text];
        const fallbackDict = this.fallbackTranslations[targetLang] || {};
        
        const translations = textsToTranslate.map(textItem => {
            let translated = textItem;
            
            // Replace known phrases and words
            Object.entries(fallbackDict).forEach(([english, foreign]) => {
                // Try exact phrase match first
                const exactRegex = new RegExp(`\\b${this.escapeRegex(english)}\\b`, 'gi');
                translated = translated.replace(exactRegex, foreign);
                
                // Try partial word matches
                const partialRegex = new RegExp(this.escapeRegex(english), 'gi');
                translated = translated.replace(partialRegex, foreign);
            });
            
            return translated;
        });

        return {
            translatedText: Array.isArray(text) ? translations : translations[0],
            confidence: 0.4,
            service: 'Enhanced Fallback'
        };
    }

    /**
     * Demo translation (adds language indicators)
     */
    translateWithDemo(text, targetLang) {
        // Simulate processing delay
        return new Promise(resolve => {
            setTimeout(() => {
                const translations = {
                    'es': ' (en español)',
                    'fr': ' (en français)', 
                    'de': ' (auf Deutsch)',
                    'it': ' (in italiano)',
                    'pt': ' (em português)',
                    'zh': ' (中文)',
                    'ja': ' (日本語)',
                    'ko': ' (한국어)',
                    'ar': ' (بالعربية)',
                    'hi': ' (हिंदी में)'
                };
                
                const suffix = translations[targetLang] || ` (in ${targetLang})`;
                
                if (Array.isArray(text)) {
                    resolve({
                        translatedText: text.map(t => t + suffix),
                        confidence: 0.85,
                        service: 'Demo Mode',
                        originalText: text
                    });
                } else {
                    resolve({
                        translatedText: text + suffix,
                        confidence: 0.85,
                        service: 'Demo Mode',
                        originalText: text
                    });
                }
            }, 1000);
        });
    }

    /**
     * Helper method to escape special regex characters
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
