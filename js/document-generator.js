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
