/**
 * Enhanced Main Application Controller for Discharge Instructions Translator
 * Now includes QR Code Generation capabilities
 */

class DischargeTranslatorApp {
    constructor() {
        this.translationService = new TranslationService();
        this.medicalParser = new MedicalDataParser();
        this.documentGenerator = new MedicalDocumentGenerator();
        this.qrScanner = null;
        this.currentLanguage = 'en';
        this.isScanning = false;
        this.currentData = null;
        this.isProcessing = false;
        this.currentQRCode = null;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            this.setupEventListeners();
            this.updateLanguageDisplay();
            this.checkBrowserSupport();
            
            console.log('Discharge Translator App initialized successfully');
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    /**
     * Setup event listeners for UI elements
     */
    setupEventListeners() {
        // Language selection
        document.getElementById('languageSelect')?.addEventListener('change', (e) => {
            this.currentLanguage = e.target.value;
            this.updateLanguageDisplay();
            
            // Re-translate current data if available
            if (this.currentData) {
                this.processDischargeData(this.currentData, true);
            }
        });

        // QR Scanner controls
        document.getElementById('startScan')?.addEventListener('click', () => {
            this.startScanning();
        });

        document.getElementById('stopScan')?.addEventListener('click', () => {
            this.stopScanning();
        });

        // Manual input processing
        document.getElementById('processManual')?.addEventListener('click', () => {
            this.processManualInput();
        });

        // Action buttons (will be dynamically updated with QR code generation)
        document.getElementById('printBtn')?.addEventListener('click', () => {
            this.printInstructions();
        });

        document.getElementById('shareBtn')?.addEventListener('click', () => {
            this.shareInstructions();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.stopScanning();
            } else if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                this.printInstructions();
            }
        });
    }

    /**
     * Check browser support for required features
     */
    checkBrowserSupport() {
        const features = {
            camera: navigator.mediaDevices && navigator.mediaDevices.getUserMedia,
            fetch: !!window.fetch,
            promises: !!window.Promise,
            qrcode: typeof QRCode !== 'undefined'
        };

        const unsupported = Object.entries(features)
            .filter(([feature, supported]) => !supported)
            .map(([feature]) => feature);

        if (unsupported.length > 0) {
            console.warn('Unsupported features:', unsupported);
            
            if (!features.camera) {
                this.showWarning('Camera access not available. You can still use manual input.');
                document.getElementById('startScan')?.setAttribute('disabled', 'true');
            }
            
            if (!features.qrcode) {
                this.showWarning('QR Code generation library not loaded. QR codes will not be available.');
            }
            
            if (!features.fetch) {
                this.showError('This browser is not supported. Please use a modern browser.');
                return;
            }
        }
    }

    /**
     * Start QR code scanning
     */
    async startScanning() {
        if (!navigator.mediaDevices?.getUserMedia) {
            this.showError('QR scanner not available. Please use manual input.');
            return;
        }

        if (this.isScanning) {
            return;
        }

        try {
            const video = document.getElementById('qr-video');
            const startBtn = document.getElementById('startScan');
            const stopBtn = document.getElementById('stopScan');

            if (!video) {
                throw new Error('Video element not found');
            }

            // Show video and controls
            video.style.display = 'block';
            startBtn.style.display = 'none';
            stopBtn.style.display = 'inline-block';

            // Initialize QR Scanner if available
            if (typeof QrScanner !== 'undefined') {
                this.qrScanner = new QrScanner(video, (result) => {
                    this.handleQRResult(result);
                });

                await this.qrScanner.start();
                this.isScanning = true;
                
                this.showSuccess('QR scanner started. Position the QR code within the frame.');
            } else {
                throw new Error('QR Scanner library not loaded');
            }

        } catch (error) {
            console.error('Error starting QR scanner:', error);
            this.stopScanning();
            
            if (error.name === 'NotAllowedError') {
                this.showError('Camera permission denied. Please allow camera access and try again.');
            } else if (error.name === 'NotFoundError') {
                this.showError('No camera found. Please use manual input instead.');
            } else {
                this.showError('Camera access failed. Please use manual input instead.');
            }
        }
    }

    /**
     * Stop QR code scanning
     */
    stopScanning() {
        if (this.qrScanner) {
            this.qrScanner.stop();
            this.qrScanner.destroy();
            this.qrScanner = null;
        }

        const video = document.getElementById('qr-video');
        const startBtn = document.getElementById('startScan');
        const stopBtn = document.getElementById('stopScan');

        if (video) video.style.display = 'none';
        if (startBtn) startBtn.style.display = 'inline-block';
        if (stopBtn) stopBtn.style.display = 'none';

        this.isScanning = false;
    }

    /**
     * Handle QR code scan result
     */
    handleQRResult(result) {
        const data = result.data || result;
        
        this.showSuccess('QR code scanned successfully!');
        this.stopScanning();
        
        // Try to parse as medical data QR code first
        try {
            const qrData = JSON.parse(data);
            if (qrData.type === 'medical_discharge' && qrData.data) {
                // This is a medical QR code generated by our app
                this.processMedicalQRCode(qrData);
                return;
            }
        } catch (e) {
            // Not JSON or not our medical QR code, treat as regular text
        }
        
        // Process as regular discharge data
        this.processDischargeData(data);
    }

    /**
     * Process medical QR code data
     */
    processMedicalQRCode(qrData) {
        try {
            this.showInfo('Processing medical QR code...');
            
            // Extract the discharge data
            const originalData = qrData.data.original;
            const qrLanguage = qrData.data.language;
            
            // Set language if different from current
            if (qrLanguage !== this.currentLanguage) {
                document.getElementById('languageSelect').value = qrLanguage;
                this.currentLanguage = qrLanguage;
                this.updateLanguageDisplay();
            }
            
            // Process the data
            this.processDischargeData(originalData);
            
            this.showSuccess(`Medical QR code processed! Data from ${qrData.hospital?.name || 'Hospital'}`);
            
        } catch (error) {
            console.error('Error processing medical QR code:', error);
            this.showError('Invalid medical QR code format. Processing as text...');
            this.processDischargeData(qrData.data?.original || '');
        }
    }

    /**
     * Process manual input
     */
    processManualInput() {
        const input = document.getElementById('manualInput')?.value?.trim();
        
        if (!input) {
            this.showError('Please enter some discharge information.');
            return;
        }

        this.processDischargeData(input);
    }

    /**
     * Main data processing method with QR code generation
     */
    async processDischargeData(rawData, isRetranslation = false) {
        if (this.isProcessing && !isRetranslation) {
            return;
        }

        this.isProcessing = true;

        try {
            this.showStatus('Processing discharge information...', 'info');

            // Store raw data for potential re-translation
            if (!isRetranslation) {
                this.currentData = rawData;
            }

            // Parse the medical data
            const parsedData = this.medicalParser.parseDischargeData(rawData);

            // Translate if needed
            let translatedData = parsedData;
            let translationResults = null;

            if (this.currentLanguage !== 'en') {
                this.showStatus('Translating to your selected language...', 'info');

                translationResults = await this.translateMedicalData(parsedData);
                translatedData = translationResults.data;
            }

            // Generate QR code for the processed data
            if (typeof QRCode !== 'undefined') {
                this.showStatus('Generating QR code for mobile access...', 'info');
                try {
                    this.currentQRCode = await this.documentGenerator.generateQRCode(
                        parsedData, 
                        translatedData, 
                        this.currentLanguage
                    );
                } catch (qrError) {
                    console.warn('QR code generation failed:', qrError);
                    this.currentQRCode = null;
                }
            }

            // Display results
            this.displayResults(translatedData, translationResults);
            
            this.hideStatus();

        } catch (error) {
            console.error('Error processing discharge data:', error);
            this.showError(`Error processing data: ${error.message}`);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Translate medical data to target language
     */
    async translateMedicalData(parsedData) {
        const sectionsToTranslate = [
            'diagnoses', 'medications', 'instructions', 
            'returnReasons', 'followUp', 'procedures'
        ];

        const translationResults = {
            data: { ...parsedData },
            confidence: 0,
            service: '',
            errors: []
        };

        let totalConfidence = 0;
        let translationCount = 0;

        for (const section of sectionsToTranslate) {
            if (parsedData[section] && parsedData[section].length > 0) {
                try {
                    const result = await this.translationService.translate(
                        parsedData[section],
                        this.currentLanguage,
                        'en'
                    );

                    translationResults.data[section] = Array.isArray(result.translatedText) 
                        ? result.translatedText 
                        : [result.translatedText];

                    totalConfidence += result.confidence;
                    translationCount++;
                    
                    if (!translationResults.service) {
                        translationResults.service = result.service;
                    }

                } catch (error) {
                    console.error(`Error translating ${section}:`, error);
                    translationResults.errors.push(`Failed to translate ${section}: ${error.message}`);
                }
            }
        }

        // Calculate average confidence
        translationResults.confidence = translationCount > 0 ? totalConfidence / translationCount : 0;

        return translationResults;
    }

    /**
     * Generate and download professional discharge document
     */
    async generateDischargeDocument(format = 'pdf') {
        if (!this.currentData) {
            this.showError('No discharge data available. Please process discharge information first.');
            return;
        }

        try {
            this.showStatus('Generating professional discharge document...', 'info');

            // Parse the medical data
            const parsedData = this.medicalParser.parseDischargeData(this.currentData);

            // Get translation data if not English
            let translationData = parsedData;
            if (this.currentLanguage !== 'en') {
                const translationResults = await this.translateMedicalData(parsedData);
                translationData = translationResults.data;
            }

            // Configure hospital branding (you can customize this)
            this.documentGenerator.configureHospital({
                name: 'Medical Center',
                address: '123 Healthcare Drive, Medical City, ST 12345',
                phone: '(555) 123-CARE',
                primaryColor: '#003366',
                secondaryColor: '#0066CC'
            });

            // Generate document with QR code
            if (format === 'pdf') {
                const pdfData = await this.documentGenerator.generatePDF(
                    parsedData, 
                    translationData, 
                    this.currentLanguage
                );
                
                // Download the PDF
                this.documentGenerator.downloadDocument(pdfData, 'pdf');
                this.showSuccess('Professional discharge document with QR code downloaded successfully!');
                
            } else if (format === 'html') {
                const htmlData = await this.documentGenerator.generateHTML(
                    parsedData, 
                    translationData, 
                    this.currentLanguage
                );
                
                // Download the HTML document
                this.documentGenerator.downloadDocument(htmlData, 'html');
                this.showSuccess('Discharge document with QR code downloaded successfully!');
            }

            this.hideStatus();

        } catch (error) {
            console.error('Error generating document:', error);
            this.showError(`Failed to generate document: ${error.message}`);
            this.hideStatus();
        }
    }

    /**
     * Display processed results with QR code
     */
    displayResults(data, translationResults = null) {
        const outputSection = document.getElementById('output');
        const outputContent = document.getElementById('outputContent');
        
        if (!outputSection || !outputContent) {
            console.error('Output elements not found');
            return;
        }

        // Update language display
        this.updateLanguageDisplay();

        // Clear previous content
        outputContent.innerHTML = '';

        // Add QR code section if available
        if (this.currentQRCode) {
            this.documentGenerator.displayQRCode(this.currentQRCode, this.currentLanguage);
        }

        // Define sections with their display information
        const sections = [
            { 
                key: 'diagnoses', 
                title: '🩺 Diagnoses & Conditions', 
                description: 'Medical conditions identified during your visit'
            },
            { 
                key: 'procedures', 
                title: '⚕️ Procedures & Treatments', 
                description: 'Medical procedures performed during your stay'
            },
            { 
                key: 'medications', 
                title: '💊 Medications', 
                description: 'Prescribed medications and instructions'
            },
            { 
                key: 'instructions', 
                title: '📋 Care Instructions', 
                description: 'Important care instructions for your recovery'
            },
            { 
                key: 'returnReasons', 
                title: '🚨 When to Seek Emergency Care', 
                description: 'Warning signs that require immediate medical attention'
            },
            { 
                key: 'followUp', 
                title: '📅 Follow-up Care', 
                description: 'Scheduled appointments and ongoing care requirements'
            }
        ];

        let hasContent = false;

        // Create sections
        sections.forEach(section => {
            if (data[section.key] && data[section.key].length > 0) {
                const sectionElement = this.createSectionElement(section, data[section.key]);
                outputContent.appendChild(sectionElement);
                hasContent = true;
            }
        });

        // Show default message if no structured content
        if (!hasContent) {
            const defaultSection = document.createElement('div');
            defaultSection.className = 'section';
            defaultSection.innerHTML = `
                <h3>📋 Discharge Information</h3>
                <div class="section-content">
                    <p>Your discharge information has been processed and translated.</p>
                    <p>If specific sections are not shown above, your discharge instructions may be in a format that requires manual review.</p>
                </div>
            `;
            outputContent.appendChild(defaultSection);
        }
        
        // Update action buttons with new download and QR options
        this.updateActionButtons();
        
        // Show the output section
        outputSection.classList.add('show');
        
        // Scroll to results
        outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /**
     * Update action buttons with enhanced download and QR options
     */
    updateActionButtons() {
        const actionButtons = document.querySelector('.action-buttons');
        if (!actionButtons) return;
        
        // Update the action buttons HTML to include download and QR options
        actionButtons.innerHTML = `
            <button id="downloadPdfBtn" class="btn btn-download-pdf">📄 Download PDF with QR</button>
            <button id="downloadHtmlBtn" class="btn btn-download-html">🌐 Download HTML with QR</button>
            <button id="generateQRBtn" class="btn btn-qr" ${!this.currentQRCode ? 'style="display:none"' : ''}>📱 View QR Code</button>
            <button id="printBtn" class="btn btn-print">🖨️ Print Instructions</button>
            <button id="shareBtn" class="btn btn-share">📤 Share</button>
        `;
        
        // Re-attach event listeners for the new buttons
        document.getElementById('downloadPdfBtn')?.addEventListener('click', () => {
            this.generateDischargeDocument('pdf');
        });
        
        document.getElementById('downloadHtmlBtn')?.addEventListener('click', () => {
            this.generateDischargeDocument('html');
        });
        
        document.getElementById('generateQRBtn')?.addEventListener('click', () => {
            this.showQRCodeModal();
        });
        
        document.getElementById('printBtn')?.addEventListener('click', () => {
            this.printInstructions();
        });
        
        document.getElementById('shareBtn')?.addEventListener('click', () => {
            this.shareInstructions();
        });
    }

    /**
     * Show QR code in a modal/popup
     */
    showQRCodeModal() {
        if (!this.currentQRCode) {
            this.showError('No QR code available.');
            return;
        }

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'qr-modal';
        modal.innerHTML = `
            <div class="qr-modal-content">
                <div class="qr-modal-header">
                    <h3>📱 Mobile Access QR Code</h3>
                    <button class="qr-modal-close">&times;</button>
                </div>
                <div class="qr-modal-body">
                    <img src="${this.currentQRCode.dataURL}" alt="QR Code" class="qr-modal-image">
                    <p>Scan this QR code with your smartphone to access these discharge instructions on your mobile device.</p>
                    <p><strong>Note:</strong> The QR code contains encrypted medical data for secure access.</p>
                </div>
            </div>
        `;

        // Add modal styles
        const style = document.createElement('style');
        style.textContent = `
            .qr-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            }
            .qr-modal-content {
                background: white;
                border-radius: 10px;
                padding: 20px;
                max-width: 400px;
                width: 90%;
                text-align: center;
            }
            .qr-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #ddd;
                padding-bottom: 10px;
                margin-bottom: 20px;
            }
            .qr-modal-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
            }
            .qr-modal-image {
                width: 200px;
                height: 200px;
                border: 2px solid #ddd;
                border-radius: 8px;
                margin-bottom: 15px;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(modal);

        // Close modal functionality
        const closeModal = () => {
            document.body.removeChild(modal);
            document.head.removeChild(style);
        };

        modal.querySelector('.qr-modal-close').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    /**
     * Create a section element for display
     */
    createSectionElement(sectionInfo, items) {
        const section = document.createElement('div');
        section.className = 'section';
        section.setAttribute('data-section', sectionInfo.key);

        const itemsHtml = items.map(item => {
            return `<p>${this.escapeHtml(item)}</p>`;
        }).join('');

        section.innerHTML = `
            <h3>${sectionInfo.title}</h3>
            <div class="section-content">
                <div class="section-description" style="font-style: italic; margin-bottom: 15px; color: #666;">${sectionInfo.description}</div>
                ${itemsHtml}
            </div>
        `;

        return section;
    }

    /**
     * Update language display
     */
    updateLanguageDisplay() {
        const select = document.getElementById('languageSelect');
        const display = document.getElementById('selectedLanguage');
        
        if (select && display) {
            const selectedOption = select.options[select.selectedIndex];
            display.textContent = selectedOption.text;
        }
    }

    /**
     * Print instructions
     */
    printInstructions() {
        const outputSection = document.getElementById('output');
        
        if (!outputSection || !outputSection.classList.contains('show')) {
            this.showError('No instructions to print. Please process discharge data first.');
            return;
        }

        window.print();
    }

    /**
     * Share instructions with QR code option
     */
    async shareInstructions() {
        const outputSection = document.getElementById('output');
        
        if (!outputSection || !outputSection.classList.contains('show')) {
            this.showError('No instructions to share. Please process discharge data first.');
            return;
        }

        // Extract text content for sharing
        const textContent = this.extractTextContent();
        
        // Add QR code information to share text
        let shareText = textContent;
        if (this.currentQRCode) {
            shareText += '\n\nMobile Access: A QR code is available for mobile access to these instructions.';
        }
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Discharge Instructions',
                    text: shareText,
                    url: window.location.href
                });
            } catch (error) {
                if (error.name !== 'AbortError') {
                    this.fallbackShare(shareText);
                }
            }
        } else {
            this.fallbackShare(shareText);
        }
    }

    /**
     * Fallback sharing method
     */
    fallbackShare(textContent) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(textContent).then(() => {
                this.showSuccess('Instructions copied to clipboard!');
            }).catch(() => {
                this.showInfo('Use Ctrl+C to copy the displayed instructions.');
            });
        } else {
            this.showInfo('Use Ctrl+C to copy the displayed instructions.');
        }
    }

    /**
     * Extract text content from output for sharing
     */
    extractTextContent() {
        const outputContent = document.getElementById('outputContent');
        if (!outputContent) return '';

        let text = 'DISCHARGE INSTRUCTIONS\n\n';
        
        const sections = outputContent.querySelectorAll('.section');
        sections.forEach(section => {
            const title = section.querySelector('h3')?.textContent || '';
            const content = section.querySelector('.section-content');
            
            if (title && content) {
                text += `${title}\n`;
                text += '='.repeat(title.length) + '\n';
                
                const paragraphs = content.querySelectorAll('p');
                paragraphs.forEach(p => {
                    const pText = p.textContent?.trim();
                    if (pText && !pText.includes('section-description')) {
                        text += `• ${pText}\n`;
                    }
                });
                text += '\n';
            }
        });

        text += `\nGenerated on: ${new Date().toLocaleDateString()}\n`;
        text += 'This translation is for informational purposes only. Always consult your healthcare provider for medical advice.';

        return text;
    }

    /**
     * Show status message
     */
    showStatus(message, type = 'info') {
        this.hideStatus();

        const statusContainer = document.getElementById('status-messages');
        if (!statusContainer) return;

        const statusElement = document.createElement('div');
        statusElement.className = `status-message ${type}`;
        
        const icon = this.getStatusIcon(type);
        statusElement.innerHTML = `${icon} ${message}`;

        if (type === 'info' && message.includes('...')) {
            statusElement.innerHTML += ' <span class="loading-spinner"></span>';
        }

        statusContainer.appendChild(statusElement);

        if (type === 'success' || type === 'warning') {
            setTimeout(() => {
                if (statusElement.parentNode) {
                    statusElement.parentNode.removeChild(statusElement);
                }
            }, 5000);
        }
    }

    /**
     * Get status icon based on type
     */
    getStatusIcon(type) {
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }

    /**
     * Hide all status messages
     */
    hideStatus() {
        const statusContainer = document.getElementById('status-messages');
        if (statusContainer) {
            statusContainer.innerHTML = '';
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showStatus(message, 'success');
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showStatus(message, 'error');
    }

    /**
     * Show warning message
     */
    showWarning(message) {
        this.showStatus(message, 'warning');
    }

    /**
     * Show info message
     */
    showInfo(message) {
        this.showStatus(message, 'info');
    }

    /**
     * Escape HTML characters
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.dischargeApp = new DischargeTranslatorApp();
    } catch (error) {
        console.error('Failed to initialize Discharge Translator App:', error);
    }
});
