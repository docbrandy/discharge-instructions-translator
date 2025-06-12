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
                'Return if symptoms worsen': 'Regresar si los síntomas empeoran'
            },
            'fr': {
                'Take medication': 'Prendre des médicaments',
                'Follow up': 'Suivi',
                'Rest': 'Repos',
                'Return if symptoms worsen': 'Revenir si les symptômes s\'aggravent'
            }
        };
    }

    /**
     * Demo translation method - works without APIs
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
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Demo translation - just adds language indicator
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
            return {
                translatedText: text.map(t => t + suffix),
                confidence: 0.85,
                service: 'demo',
                originalText: text
            };
        } else {
            return {
                translatedText: text + suffix,
                confidence: 0.85,
                service: 'demo',
                originalText: text
            };
        }
    }
}
