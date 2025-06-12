/**
 * Advanced Medical Data Parser for Discharge Instructions
 * Handles structured and unstructured medical data
 */

class MedicalDataParser {
    constructor() {
        this.medicalTerms = this.initializeMedicalTerms();
        this.sectionPatterns = this.initializeSectionPatterns();
        this.medicationPatterns = this.initializeMedicationPatterns();
        this.dosagePatterns = this.initializeDosagePatterns();
    }

    /**
     * Main parsing method - handles multiple input formats
     * @param {string} rawData - Raw discharge data (JSON, XML, or plain text)
     * @returns {Object} Structured medical data
     */
    parseDischargeData(rawData) {
        try {
            // Try to parse as JSON first (structured QR codes)
            if (this.isJsonString(rawData)) {
                return this.parseStructuredData(JSON.parse(rawData));
            }

            // Try to parse as XML (some EMR systems use XML)
            if (this.isXmlString(rawData)) {
                return this.parseXmlData(rawData);
            }

            // Parse as unstructured text
            return this.parseUnstructuredText(rawData);

        } catch (error) {
            console.error('Error parsing discharge data:', error);
            // Fallback to basic text parsing
            return this.parseUnstructuredText(rawData);
        }
    }

    /**
     * Parse structured JSON data (ideal format)
     */
    parseStructuredData(data) {
        const result = {
            patientInfo: {},
            diagnoses: [],
            medications: [],
            instructions: [],
            returnReasons: [],
            followUp: [],
            procedures: [],
            vitalSigns: [],
            allergies: [],
            dischargeDate: null,
            admissionDate: null,
            attendingPhysician: null,
            facilityInfo: {}
        };

        // Map common field variations
        const fieldMappings = {
            diagnoses: ['diagnoses', 'diagnosis', 'conditions', 'medical_conditions', 'primary_diagnosis', 'secondary_diagnosis'],
            medications: ['medications', 'prescriptions', 'drugs', 'medicine', 'rx'],
            instructions: ['instructions', 'care_instructions', 'home_care', 'discharge_instructions', 'patient_instructions'],
            returnReasons: ['return_reasons', 'when_to_return', 'red_flags', 'warning_signs', 'emergency_signs'],
            followUp: ['follow_up', 'followup', 'appointments', 'next_visit', 'follow_up_care'],
            procedures: ['procedures', 'treatments', 'interventions', 'operations', 'surgery'],
            allergies: ['allergies', 'adverse_reactions', 'drug_allergies'],
            vitalSigns: ['vitals', 'vital_signs', 'signs']
        };

        // Extract data using field mappings
        Object.keys(fieldMappings).forEach(resultKey => {
            fieldMappings[resultKey].forEach(possibleKey => {
                if (data[possibleKey] && (!result[resultKey] || result[resultKey].length === 0)) {
                    result[resultKey] = this.normalizeArray(data[possibleKey]);
                }
            });
        });

        // Extract patient information
        if (data.patient || data.patient_info || data.demographics) {
            const patientData = data.patient || data.patient_info || data.demographics;
            result.patientInfo = {
                name: patientData.name || patientData.patient_name || '',
                dob: patientData.dob || patientData.date_of_birth || '',
                mrn: patientData.mrn || patientData.medical_record_number || '',
                age: patientData.age || '',
                gender: patientData.gender || patientData.sex || ''
            };
        }

        // Extract dates
        result.dischargeDate = data.discharge_date || data.dischargeDate || null;
        result.admissionDate = data.admission_date || data.admissionDate || null;
        result.attendingPhysician = data.attending_physician || data.doctor || data.physician || null;

        // Extract facility information
        if (data.facility || data.hospital || data.clinic) {
            const facilityData = data.facility || data.hospital || data.clinic;
            result.facilityInfo = {
                name: facilityData.name || '',
                address: facilityData.address || '',
                phone: facilityData.phone || '',
                department: facilityData.department || ''
            };
        }

        return this.enhanceStructuredData(result);
    }

    /**
     * Parse XML data (some EMR systems)
     */
    parseXmlData(xmlString) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
        
        const result = {
            diagnoses: [],
            medications: [],
            instructions: [],
            returnReasons: [],
            followUp: [],
            procedures: [],
            vitalSigns: [],
            allergies: [],
            patientInfo: {},
            facilityInfo: {}
        };

        // Extract diagnoses
        const diagnoses = xmlDoc.querySelectorAll('diagnosis, condition, problem');
        diagnoses.forEach(diag => {
            const code = diag.getAttribute('code') || '';
            const description = diag.textContent || diag.getAttribute('description') || '';
            if (description) {
                result.diagnoses.push(`${description}${code ? ` (${code})` : ''}`);
            }
        });

        // Extract medications
        const medications = xmlDoc.querySelectorAll('medication, drug, prescription');
        medications.forEach(med => {
            const name = med.querySelector('name')?.textContent || med.getAttribute('name') || '';
            const dosage = med.querySelector('dosage')?.textContent || med.getAttribute('dosage') || '';
            const frequency = med.querySelector('frequency')?.textContent || med.getAttribute('frequency') || '';
            const instructions = med.querySelector('instructions')?.textContent || '';
            
            if (name) {
                let medString = name;
                if (dosage) medString += ` ${dosage}`;
                if (frequency) medString += ` ${frequency}`;
                if (instructions) medString += ` - ${instructions}`;
                result.medications.push(medString);
            }
        });

        // Extract instructions
        const instructions = xmlDoc.querySelectorAll('instruction, care-instruction, discharge-instruction');
        instructions.forEach(inst => {
            const text = inst.textContent?.trim();
            if (text) result.instructions.push(text);
        });

        // If no specific sections found, parse as unstructured text
        if (Object.values(result).every(arr => Array.isArray(arr) ? arr.length === 0 : !arr)) {
            const textContent = xmlDoc.documentElement?.textContent || xmlString;
            return this.parseUnstructuredText(textContent);
        }

        return this.enhanceStructuredData(result);
    }

    /**
     * Parse unstructured text using pattern recognition
     */
    parseUnstructuredText(text) {
        const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
        
        const result = {
            diagnoses: [],
            medications: [],
            instructions: [],
            returnReasons: [],
            followUp: [],
            procedures: [],
            vitalSigns: [],
            allergies: [],
            patientInfo: {},
            facilityInfo: {}
        };

        let currentSection = 'instructions'; // Default section
        let buffer = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lowerLine = line.toLowerCase();

            // Detect section headers
            const detectedSection = this.detectSectionType(lowerLine);
            if (detectedSection && detectedSection !== currentSection) {
                // Process previous buffer
                if (buffer.length > 0) {
                    this.addToSection(result, currentSection, buffer);
                    buffer = [];
                }
                currentSection = detectedSection;
                
                // Check if this line contains content beyond the header
                const contentAfterHeader = this.extractContentAfterHeader(line, lowerLine);
                if (contentAfterHeader) {
                    buffer.push(contentAfterHeader);
                }
            } else {
                // Add line to current buffer
                buffer.push(line);
            }
        }

        // Process final buffer
        if (buffer.length > 0) {
            this.addToSection(result, currentSection, buffer);
        }

        // Post-process to extract specific medical information
        this.extractMedicalDetails(result, text);

        return this.enhanceStructuredData(result);
    }

    /**
     * Detect what type of medical section a line represents
     */
    detectSectionType(lowerLine) {
        for (const [section, patterns] of Object.entries(this.sectionPatterns)) {
            for (const pattern of patterns) {
                if (pattern.test(lowerLine)) {
                    return section;
                }
            }
        }
        return null;
    }

    /**
     * Extract content that appears after a section header on the same line
     */
    extractContentAfterHeader(originalLine, lowerLine) {
        const colonIndex = originalLine.indexOf(':');
        if (colonIndex !== -1 && colonIndex < originalLine.length - 1) {
            return originalLine.substring(colonIndex + 1).trim();
        }
        return null;
    }

    /**
     * Add processed content to the appropriate section
     */
    addToSection(result, section, buffer) {
        const content = buffer.join(' ').trim();
        if (!content) return;

        if (section === 'medications') {
            // Special processing for medications
            const medications = this.parseMedications(content);
            result.medications.push(...medications);
        } else if (section === 'procedures') {
            // Special processing for procedures
            const procedures = this.parseProcedures(content);
            result.procedures.push(...procedures);
        } else {
            // Split by common delimiters for lists
            const items = this.splitIntoItems(content);
            result[section].push(...items);
        }
    }

    /**
     * Parse medication information with dosages and instructions
     */
    parseMedications(text) {
        const medications = [];
        const lines = text.split(/[;,\n]/).map(line => line.trim()).filter(line => line);

        for (const line of lines) {
            const medication = this.parseSingleMedication(line);
            if (medication) {
                medications.push(medication);
            }
        }

        return medications.length > 0 ? medications : [text]; // Fallback to original text
    }

    /**
     * Parse a single medication entry
     */
    parseSingleMedication(text) {
        // Look for medication patterns
        for (const pattern of this.medicationPatterns) {
            const match = text.match(pattern);
            if (match) {
                const name = match[1]?.trim();
                const dosage = match[2]?.trim();
                const frequency = match[3]?.trim();
                const instructions = match[4]?.trim();

                let result = name;
                if (dosage) result += ` ${dosage}`;
                if (frequency) result += ` ${frequency}`;
                if (instructions) result += ` - ${instructions}`;

                return result;
            }
        }

        // If no pattern matches, check if it looks like a medication
        if (this.looksMedication(text)) {
            return text;
        }

        return null;
    }

    /**
     * Check if text looks like a medication entry
     */
    looksMedication(text) {
        const medIndicators = [
            /\d+\s*(mg|mcg|g|ml|tablets?|pills?|capsules?)/i,
            /\b(take|tablet|pill|capsule|liquid|injection|cream|ointment)\b/i,
            /\b(daily|twice|once|every|hours?|times?|bid|tid|qid|prn)\b/i,
            /\b(lisinopril|metformin|atorvastatin|amlodipine|levothyroxine|ibuprofen|acetaminophen)\b/i
        ];

        return medIndicators.some(pattern => pattern.test(text));
    }

    /**
     * Parse procedure information
     */
    parseProcedures(text) {
        const procedures = [];
        const commonProcedures = [
            /\b(surgery|operation|procedure|intervention|treatment)\b/i,
            /\b(x-ray|ct scan|mri|ultrasound|ekg|echocardiogram)\b/i,
            /\b(biopsy|endoscopy|colonoscopy|bronchoscopy)\b/i,
            /\b(catheterization|angioplasty|stent|bypass)\b/i
        ];

        const lines = this.splitIntoItems(text);
        for (const line of lines) {
            if (commonProcedures.some(pattern => pattern.test(line))) {
                procedures.push(line);
            }
        }

        return procedures.length > 0 ? procedures : [text];
    }

    /**
     * Split text into individual items based on common delimiters
     */
    splitIntoItems(text) {
        // Split by various delimiters commonly used in medical documentation
        const delimiters = /[;,\n•\-\*\d+\.\s*]/;
        return text.split(delimiters)
            .map(item => item.trim())
            .filter(item => item.length > 3); // Filter out very short items
    }

    /**
     * Extract specific medical details from the full text
     */
    extractMedicalDetails(result, fullText) {
        // Extract vital signs
        this.extractVitalSigns(result, fullText);
        
        // Extract allergies
        this.extractAllergies(result, fullText);
        
        // Extract patient demographics if mentioned
        this.extractPatientInfo(result, fullText);
        
        // Extract dates
        this.extractDates(result, fullText);
    }

    /**
     * Extract vital signs from text
     */
    extractVitalSigns(result, text) {
        const vitalPatterns = [
            /blood pressure:?\s*(\d+\/\d+)/gi,
            /bp:?\s*(\d+\/\d+)/gi,
            /heart rate:?\s*(\d+)/gi,
            /hr:?\s*(\d+)/gi,
            /pulse:?\s*(\d+)/gi,
            /temperature:?\s*(\d+\.?\d*)\s*°?[cf]?/gi,
            /temp:?\s*(\d+\.?\d*)\s*°?[cf]?/gi,
            /oxygen saturation:?\s*(\d+)%?/gi,
            /o2 sat:?\s*(\d+)%?/gi,
            /respiratory rate:?\s*(\d+)/gi,
            /rr:?\s*(\d+)/gi
        ];

        for (const pattern of vitalPatterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                result.vitalSigns.push(match[0]);
            }
        }
    }

    /**
     * Extract allergy information
     */
    extractAllergies(result, text) {
        const allergyPatterns = [
            /allergies?:?\s*([^.\n]+)/gi,
            /allergic to:?\s*([^.\n]+)/gi,
            /drug allergies?:?\s*([^.\n]+)/gi,
            /adverse reactions?:?\s*([^.\n]+)/gi,
            /nka|nkda/gi // No known allergies/drug allergies
        ];

        for (const pattern of allergyPatterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const allergyText = match[1] ? match[1].trim() : match[0];
                if (allergyText && !result.allergies.includes(allergyText)) {
                    result.allergies.push(allergyText);
                }
            }
        }
    }

    /**
     * Extract patient demographic information
     */
    extractPatientInfo(result, text) {
        const patterns = {
            age: /age:?\s*(\d+)/gi,
            gender: /(?:gender|sex):?\s*(male|female|m|f)\b/gi,
            mrn: /(?:mrn|medical record number):?\s*([a-z0-9]+)/gi,
            dob: /(?:dob|date of birth|born):?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi
        };

        Object.entries(patterns).forEach(([key, pattern]) => {
            const match = pattern.exec(text);
            if (match && match[1]) {
                result.patientInfo[key] = match[1].trim();
            }
        });
    }

    /**
     * Extract important dates
     */
    extractDates(result, text) {
        const datePatterns = [
            /discharge date:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
            /admission date:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
            /discharged on:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
            /admitted on:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi
        ];

        datePatterns.forEach(pattern => {
            const match = pattern.exec(text);
            if (match && match[1]) {
                const dateStr = match[1].trim();
                if (pattern.source.includes('discharge')) {
                    result.dischargeDate = dateStr;
                } else if (pattern.source.includes('admission')) {
                    result.admissionDate = dateStr;
                }
            }
        });
    }

    /**
     * Enhance structured data with additional processing
     */
    enhanceStructuredData(result) {
        // Clean and validate all arrays
        Object.keys(result).forEach(key => {
            if (Array.isArray(result[key])) {
                result[key] = result[key]
                    .filter(item => typeof item === 'string' && item.trim().length > 0)
                    .map(item => item.trim())
                    .filter((item, index, arr) => arr.indexOf(item) === index); // Remove duplicates
            }
        });

        // Validate and enhance medications
        result.medications = result.medications.map(med => this.enhanceMedication(med));

        // Categorize instructions by urgency
        result.prioritizedInstructions = this.prioritizeInstructions(result.instructions);

        // Add metadata
        result.metadata = {
            parseDate: new Date().toISOString(),
            totalSections: Object.keys(result).filter(key => Array.isArray(result[key]) && result[key].length > 0).length,
            hasStructuredData: this.hasStructuredData(result),
            completeness: this.calculateCompleteness(result)
        };

        return result;
    }

    /**
     * Enhance individual medication entries
     */
    enhanceMedication(medication) {
        // Extract dosage information
        const dosageMatch = medication.match(/(\d+\.?\d*)\s*(mg|mcg|g|ml|units?)\b/i);
        const frequencyMatch = medication.match(/\b(once|twice|three times?|four times?|\d+\s*times?)\s*(daily|per day|a day)\b/i);
        const timingMatch = medication.match(/\b(morning|evening|bedtime|with meals?|before meals?|after meals?)\b/i);

        let enhanced = medication;

        // Add standardized formatting if patterns are found
        if (dosageMatch || frequencyMatch || timingMatch) {
            const parts = [];
            
            // Extract medication name (everything before first dosage/timing indicator)
            const nameMatch = medication.match(/^([^0-9]+?)(?=\d|$)/);
            if (nameMatch) {
                parts.push(nameMatch[1].trim());
            }

            if (dosageMatch) {
                parts.push(`${dosageMatch[1]}${dosageMatch[2]}`);
            }

            if (frequencyMatch) {
                parts.push(frequencyMatch[0]);
            }

            if (timingMatch) {
                parts.push(timingMatch[0]);
            }

            if (parts.length > 1) {
                enhanced = parts.join(' ');
            }
        }

        return enhanced;
    }

    /**
     * Prioritize instructions by urgency and importance
     */
    prioritizeInstructions(instructions) {
        const urgencyKeywords = {
            high: ['emergency', 'immediately', 'urgent', 'severe', 'danger', 'critical'],
            medium: ['important', 'should', 'recommend', 'follow', 'monitor'],
            low: ['may', 'optional', 'if desired', 'consider']
        };

        return instructions.map(instruction => {
            let priority = 'medium'; // default
            const lowerInstruction = instruction.toLowerCase();

            if (urgencyKeywords.high.some(keyword => lowerInstruction.includes(keyword))) {
                priority = 'high';
            } else if (urgencyKeywords.low.some(keyword => lowerInstruction.includes(keyword))) {
                priority = 'low';
            }

            return {
                text: instruction,
                priority: priority
            };
        });
    }

    /**
     * Check if the result contains structured data
     */
    hasStructuredData(result) {
        const structuredSections = ['diagnoses', 'medications', 'procedures'];
        return structuredSections.some(section => result[section].length > 0);
    }

    /**
     * Calculate completeness score
     */
    calculateCompleteness(result) {
        const expectedSections = ['diagnoses', 'medications', 'instructions', 'returnReasons', 'followUp'];
        const completedSections = expectedSections.filter(section => result[section].length > 0);
        return completedSections.length / expectedSections.length;
    }

    /**
     * Initialize medical terminology patterns
     */
    initializeMedicalTerms() {
        return {
            medications: [
                'acetaminophen', 'ibuprofen', 'aspirin', 'lisinopril', 'metformin', 'atorvastatin',
                'amlodipine', 'levothyroxine', 'metoprolol', 'losartan', 'albuterol', 'furosemide',
                'prednisone', 'warfarin', 'insulin', 'gabapentin', 'tramadol', 'omeprazole'
            ],
            conditions: [
                'hypertension', 'diabetes', 'copd', 'heart failure', 'pneumonia', 'cellulitis',
                'stroke', 'myocardial infarction', 'angina', 'arrhythmia', 'sepsis', 'covid'
            ],
            procedures: [
                'surgery', 'catheterization', 'endoscopy', 'biopsy', 'x-ray', 'ct scan',
                'mri', 'ultrasound', 'ekg', 'echocardiogram', 'blood work', 'urine test'
            ]
        };
    }

    /**
     * Initialize section detection patterns
     */
    initializeSectionPatterns() {
        return {
            diagnoses: [
                /^(?:primary\s+)?diagnos[ie]s?:?/i,
                /^conditions?:?/i,
                /^medical\s+conditions?:?/i,
                /^problems?:?/i,
                /^(?:primary|secondary)\s+diagnos/i
            ],
            medications: [
                /^medications?:?/i,
                /^prescriptions?:?/i,
                /^drugs?:?/i,
                /^medicines?:?/i,
                /^rx:?/i,
                /^home\s+medications?:?/i,
                /^discharge\s+medications?:?/i
            ],
            instructions: [
                /^(?:discharge\s+)?instructions?:?/i,
                /^care\s+instructions?:?/i,
                /^home\s+care:?/i,
                /^patient\s+instructions?:?/i,
                /^follow\s+these\s+instructions?:?/i,
                /^general\s+instructions?:?/i
            ],
            returnReasons: [
                /^(?:return\s+to\s+)?(?:hospital|er|emergency):?/i,
                /^when\s+to\s+return:?/i,
                /^(?:seek\s+)?(?:immediate\s+)?(?:medical\s+)?(?:care|attention):?/i,
                /^warning\s+signs?:?/i,
                /^red\s+flags?:?/i,
                /^call\s+(?:911|doctor|physician):?/i,
                /^emergency\s+signs?:?/i
            ],
            followUp: [
                /^follow\s*up:?/i,
                /^appointments?:?/i,
                /^next\s+visit:?/i,
                /^see\s+(?:your\s+)?(?:doctor|physician):?/i,
                /^schedule\s+appointment:?/i,
                /^follow.up\s+care:?/i
            ],
            procedures: [
                /^procedures?:?/i,
                /^treatments?:?/i,
                /^interventions?:?/i,
                /^operations?:?/i,
                /^surgery:?/i,
                /^tests?\s+performed:?/i
            ],
            allergies: [
                /^allergies?:?/i,
                /^drug\s+allergies?:?/i,
                /^allergic\s+to:?/i,
                /^adverse\s+reactions?:?/i
            ]
        };
    }

    /**
     * Initialize medication parsing patterns
     */
    initializeMedicationPatterns() {
        return [
            // Pattern: Drug name, dosage, frequency, instructions
            /^([a-zA-Z\s]+?)\s+(\d+\.?\d*\s*(?:mg|mcg|g|ml|units?))\s+([^,.-]+?)\s*[-–—]?\s*(.*)$/i,
            
            // Pattern: Drug name dosage - instructions
            /^([a-zA-Z\s]+?)\s+(\d+\.?\d*\s*(?:mg|mcg|g|ml|units?))\s*[-–—]\s*(.*)$/i,
            
            // Pattern: Drug name, frequency
            /^([a-zA-Z\s]+?)\s+([^,.-]+?daily|twice\s+daily|once\s+daily|as\s+needed)(.*)$/i,
            
            // Pattern: Simple drug name with dosage
            /^([a-zA-Z\s]+?)\s+(\d+\.?\d*\s*(?:mg|mcg|g|ml|units?))(.*)$/i
        ];
    }

    /**
     * Initialize dosage parsing patterns
     */
    initializeDosagePatterns() {
        return {
            amount: /(\d+\.?\d*)\s*(mg|mcg|g|ml|units?|tablets?|pills?|capsules?)/gi,
            frequency: /\b(once|twice|three\s*times?|four\s*times?|\d+\s*times?)\s*(daily|per\s*day|a\s*day)\b/gi,
            timing: /\b(morning|evening|bedtime|with\s*meals?|before\s*meals?|after\s*meals?|as\s*needed|prn)\b/gi,
            duration: /\b(?:for\s*)?(\d+)\s*(days?|weeks?|months?)\b/gi
        };
    }

    /**
     * Utility method to check if string is valid JSON
     */
    isJsonString(str) {
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Utility method to check if string is XML
     */
    isXmlString(str) {
        return str.trim().startsWith('<') && str.trim().endsWith('>');
    }

    /**
     * Utility method to normalize arrays
     */
    normalizeArray(data) {
        if (Array.isArray(data)) {
            return data.filter(item => typeof item === 'string' && item.trim().length > 0);
        } else if (typeof data === 'string') {
            return [data];
        }
        return [];
    }

    /**
     * Get parsing statistics
     */
    getParsingStats(result) {
        return {
            totalSections: Object.keys(result).filter(key => Array.isArray(result[key])).length,
            populatedSections: Object.keys(result).filter(key => Array.isArray(result[key]) && result[key].length > 0).length,
            totalItems: Object.values(result).reduce((sum, val) => Array.isArray(val) ? sum + val.length : sum, 0),
            completeness: result.metadata?.completeness || 0,
            hasPatientInfo: Object.keys(result.patientInfo || {}).length > 0,
            hasVitalSigns: (result.vitalSigns || []).length > 0,
            hasAllergies: (result.allergies || []).length > 0
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MedicalDataParser;
} else {
    window.MedicalDataParser = MedicalDataParser;
}
