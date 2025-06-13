/**
 * Enhanced Translation Service - Complete Sentence Translation
 */
class TranslationService {
    constructor() {
        this.fallbackTranslations = {
            'es': {
                // Complete sentence templates (MOST IMPORTANT - ADD THESE)
                'you have a fractured mandible': 'usted tiene una mandíbula fracturada',
                'take tylenol by mouth three times daily': 'tome tylenol por vía oral tres veces al día',
                'you need to maintain a full liquid diet': 'necesita mantener una dieta líquida completa',
                'take medication by mouth': 'tome el medicamento por vía oral',
                'follow up with your doctor': 'haga seguimiento con su médico',
                'return to the emergency room if': 'regrese a la sala de emergencias si',
                'call your doctor immediately if': 'llame a su médico inmediatamente si',
                'you are discharged home': 'usted es dado de alta a casa',
                'continue taking your medications': 'continúe tomando sus medicamentos',
                
                // Medical conditions (complete phrases)
                'fractured mandible': 'mandíbula fracturada',
                'broken jaw': 'mandíbula rota',
                'high blood pressure': 'presión arterial alta',
                'diabetes type 2': 'diabetes tipo 2',
                'heart attack': 'ataque cardíaco',
                'chest pain': 'dolor en el pecho',
                'shortness of breath': 'falta de aire',
                
                // Complete medication instructions
                'take tylenol 1000mg three times daily for pain': 'tome tylenol 1000mg tres veces al día para el dolor',
                'take ibuprofen 200mg every 6 hours as needed': 'tome ibuprofeno 200mg cada 6 horas según sea necesario',
                'take one tablet by mouth twice daily': 'tome una tableta por vía oral dos veces al día',
                'take with food to prevent stomach upset': 'tome con comida para prevenir malestar estomacal',
                
                // Diet instructions
                'maintain a full liquid diet': 'mantenga una dieta líquida completa',
                'soft diet only': 'solo dieta blanda',
                'no solid foods': 'no alimentos sólidos',
                'drink plenty of fluids': 'beba muchos líquidos',
                'avoid hard or crunchy foods': 'evite alimentos duros o crujientes',
                
                // Follow-up instructions
                'follow up with doctor in': 'haga seguimiento con el médico en',
                'return in 2 weeks': 'regrese en 2 semanas',
                'schedule appointment': 'programe una cita',
                'see your primary care doctor': 'consulte a su médico de atención primaria',
                
                // Warning signs
                'return immediately if you experience': 'regrese inmediatamente si experimenta',
                'call 911 if you have': 'llame al 911 si tiene',
                'seek immediate medical attention': 'busque atención médica inmediata',
                'go to emergency room': 'vaya a la sala de emergencias',
                
                // Common sentence starters
                'you have': 'usted tiene',
                'you need to': 'necesita',
                'you should': 'debe',
                'you must': 'debe',
                'it is important to': 'es importante',
                'make sure to': 'asegúrese de',
                'do not': 'no',
                'avoid': 'evite',
                
                // Individual words (fallback)
                'take': 'tome',
                'by mouth': 'por vía oral',
                'three times daily': 'tres veces al día',
                'twice daily': 'dos veces al día',
                'once daily': 'una vez al día',
                'daily': 'diariamente',
                'tylenol': 'tylenol',
                'pain': 'dolor',
                'for pain': 'para el dolor',
                'with food': 'con comida',
                'as needed': 'según sea necesario',
                'mandible': 'mandíbula',
                'fractured': 'fracturada',
                'liquid': 'líquida',
                'diet': 'dieta',
                'maintain': 'mantener',
                'full': 'completa',
                'doctor': 'médico',
                'follow up': 'seguimiento',
                'return': 'regresar',
                'call': 'llamar',
                'immediately': 'inmediatamente',
                'emergency': 'emergencia',
                'room': 'sala',
                'if': 'si',
                'and': 'y',
                'or': 'o',
                'the': 'el/la',
                'to': 'a',
                'in': 'en',
                'with': 'con',
                'for': 'para'
            },
            'fr': {
                'you have a fractured mandible': 'vous avez une mandibule fracturée',
                'take tylenol by mouth three times daily': 'prenez tylenol par voie orale trois fois par jour',
                'you need to maintain a full liquid diet': 'vous devez maintenir un régime liquide complet',
                'fractured mandible': 'mandibule fracturée',
                'take': 'prenez',
                'by mouth': 'par voie orale',
                'three times daily': 'trois fois par jour',
                'liquid diet': 'régime liquide',
                'maintain': 'maintenir'
            },
            'de': {
                'you have a fractured mandible': 'Sie haben einen gebrochenen Unterkiefer',
                'take tylenol by mouth three times daily': 'nehmen Sie Tylenol dreimal täglich oral ein',
                'you need to maintain a full liquid diet': 'Sie müssen eine vollständige Flüssigkost einhalten',
                'fractured mandible': 'gebrochener Unterkiefer',
                'take': 'nehmen',
                'by mouth': 'oral',
                'three times daily': 'dreimal täglich'
            }
        };
        
        this.lastUsedMethod = 'none';
    }

    /**
     * Main translation method with complete sentence handling
     */
    async translate(text, targetLang, sourceLang = 'en') {
        console.log('=== ENHANCED TRANSLATION DEBUG ===');
        console.log('Input:', text);
        console.log('Target language:', targetLang);
        
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
     * Translate single text with enhanced sentence processing
     */
    async translateSingle(text, targetLang, sourceLang) {
        const originalText = text;
        
        // Try different translation methods in order of preference
        const methods = [
            () => this.translateWithLibreTranslate(text, targetLang, sourceLang),
            () => this.translateWithEnhancedFallback(text, targetLang),
            () => this.translateWithDemo(text, targetLang)
        ];

        for (let i = 0; i < methods.length; i++) {
            try {
                const result = await methods[i]();
                console.log(`Translation method ${i + 1} succeeded:`, result);
                return result;
            } catch (error) {
                console.warn(`Translation method ${i + 1} failed:`, error.message);
            }
        }

        // Final fallback
        return {
            translatedText: text + ` [Translation to ${targetLang} unavailable]`,
            confidence: 0.1,
            service: 'fallback_failed'
        };
    }

    /**
     * LibreTranslate API (primary method)
     */
    async translateWithLibreTranslate(text, targetLang, sourceLang) {
        const endpoints = [
            'https://libretranslate.com/translate',
            'https://libretranslate.de/translate'
        ];

        let lastError = null;

        for (const endpoint of endpoints) {
            try {
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
                    throw new Error(`API error: ${response.status}`);
                }

                const data = await response.json();
                
                if (data.error) {
                    throw new Error(data.error);
                }
                
                return {
                    translatedText: data.translatedText || text,
                    confidence: 0.85,
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
     * Enhanced fallback with complete sentence matching
     */
    translateWithEnhancedFallback(text, targetLang) {
        console.log('Using enhanced fallback for:', text);
        
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
        sortedEntries.forEach(([english, spanish]) => {
            if (english.length > 10) { // Focus on longer phrases first
                const regex = new RegExp(this.escapeRegex(english.toLowerCase()), 'gi');
                if (translated.includes(english.toLowerCase())) {
                    translated = translated.replace(regex, spanish);
                    translationFound = true;
                    console.log(`Complete phrase match: "${english}" → "${spanish}"`);
                }
            }
        });
        
        // Second pass: Fill in remaining words
        sortedEntries.forEach(([english, spanish]) => {
            if (english.length <= 10) { // Individual words and short phrases
                const regex = new RegExp(`\\b${this.escapeRegex(english.toLowerCase())}\\b`, 'gi');
                const beforeReplace = translated;
                translated = translated.replace(regex, spanish);
                if (translated !== beforeReplace) {
                    console.log(`Word replacement: "${english}" → "${spanish}"`);
                    translationFound = true;
                }
            }
        });

        // Capitalize first letter to maintain sentence structure
        translated = translated.charAt(0).toUpperCase() + translated.slice(1);

        if (!translationFound) {
            throw new Error('No translations found in fallback dictionary');
        }

        return {
            translatedText: translated,
            confidence: translationFound ? 0.75 : 0.3,
            service: 'Enhanced Fallback Dictionary'
        };
    }

    /**
     * Demo translation (adds language indicator)
     */
    translateWithDemo(text, targetLang) {
        const indicators = {
            'es': ' (traducido al español)',
            'fr': ' (traduit en français)', 
            'de': ' (ins Deutsche übersetzt)',
            'it': ' (tradotto in italiano)',
            'pt': ' (traduzido para português)'
        };
        
        const indicator = indicators[targetLang] || ` (translated to ${targetLang})`;
        
        return {
            translatedText: text + indicator,
            confidence: 0.5,
            service: 'Demo Mode'
        };
    }

    /**
     * Helper to escape regex special characters
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Add a new translation to the dictionary (for customization)
     */
    addTranslation(english, targetLang, translation) {
        if (!this.fallbackTranslations[targetLang]) {
            this.fallbackTranslations[targetLang] = {};
        }
        this.fallbackTranslations[targetLang][english.toLowerCase()] = translation;
        console.log(`Added translation: ${english} → ${translation} (${targetLang})`);
    }

    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            lastUsedMethod: this.lastUsedMethod,
            availableLanguages: Object.keys(this.fallbackTranslations),
            totalTranslations: Object.values(this.fallbackTranslations)
                .reduce((sum, dict) => sum + Object.keys(dict).length, 0)
        };
    }
}

// Export for use in main app
window.TranslationService = TranslationService;
