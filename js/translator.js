/**
 * Translation Service - Fixed version with better debugging
 */
class TranslationService {
    constructor() {
        this.fallbackTranslations = {
            'es': {
   /**
 * Translation Service - Fixed version with better debugging
 */
class TranslationService {
    constructor() {
        this.fallbackTranslations = {
            'es': {
                // Complete medical phrases first (most specific)
                'Take medication twice daily': 'Toma medicamento dos veces al día',
                'tylenol 1000 milligrams three times daily for pain': 'tylenol 1000 miligramos tres veces al día para el dolor',
                'three times daily for pain': 'tres veces al día para el dolor',
                'by mouth every 8 hours as needed for pain': 'por vía oral cada 8 horas según sea necesario para el dolor',
                'every 8 hours as needed': 'cada 8 horas según sea necesario',
                'as needed for pain': 'según sea necesario para el dolor',
                'take as needed': 'tomar según sea necesario',
                'by mouth': 'por vía oral',
                'for pain': 'para el dolor',
                'as needed': 'según sea necesario',
                'every 8 hours': 'cada 8 horas',
                'three times daily': 'tres veces al día',
                'twice daily': 'dos veces al día',
                'once daily': 'una vez al día',
                'four times daily': 'cuatro veces al día',
                
                // Common medical instructions
                'Take medication': 'Toma medicamento',
                'Follow up with doctor': 'Seguimiento con el doctor',
                'Return if symptoms worsen': 'Regrese si los síntomas empeoran',
                'Call your doctor': 'Llama a tu doctor',
                'Go to emergency room': 'Ve a la sala de emergencias',
                'with food': 'con comida',
                'before meals': 'antes de las comidas',
                'after meals': 'después de las comidas',
                'at bedtime': 'al acostarse',
                'on empty stomach': 'con el estómago vacío',
                'do not crush': 'no triturar',
                'do not chew': 'no masticar',
                'swallow whole': 'tragar entero',
                
                // Medical terms and units
                'tylenol': 'tylenol',
                'ibuprofen': 'ibuprofeno',
                'aspirin': 'aspirina',
                'acetaminophen': 'acetaminofén',
                'milligrams': 'miligramos',
                'mg': 'mg',
                'tablets': 'tabletas',
                'capsules': 'cápsulas',
                'pills': 'pastillas',
                'medication': 'medicamento',
                'medicine': 'medicina',
                'prescription': 'receta médica',
                'dose': 'dosis',
                'dosage': 'dosificación',
                
                // Body parts and symptoms
                'pain': 'dolor',
                'fever': 'fiebre',
                'headache': 'dolor de cabeza',
                'nausea': 'náusea',
                'dizziness': 'mareo',
                'chest pain': 'dolor en el pecho',
                'shortness of breath': 'falta de aire',
                'swelling': 'hinchazón',
                'rash': 'sarpullido',
                'infection': 'infección',
                'bleeding': 'sangrado',
                
                // Medical professionals and places
                'doctor': 'doctor',
                'physician': 'médico',
                'nurse': 'enfermera',
                'pharmacist': 'farmacéutico',
                'hospital': 'hospital',
                'clinic': 'clínica',
                'emergency room': 'sala de emergencias',
                'pharmacy': 'farmacia',
                'appointment': 'cita',
                'visit': 'visita',
                
                // Time expressions
                'hours': 'horas',
                'days': 'días',
                'weeks': 'semanas',
                'months': 'meses',
                'minutes': 'minutos',
                'morning': 'mañana',
                'afternoon': 'tarde',
                'evening': 'noche',
                'night': 'noche',
                'daily': 'diario',
                'weekly': 'semanal',
                'monthly': 'mensual',
                
                // Action words
                'take': 'toma',
                'swallow': 'traga',
                'chew': 'mastica',
                'dissolve': 'disuelve',
                'apply': 'aplica',
                'insert': 'inserta',
                'inject': 'inyecta',
                'call': 'llama',
                'contact': 'contacta',
                'return': 'regresa',
                'visit': 'visita',
                'schedule': 'programa',
                'continue': 'continúa',
                'stop': 'para',
                'avoid': 'evita',
                'limit': 'limita',
                'increase': 'aumenta',
                'decrease': 'disminuye',
                
                // Common words
                'and': 'y',
                'or': 'o',
                'but': 'pero',
                'if': 'si',
                'when': 'cuando',
                'until': 'hasta',
                'before': 'antes',
                'after': 'después',
                'during': 'durante',
                'with': 'con',
                'without': 'sin',
                'for': 'para',
                'from': 'de',
                'to': 'a',
                'in': 'en',
                'on': 'en',
                'at': 'en'
            },
            'fr': {
                'Take medication': 'Prendre des médicaments',
                'medication': 'médicament',
                'doctor': 'médecin',
                'appointment': 'rendez-vous',
                'Follow up': 'Suivi',
                'Rest': 'Repos',
                'Return if symptoms worsen': 'Revenir si les symptômes s\'aggravent'
            }
        };
        
        // Track which translation method worked
        this.lastUsedMethod = 'none';
    }

    /**
     * Main translation method with enhanced debugging
     */
    async translate(text, targetLang, sourceLang = 'en') {
        console.log('=== TRANSLATION DEBUG ===');
        console.log('Input text:', text);
        console.log('Target language:', targetLang);
        console.log('Source language:', sourceLang);
        
        if (targetLang === sourceLang) {
            console.log('Same language, returning original');
            return {
                translatedText: text,
                confidence: 1.0,
                service: 'none',
                originalText: text
            };
        }

        // Try multiple translation methods in order
        const methods = [
            () => this.translateWithLibreTranslate(text, targetLang, sourceLang),
            () => this.translateWithEnhancedFallback(text, targetLang),
            () => this.translateWithDemo(text, targetLang)
        ];

        for (let i = 0; i < methods.length; i++) {
            try {
                console.log(`Trying translation method ${i + 1}...`);
                const result = await methods[i]();
                console.log('Translation successful:', result);
                return result;
            } catch (error) {
                console.warn(`Translation method ${i + 1} failed:`, error.message);
            }
        }

        // If all methods fail, return demo mode
        console.log('All translation methods failed, using demo mode');
        return this.translateWithDemo(text, targetLang);
    }

    /**
     * LibreTranslate with multiple endpoint fallbacks
     */
    async translateWithLibreTranslate(text, targetLang, sourceLang) {
        const textsToTranslate = Array.isArray(text) ? text : [text];
        const translations = [];

        // Try multiple LibreTranslate endpoints
        const endpoints = [
            'https://libretranslate.com/translate',  // Official hosted
            'https://libretranslate.de/translate'    // Alternative
        ];

        let lastError = null;

        for (const endpoint of endpoints) {
            try {
                console.log(`Trying LibreTranslate endpoint: ${endpoint}`);
                
                for (const textItem of textsToTranslate) {
                    if (!textItem || textItem.trim().length === 0) {
                        translations.push(textItem);
                        continue;
                    }

                    const requestBody = {
                        q: textItem.trim(),
                        source: sourceLang,
                        target: targetLang,
                        format: 'text'
                    };

                    console.log('Request body:', requestBody);

                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestBody)
                    });

                    console.log('Response status:', response.status);

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.log('Response error:', errorText);
                        throw new Error(`LibreTranslate API error: ${response.status} - ${errorText}`);
                    }

                    const data = await response.json();
                    console.log('Response data:', data);
                    
                    if (data.error) {
                        throw new Error(`LibreTranslate error: ${data.error}`);
                    }
                    
                    translations.push(data.translatedText || textItem);
                }

                // If we get here, translation was successful
                this.lastUsedMethod = 'LibreTranslate';
                return {
                    translatedText: Array.isArray(text) ? translations : translations[0],
                    confidence: 0.8,
                    service: `LibreTranslate (${endpoint})`
                };

            } catch (error) {
                console.warn(`Endpoint ${endpoint} failed:`, error.message);
                lastError = error;
                translations.length = 0; // Reset translations for next endpoint
            }
        }

        throw lastError || new Error('All LibreTranslate endpoints failed');
    }

    /**
     * Enhanced fallback with better Spanish translations
     */
    translateWithEnhancedFallback(text, targetLang) {
        console.log('Using enhanced fallback translation');
        
        const textsToTranslate = Array.isArray(text) ? text : [text];
        const fallbackDict = this.fallbackTranslations[targetLang] || {};
        
        const translations = textsToTranslate.map(textItem => {
            let translated = textItem;
            console.log('Translating:', textItem);
            
            // Sort dictionary entries by length (longest first for better phrase matching)
            const sortedEntries = Object.entries(fallbackDict).sort((a, b) => b[0].length - a[0].length);
            
            // Replace known phrases and words (case insensitive)
            sortedEntries.forEach(([english, foreign]) => {
                // Try exact phrase matches first
                const exactRegex = new RegExp(`\\b${this.escapeRegex(english)}\\b`, 'gi');
                const beforeReplace = translated;
                translated = translated.replace(exactRegex, foreign);
                
                if (translated !== beforeReplace) {
                    console.log(`Replaced "${english}" with "${foreign}"`);
                }
            });
            
            console.log('Final translation:', translated);
            return translated;
        });

        this.lastUsedMethod = 'Enhanced Fallback';
        return {
            translatedText: Array.isArray(text) ? translations : translations[0],
            confidence: 0.6,
            service: 'Enhanced Fallback Translation'
        };
    }

    /**
     * Demo translation (adds language indicators)
     */
    translateWithDemo(text, targetLang) {
        console.log('Using demo translation mode');
        
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
        
        this.lastUsedMethod = 'Demo Mode';
        
        if (Array.isArray(text)) {
            return {
                translatedText: text.map(t => t + suffix),
                confidence: 0.85,
                service: 'Demo Mode',
                originalText: text
            };
        } else {
            return {
                translatedText: text + suffix,
                confidence: 0.85,
                service: 'Demo Mode',
                originalText: text
            };
        }
    }

    /**
     * Helper method to escape special regex characters
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Get translation service status for debugging
     */
    getDebugInfo() {
        return {
            lastUsedMethod: this.lastUsedMethod,
            availableFallbackLanguages: Object.keys(this.fallbackTranslations),
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Test translation function for debugging
 */
async function testTranslation() {
    console.log('=== TESTING TRANSLATION SERVICE ===');
    
    const translator = new TranslationService();
    
    const testTexts = [
        'Take medication twice daily',
        'Follow up with doctor in 2 weeks',
        'Return if symptoms worsen'
    ];
    
    for (const testText of testTexts) {
        console.log(`\n--- Testing: "${testText}" ---`);
        
        try {
            const result = await translator.translate(testText, 'es', 'en');
            console.log('SUCCESS:', result);
        } catch (error) {
            console.error('FAILED:', error);
        }
    }
    
    console.log('\nDebug info:', translator.getDebugInfo());
}

// Add test button for debugging
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const testButton = document.createElement('button');
        testButton.textContent = 'Test Translation';
        testButton.onclick = testTranslation;
        testButton.style.cssText = 'position: fixed; top: 50px; right: 10px; z-index: 1000; padding: 10px; background: #dc2626; color: white; border: none; border-radius: 5px; cursor: pointer;';
        document.body.appendChild(testButton);
    });
}

    /**
     * Main translation method with enhanced debugging
     */
    async translate(text, targetLang, sourceLang = 'en') {
        console.log('=== TRANSLATION DEBUG ===');
        console.log('Input text:', text);
        console.log('Target language:', targetLang);
        console.log('Source language:', sourceLang);
        
        if (targetLang === sourceLang) {
            console.log('Same language, returning original');
            return {
                translatedText: text,
                confidence: 1.0,
                service: 'none',
                originalText: text
            };
        }

        // Try multiple translation methods in order
        const methods = [
            () => this.translateWithLibreTranslate(text, targetLang, sourceLang),
            () => this.translateWithEnhancedFallback(text, targetLang),
            () => this.translateWithDemo(text, targetLang)
        ];

        for (let i = 0; i < methods.length; i++) {
            try {
                console.log(`Trying translation method ${i + 1}...`);
                const result = await methods[i]();
                console.log('Translation successful:', result);
                return result;
            } catch (error) {
                console.warn(`Translation method ${i + 1} failed:`, error.message);
            }
        }

        // If all methods fail, return demo mode
        console.log('All translation methods failed, using demo mode');
        return this.translateWithDemo(text, targetLang);
    }

    /**
     * LibreTranslate with multiple endpoint fallbacks
     */
    async translateWithLibreTranslate(text, targetLang, sourceLang) {
        const textsToTranslate = Array.isArray(text) ? text : [text];
        const translations = [];

        // Try multiple LibreTranslate endpoints
        const endpoints = [
            'https://libretranslate.com/translate',  // Official hosted
            'https://libretranslate.de/translate'    // Alternative
        ];

        let lastError = null;

        for (const endpoint of endpoints) {
            try {
                console.log(`Trying LibreTranslate endpoint: ${endpoint}`);
                
                for (const textItem of textsToTranslate) {
                    if (!textItem || textItem.trim().length === 0) {
                        translations.push(textItem);
                        continue;
                    }

                    const requestBody = {
                        q: textItem.trim(),
                        source: sourceLang,
                        target: targetLang,
                        format: 'text'
                    };

                    console.log('Request body:', requestBody);

                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestBody)
                    });

                    console.log('Response status:', response.status);

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.log('Response error:', errorText);
                        throw new Error(`LibreTranslate API error: ${response.status} - ${errorText}`);
                    }

                    const data = await response.json();
                    console.log('Response data:', data);
                    
                    if (data.error) {
                        throw new Error(`LibreTranslate error: ${data.error}`);
                    }
                    
                    translations.push(data.translatedText || textItem);
                }

                // If we get here, translation was successful
                this.lastUsedMethod = 'LibreTranslate';
                return {
                    translatedText: Array.isArray(text) ? translations : translations[0],
                    confidence: 0.8,
                    service: `LibreTranslate (${endpoint})`
                };

            } catch (error) {
                console.warn(`Endpoint ${endpoint} failed:`, error.message);
                lastError = error;
                translations.length = 0; // Reset translations for next endpoint
            }
        }

        throw lastError || new Error('All LibreTranslate endpoints failed');
    }

    /**
     * Enhanced fallback with better Spanish translations
     */
    translateWithEnhancedFallback(text, targetLang) {
        console.log('Using enhanced fallback translation');
        
        const textsToTranslate = Array.isArray(text) ? text : [text];
        const fallbackDict = this.fallbackTranslations[targetLang] || {};
        
        const translations = textsToTranslate.map(textItem => {
            let translated = textItem;
            console.log('Translating:', textItem);
            
            // Sort dictionary entries by length (longest first for better phrase matching)
            const sortedEntries = Object.entries(fallbackDict).sort((a, b) => b[0].length - a[0].length);
            
            // Replace known phrases and words (case insensitive)
            sortedEntries.forEach(([english, foreign]) => {
                // Try exact phrase matches first
                const exactRegex = new RegExp(`\\b${this.escapeRegex(english)}\\b`, 'gi');
                const beforeReplace = translated;
                translated = translated.replace(exactRegex, foreign);
                
                if (translated !== beforeReplace) {
                    console.log(`Replaced "${english}" with "${foreign}"`);
                }
            });
            
            console.log('Final translation:', translated);
            return translated;
        });

        this.lastUsedMethod = 'Enhanced Fallback';
        return {
            translatedText: Array.isArray(text) ? translations : translations[0],
            confidence: 0.6,
            service: 'Enhanced Fallback Translation'
        };
    }

    /**
     * Demo translation (adds language indicators)
     */
    translateWithDemo(text, targetLang) {
        console.log('Using demo translation mode');
        
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
        
        this.lastUsedMethod = 'Demo Mode';
        
        if (Array.isArray(text)) {
            return {
                translatedText: text.map(t => t + suffix),
                confidence: 0.85,
                service: 'Demo Mode',
                originalText: text
            };
        } else {
            return {
                translatedText: text + suffix,
                confidence: 0.85,
                service: 'Demo Mode',
                originalText: text
            };
        }
    }

    /**
     * Helper method to escape special regex characters
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Get translation service status for debugging
     */
    getDebugInfo() {
        return {
            lastUsedMethod: this.lastUsedMethod,
            availableFallbackLanguages: Object.keys(this.fallbackTranslations),
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Test translation function for debugging
 */
async function testTranslation() {
    console.log('=== TESTING TRANSLATION SERVICE ===');
    
    const translator = new TranslationService();
    
    const testTexts = [
        'Take medication twice daily',
        'Follow up with doctor in 2 weeks',
        'Return if symptoms worsen'
    ];
    
    for (const testText of testTexts) {
        console.log(`\n--- Testing: "${testText}" ---`);
        
        try {
            const result = await translator.translate(testText, 'es', 'en');
            console.log('SUCCESS:', result);
        } catch (error) {
            console.error('FAILED:', error);
        }
    }
    
    console.log('\nDebug info:', translator.getDebugInfo());
}

// Add test button for debugging
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const testButton = document.createElement('button');
        testButton.textContent = 'Test Translation';
        testButton.onclick = testTranslation;
        testButton.style.cssText = 'position: fixed; top: 50px; right: 10px; z-index: 1000; padding: 10px; background: #dc2626; color: white; border: none; border-radius: 5px; cursor: pointer;';
        document.body.appendChild(testButton);
    });
}
