/**
 * Enhanced Medical Data Parser - Preserves complete sentences for better translation
 */
class MedicalDataParser {
    constructor() {
        // More flexible patterns that capture complete medical instructions
        this.patterns = {
            // Look for complete medication instructions
            medications: [
                /take\s+[\w\s]+(daily|twice|three times|four times|hourly|mg|milligrams)[\w\s.,]*/gi,
                /medication[\s:]*[\w\s]+(daily|twice|three times|four times|hourly|mg|milligrams)[\w\s.,]*/gi,
                /tylenol[\w\s]+(daily|twice|three times|four times|hourly|mg|milligrams)[\w\s.,]*/gi,
                /ibuprofen[\w\s]+(daily|twice|three times|four times|hourly|mg|milligrams)[\w\s.,]*/gi,
                /aspirin[\w\s]+(daily|twice|three times|four times|hourly|mg|milligrams)[\w\s.,]*/gi
            ],
            
            // Medical conditions and diagnoses
            diagnoses: [
                /you have\s+[\w\s]+(fracture|broken|condition|disease|disorder|syndrome)[\w\s.,]*/gi,
                /diagnosed\s+with[\w\s.,]*/gi,
                /condition[\s:]*[\w\s.,]*/gi,
                /fracture[d]?\s+[\w\s.,]*/gi,
                /broken\s+[\w\s.,]*/gi
            ],
            
            // Diet and care instructions
            instructions: [
                /you need to\s+[\w\s.,]*/gi,
                /maintain\s+[\w\s]+(diet|position|activity)[\w\s.,]*/gi,
                /liquid diet[\w\s.,]*/gi,
                /soft diet[\w\s.,]*/gi,
                /care instructions[\s:]*[\w\s.,]*/gi,
                /follow\s+[\w\s.,]*/gi,
                /avoid\s+[\w\s.,]*/gi,
                /do not\s+[\w\s.,]*/gi
            ],
            
            // Follow-up care
            followUp: [
                /follow.?up\s+[\w\s.,]*/gi,
                /return\s+[\w\s]+(weeks?|days?|months?)[\w\s.,]*/gi,
                /see\s+[\w\s]+(doctor|physician|specialist)[\w\s.,]*/gi,
                /appointment[\w\s.,]*/gi,
                /schedule[\w\s.,]*/gi
            ],
            
            // Emergency/return reasons
            returnReasons: [
                /return\s+if[\w\s.,]*/gi,
                /call\s+[\w\s]+(doctor|911|emergency)[\w\s.,]*/gi,
                /seek\s+[\w\s]+(care|attention|help)[\w\s.,]*/gi,
                /emergency[\w\s.,]*/gi,
                /go to\s+[\w\s]+(hospital|emergency)[\w\s.,]*/gi
            ],
            
            // Procedures
            procedures: [
                /procedure[\s:]*[\w\s.,]*/gi,
                /surgery[\s:]*[\w\s.,]*/gi,
                /operation[\s:]*[\w\s.,]*/gi,
                /treatment performed[\s:]*[\w\s.,]*/gi
            ]
        };
    }

    /**
     * Parse discharge data into structured format
     */
    parseDischargeData(rawData) {
        console.log('=== MEDICAL PARSER DEBUG ===');
        console.log('Raw input:', rawData);
        
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
            console.log('Invalid input data');
            return result;
        }

        // Clean the input text
        const cleanedData = rawData.trim();
        
        // Extract structured data using enhanced patterns
        Object.entries(this.patterns).forEach(([category, patternArray]) => {
            console.log(`\nProcessing category: ${category}`);
            
            patternArray.forEach((pattern, index) => {
                const matches = [...cleanedData.matchAll(pattern)];
                console.log(`Pattern ${index + 1} found ${matches.length} matches`);
                
                matches.forEach(match => {
                    const fullMatch = match[0];
                    if (fullMatch && fullMatch.trim().length > 5) {
                        // Clean the matched text while preserving the complete instruction
                        let cleanedText = fullMatch.trim()
                            .replace(/[.;]+$/, '') // Remove trailing punctuation
                            .replace(/\s+/g, ' ') // Normalize whitespace
                            .replace(/^(take|you need to|you have|follow up|return if|call|seek)/i, (match) => {
                                // Capitalize first word properly
                                return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
                            });
                        
                        // Only add if not already present and meets quality criteria
                        if (cleanedText.length > 5 && 
                            !result[category].includes(cleanedText) &&
                            !this.isDuplicate(cleanedText, result[category])) {
                            
                            console.log(`Added to ${category}:`, cleanedText);
                            result[category].push(cleanedText);
                        }
                    }
                });
            });
        });

        // If no structured data found, try sentence-based extraction
        if (this.isEmptyResult(result)) {
            console.log('No structured patterns found, using sentence extraction');
            result.instructions = this.extractSentencesAsMedicalInstructions(cleanedData);
        }

        // Final cleanup - ensure we have meaningful content
        this.cleanupResult(result);
        
        console.log('Final parsed result:', result);
        return result;
    }

    /**
     * Extract sentences as medical instructions when structured parsing fails
     */
    extractSentencesAsMedicalInstructions(text) {
        console.log('Extracting sentences from:', text);
        
        // Split by sentences and clean them up
        const sentences = text
            .split(/[.!?]+/) // Split on sentence endings
            .map(sentence => sentence.trim()) // Clean whitespace
            .filter(sentence => sentence.length > 10) // Filter out very short fragments
            .filter(sentence => /\w{3,}/.test(sentence)) // Must contain substantial words
            .map(sentence => {
                // Capitalize first letter
                return sentence.charAt(0).toUpperCase() + sentence.slice(1).toLowerCase();
            })
            .slice(0, 8); // Limit to first 8 sentences

        console.log('Extracted sentences:', sentences);
        return sentences;
    }

    /**
     * Check if a text is a duplicate of existing entries
     */
    isDuplicate(newText, existingArray) {
        const newTextLower = newText.toLowerCase();
        return existingArray.some(existing => {
            const existingLower = existing.toLowerCase();
            // Check for substantial overlap
            return existingLower.includes(newTextLower) || 
                   newTextLower.includes(existingLower) ||
                   this.calculateSimilarity(newTextLower, existingLower) > 0.8;
        });
    }

    /**
     * Calculate similarity between two strings
     */
    calculateSimilarity(str1, str2) {
        const words1 = str1.split(/\s+/);
        const words2 = str2.split(/\s+/);
        const intersection = words1.filter(word => words2.includes(word));
        return intersection.length / Math.max(words1.length, words2.length);
    }

    /**
     * Check if parsing result is empty
     */
    isEmptyResult(result) {
        const categories = ['diagnoses', 'medications', 'instructions', 'followUp', 'returnReasons', 'procedures'];
        return categories.every(cat => result[cat].length === 0);
    }

    /**
     * Clean up the final result
     */
    cleanupResult(result) {
        Object.keys(result).forEach(category => {
            if (Array.isArray(result[category])) {
                // Remove very short or meaningless entries
                result[category] = result[category]
                    .filter(item => item && item.length > 5)
                    .filter(item => !/^(and|or|but|the|a|an)$/i.test(item.trim()))
                    .slice(0, 10); // Limit each category to 10 items max
            }
        });
    }

    /**
     * Get parsing statistics for debugging
     */
    getParsingStats(result) {
        const stats = {};
        Object.keys(result).forEach(category => {
            if (Array.isArray(result[category])) {
                stats[category] = result[category].length;
            }
        });
        return stats;
    }
}

// Test function for the enhanced parser
function testEnhancedMedicalParser() {
    console.log('=== TESTING ENHANCED MEDICAL PARSER ===');
    
    const parser = new MedicalDataParser();
    
    const testCases = [
        {
            name: "Simple medication instruction",
            text: "Take tylenol by mouth three times daily"
        },
        {
            name: "Complex discharge instructions", 
            text: "you have a fractured mandible. Take tylenol by mouth three times daily. You need to maintain a full liquid diet"
        },
        {
            name: "Multiple instructions",
            text: "Take medication twice daily with food. Follow up with doctor in 2 weeks. Return if pain worsens or fever develops. Avoid hard foods."
        },
        {
            name: "Structured format",
            text: "Diagnosis: Hypertension. Medications: Lisinopril 10mg daily. Instructions: Monitor blood pressure daily. Follow up in 4 weeks."
        }
    ];
    
    testCases.forEach((testCase, index) => {
        console.log(`\n--- Test ${index + 1}: ${testCase.name} ---`);
        console.log(`Input: "${testCase.text}"`);
        const result = parser.parseDischargeData(testCase.text);
        console.log('Categories found:', parser.getParsingStats(result));
        
        // Show non-empty categories
        Object.entries(result).forEach(([category, items]) => {
            if (Array.isArray(items) && items.length > 0) {
                console.log(`${category}:`, items);
            }
        });
    });
    
    console.log('\n=== END PARSER TESTS ===');
}

// Export for use in main app
window.MedicalDataParser = MedicalDataParser;

// Add enhanced test button
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Remove old test button if it exists
        const oldButton = document.querySelector('[data-test="parser"]');
        if (oldButton) oldButton.remove();
        
        const testButton = document.createElement('button');
        testButton.textContent = 'Test Enhanced Parser';
        testButton.setAttribute('data-test', 'parser');
        testButton.onclick = testEnhancedMedicalParser;
        testButton.style.cssText = `
            position: fixed; 
            top: 130px; 
            right: 10px; 
            z-index: 1000; 
            padding: 10px 15px; 
            background: #059669; 
            color: white; 
            border: none; 
            border-radius: 5px; 
            cursor: pointer;
            font-size: 12px;
        `;
        document.body.appendChild(testButton);
    });
}
