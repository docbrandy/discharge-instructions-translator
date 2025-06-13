/**
 * Medical Data Parser - Fixed to preserve phrases for translation
 */
class MedicalDataParser {
    constructor() {
        this.patterns = {
            medications: /(?:medication|medicine|drug|prescription|take|pills?|tablets?|capsules?)[\s:]*(.+?)(?:\n|\.|\!|\?|$)/gi,
            diagnoses: /(?:diagnosis|diagnosed|condition|disorder)[\s:]*(.+?)(?:\n|\.|\!|\?|$)/gi,
            instructions: /(?:instruction|direction|care|treatment|advice)[\s:]*(.+?)(?:\n|\.|\!|\?|$)/gi,
            followUp: /(?:follow.?up|appointment|visit|see doctor|return)[\s:]*(.+?)(?:\n|\.|\!|\?|$)/gi,
            returnReasons: /(?:return if|seek.? care|emergency|call.? doctor|warning.? signs?)[\s:]*(.+?)(?:\n|\.|\!|\?|$)/gi,
            procedures: /(?:procedure|surgery|operation|treatment performed)[\s:]*(.+?)(?:\n|\.|\!|\?|$)/gi
        };
    }

    /**
     * Parse discharge data into structured format - Fixed to preserve complete sentences
     */
    parseDischargeData(rawData) {
        const result = {
            diagnoses: [],
            medications: [],
            instructions: [],
            followUp: [],
            returnReasons: [],
            procedures: [],
            rawText: rawData
        };

        if (!rawData || typeof rawData !== 'string') {
            return result;
        }

        console.log('Parsing raw data:', rawData);

        // Extract structured data using patterns
        Object.entries(this.patterns).forEach(([category, pattern]) => {
            const matches = [...rawData.matchAll(pattern)];
            matches.forEach(match => {
                if (match[1] && match[1].trim()) {
                    // Clean the matched text but preserve complete phrases
                    const cleanedText = match[1].trim()
                        .replace(/[.;,]+$/, '') // Remove trailing punctuation
                        .replace(/\s+/g, ' '); // Normalize whitespace
                    
                    if (cleanedText && cleanedText.length > 2 && !result[category].includes(cleanedText)) {
                        console.log(`Found ${category}:`, cleanedText);
                        result[category].push(cleanedText);
                    }
                }
            });
        });

        // If no structured data found, extract complete sentences instead of individual words
        if (this.isEmptyResult(result)) {
            console.log('No structured data found, extracting sentences');
            result.instructions = this.extractCompleteSentences(rawData);
        }

        console.log('Parsed result:', result);
        return result;
    }

    /**
     * Extract complete sentences instead of individual words
     */
    extractCompleteSentences(text) {
        // Split by sentences, not by words
        const sentences = text
            .split(/[.!?]+/) // Split on sentence endings
            .map(sentence => sentence.trim()) // Clean whitespace
            .filter(sentence => sentence.length > 5) // Filter out very short fragments
            .filter(sentence => /\w/.test(sentence)) // Must contain at least one word character
            .slice(0, 10); // Limit to first 10 sentences

        console.log('Extracted sentences:', sentences);
        return sentences;
    }

    /**
     * Check if parsing result is empty
     */
    isEmptyResult(result) {
        const categories = ['diagnoses', 'medications', 'instructions', 'followUp', 'returnReasons', 'procedures'];
        return categories.every(cat => result[cat].length === 0);
    }
}

// Test function to verify the parser works correctly
function testMedicalParser() {
    console.log('=== TESTING MEDICAL PARSER ===');
    
    const parser = new MedicalDataParser();
    
    const testTexts = [
        'Take medication twice daily',
        'Patient should take medication twice daily and follow up with doctor',
        'Instructions: Take your medication twice daily. Follow up with doctor in 2 weeks. Return if symptoms worsen.',
        'Care instructions for recovery: Rest, take medication, avoid heavy lifting'
    ];
    
    testTexts.forEach((text, index) => {
        console.log(`\n--- Test ${index + 1}: "${text}" ---`);
        const result = parser.parseDischargeData(text);
        console.log('Result:', result);
    });
}

// Add test button for medical parser
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const testButton = document.createElement('button');
        testButton.textContent = 'Test Parser';
        testButton.onclick = testMedicalParser;
        testButton.style.cssText = 'position: fixed; top: 90px; right: 10px; z-index: 1000; padding: 10px; background: #059669; color: white; border: none; border-radius: 5px; cursor: pointer;';
        document.body.appendChild(testButton);
    });
}
