/**
 * Complete Enhanced Medical Document Generator with QR Code Integration
 * Creates hospital-grade discharge summaries with embedded QR codes
 */

class MedicalDocumentGenerator {
    constructor() {
        this.hospitalConfig = {
            name: 'Medical Center',
            logo: null,
            address: '123 Healthcare Drive, Medical City, ST 12345',
            phone: '(555) 123-CARE',
            primaryColor: '#003366',
            secondaryColor: '#0066CC'
        };
        
        this.documentTemplate = {
            margins: { top: 50, right: 50, bottom: 50, left: 50 },
            fontSize: { title: 16, header: 14, body: 11, small: 9 },
            spacing: { section: 15, paragraph: 8 }
        };

        // QR Code settings
        this.qrConfig = {
            size: 150,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        };
    }

    /**
     * Configure hospital branding and information
     */
    configureHospital(config) {
        this.hospitalConfig = {
            ...this.hospitalConfig,
            ...config
        };
    }

    /**
     * Generate QR code containing medical data with fallback support
     */
    async generateQRCode(dischargeData, translationData, language = 'en') {
        try {
            console.log('🔄 Starting QR code generation...');
            
            // Create structured data for QR code
            const qrData = {
                version: '1.0',
                type: 'medical_discharge',
                timestamp: new Date().toISOString(),
                language: language,
                hospital: {
                    name: this.hospitalConfig.name,
                    phone: this.hospitalConfig.phone
                },
                data: {
                    original: dischargeData,
                    translated: translationData,
                    language: language
                }
            };

            const qrString = JSON.stringify(qrData);
            console.log('QR data prepared, length:', qrString.length);

            let qrCodeDataURL;

            // Method 1: Try primary QRCode library
            if (typeof QRCode !== 'undefined') {
                console.log('✅ Using primary QRCode library');
                qrCodeDataURL = await new Promise((resolve, reject) => {
                    QRCode.toDataURL(qrString, {
                        width: this.qrConfig.size,
                        margin: this.qrConfig.margin,
                        color: this.qrConfig.color,
                        errorCorrectionLevel: 'M'
                    }, (error, url) => {
                        if (error) {
                            console.warn('Primary QRCode failed:', error);
                            reject(error);
                        } else {
                            console.log('✅ Primary QRCode succeeded');
                            resolve(url);
                        }
                    });
                });
            } 
            // Method 2: Fallback to QR service
            else {
                console.log('⚠️ Primary QRCode not available, using fallback');
                qrCodeDataURL = await this.generateQRCodeFallback(qrString);
            }

            return {
                dataURL: qrCodeDataURL,
                rawData: qrString,
                size: this.qrConfig.size
            };

        } catch (error) {
            console.error('❌ QR code generation failed:', error);
            
            // Method 3: Final fallback - create placeholder
            return this.createQRCodePlaceholder(error.message);
        }
    }

    /**
     * Fallback QR code generation using external service
     */
    async generateQRCodeFallback(qrString) {
        try {
            const size = this.qrConfig.size;
            const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrString)}`;
            
            console.log('🔄 Trying fallback QR service...');
            
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                img.onload = function() {
                    try {
                        const canvas = document.createElement('canvas');
                        canvas.width = this.width;
                        canvas.height = this.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(this, 0, 0);
                        console.log('✅ Fallback QR service succeeded');
                        resolve(canvas.toDataURL());
                    } catch (canvasError) {
                        console.error('Canvas error:', canvasError);
                        reject(canvasError);
                    }
                };
                
                img.onerror = function() {
                    const error = new Error('Fallback QR service failed to load image');
                    console.error('❌ Fallback QR service failed');
                    reject(error);
                };
                
                img.src = url;
            });
        } catch (error) {
            console.error('Fallback QR generation error:', error);
            throw error;
        }
    }

    /**
     * Create a placeholder when all QR generation methods fail
     */
    createQRCodePlaceholder(errorMessage = 'QR generation failed') {
        console.log('🔄 Creating QR placeholder...');
        
        const canvas = document.createElement('canvas');
        canvas.width = this.qrConfig.size;
        canvas.height = this.qrConfig.size;
        const ctx = canvas.getContext('2d');
        
        // Draw a simple placeholder
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, this.qrConfig.size, this.qrConfig.size);
        
        ctx.strokeStyle = '#dee2e6';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, this.qrConfig.size - 20, this.qrConfig.size - 20);
        
        ctx.fillStyle = '#6c757d';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR Code', this.qrConfig.size / 2, this.qrConfig.size / 2 - 10);
        ctx.fillText('Unavailable', this.qrConfig.size / 2, this.qrConfig.size / 2 + 10);
        
        console.log('✅ QR placeholder created');
        
        return {
            dataURL: canvas.toDataURL(),
            rawData: JSON.stringify({ error: errorMessage }),
            size: this.qrConfig.size,
            isPlaceholder: true,
            error: errorMessage
        };
    }

    /**
     * Generate professional PDF discharge document with QR code
     */
    async generatePDF(dischargeData, translationData, language = 'en') {
        try {
            console.log('🔄 Starting PDF generation...');
            
            // Check if jsPDF is available
            if (typeof jsPDF === 'undefined') {
                throw new Error('jsPDF library not loaded. Please check your script tags.');
            }

            const { jsPDF } = window;
            const doc = new jsPDF('p', 'mm', 'a4');
            
            let yPosition = 20;
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            const contentWidth = pageWidth - (margin * 2);

            // Generate QR code first
            console.log('🔄 Generating QR code for PDF...');
            const qrCode = await this.generateQRCode(dischargeData, translationData, language);

            // Document header
            yPosition = this.addDocumentHeader(doc, yPosition, pageWidth, margin);
            
            // Add QR code to top right
            this.addQRCodeToPDF(doc, qrCode, pageWidth - 60, 20);
            
            // Patient information section (if available)
            if (dischargeData.patientInfo) {
                yPosition = this.addPatientInfo(doc, dischargeData.patientInfo, yPosition, margin, contentWidth);
            }
            
            // Language indicator
            yPosition = this.addLanguageIndicator(doc, language, yPosition, margin);
            
            // QR Code information section
            yPosition = this.addQRCodeInfo(doc, yPosition, margin, language);
            
            // Main content sections
            const sections = [
                { 
                    key: 'diagnoses', 
                    title: this.getLocalizedSectionTitle('diagnoses', language),
                    icon: '🩺',
                    data: translationData.diagnoses || dischargeData.diagnoses || []
                },
                { 
                    key: 'procedures', 
                    title: this.getLocalizedSectionTitle('procedures', language),
                    icon: '⚕️',
                    data: translationData.procedures || dischargeData.procedures || []
                },
                { 
                    key: 'medications', 
                    title: this.getLocalizedSectionTitle('medications', language),
                    icon: '💊',
                    data: translationData.medications || dischargeData.medications || []
                },
                { 
                    key: 'instructions', 
                    title: this.getLocalizedSectionTitle('instructions', language),
                    icon: '📋',
                    data: translationData.instructions || dischargeData.instructions || []
                },
                { 
                    key: 'returnReasons', 
                    title: this.getLocalizedSectionTitle('returnReasons', language),
                    icon: '🚨',
                    data: translationData.returnReasons || dischargeData.returnReasons || []
                },
                { 
                    key: 'followUp', 
                    title: this.getLocalizedSectionTitle('followUp', language),
                    icon: '📅',
                    data: translationData.followUp || dischargeData.followUp || []
                }
            ];

            // Add each section
            for (const section of sections) {
                if (section.data && section.data.length > 0) {
                    // Check if we need a new page
                    if (yPosition > 250) {
                        doc.addPage();
                        yPosition = 20;
                    }
                    
                    yPosition = this.addContentSection(doc, section, yPosition, margin, contentWidth);
                }
            }
            
            // Footer with QR code instructions
            this.addDocumentFooterWithQR(doc, language);
            
            console.log('✅ PDF generation completed');
            
            // Return the PDF as blob for download
            return {
                pdf: doc,
                blob: doc.output('blob'),
                filename: this.generateFilename('discharge-instructions', language),
                qrCode: qrCode
            };
            
        } catch (error) {
            console.error('❌ PDF generation failed:', error);
            throw new Error(`Failed to generate PDF: ${error.message}`);
        }
    }

    /**
     * Generate professional HTML document with QR code
     */
    async generateHTML(dischargeData, translationData, language = 'en') {
        try {
            console.log('🔄 Starting HTML generation...');
            
            const languageName = this.getLanguageName(language);
            const currentDate = new Date().toLocaleDateString();
            
            // Generate QR code
            console.log('🔄 Generating QR code for HTML...');
            const qrCode = await this.generateQRCode(dischargeData, translationData, language);
            
            const sections = [
                { 
                    key: 'diagnoses', 
                    title: this.getLocalizedSectionTitle('diagnoses', language),
                    icon: '🩺',
                    data: translationData.diagnoses || dischargeData.diagnoses || [],
                    description: this.getLocalizedSectionDescription('diagnoses', language)
                },
                { 
                    key: 'procedures', 
                    title: this.getLocalizedSectionTitle('procedures', language),
                    icon: '⚕️',
                    data: translationData.procedures || dischargeData.procedures || [],
                    description: this.getLocalizedSectionDescription('procedures', language)
                },
                { 
                    key: 'medications', 
                    title: this.getLocalizedSectionTitle('medications', language),
                    icon: '💊',
                    data: translationData.medications || dischargeData.medications || [],
                    description: this.getLocalizedSectionDescription('medications', language)
                },
                { 
                    key: 'instructions', 
                    title: this.getLocalizedSectionTitle('instructions', language),
                    icon: '📋',
                    data: translationData.instructions || dischargeData.instructions || [],
                    description: this.getLocalizedSectionDescription('instructions', language)
                },
                { 
                    key: 'returnReasons', 
                    title: this.getLocalizedSectionTitle('returnReasons', language),
                    icon: '🚨',
                    data: translationData.returnReasons || dischargeData.returnReasons || [],
                    description: this.getLocalizedSectionDescription('returnReasons', language)
                },
                { 
                    key: 'followUp', 
                    title: this.getLocalizedSectionTitle('followUp', language),
                    icon: '📅',
                    data: translationData.followUp || dischargeData.followUp || [],
                    description: this.getLocalizedSectionDescription('followUp', language)
                }
            ];

            const sectionsHTML = sections
                .filter(section => section.data && section.data.length > 0)
                .map(section => this.generateSectionHTML(section))
                .join('');

            const htmlDocument = `
<!DOCTYPE html>
<html lang="${language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Discharge Instructions - ${languageName}</title>
    <style>
        ${this.getDocumentCSS()}
    </style>
</head>
<body>
    <div class="document-container">
        <!-- Hospital Header with QR Code -->
        <header class="hospital-header">
            <div class="hospital-info">
                <h1 class="hospital-name">${this.hospitalConfig.name}</h1>
                <div class="hospital-contact">
                    <div>${this.hospitalConfig.address}</div>
                    <div>Tel: ${this.hospitalConfig.phone}</div>
                </div>
            </div>
            <div class="qr-section">
                <img src="${qrCode.dataURL}" alt="QR Code for Mobile Access" class="qr-code">
                <p class="qr-label">${this.getLocalizedText('scan_qr', language)}</p>
            </div>
        </header>

        <!-- Document Title -->
        <div class="document-title">
            <h1>${this.getLocalizedText('document_title', language)}</h1>
            <div class="document-info">
                <div><strong>${this.getLocalizedText('language', language)}:</strong> ${languageName}</div>
                <div><strong>${this.getLocalizedText('date', language)}:</strong> ${currentDate}</div>
            </div>
        </div>

        <!-- QR Code Info -->
        <div class="qr-info-section">
            <h3>${this.getLocalizedText('mobile_access', language)}</h3>
            <p>${this.getLocalizedText('qr_instructions', language)}</p>
        </div>

        <!-- Patient Information -->
        ${dischargeData.patientInfo ? this.generatePatientInfoHTML(dischargeData.patientInfo, language) : ''}

        <!-- Main Content -->
        <main class="document-content">
            ${sectionsHTML}
        </main>

        <!-- Footer -->
        <footer class="document-footer">
            <div class="disclaimer">
                <p><strong>${this.getLocalizedText('disclaimer_title', language)}:</strong> ${this.getLocalizedText('disclaimer_text', language)}</p>
            </div>
            <div class="generation-info">
                <p>${this.getLocalizedText('generated_on', language)}: ${currentDate}</p>
                <p>${this.getLocalizedText('generated_by', language)}: ${this.hospitalConfig.name}</p>
            </div>
        </footer>
    </div>
</body>
</html>`;

            console.log('✅ HTML generation completed');

            return {
                html: htmlDocument,
                filename: this.generateFilename('discharge-instructions', language, 'html'),
                qrCode: qrCode
            };
            
        } catch (error) {
            console.error('❌ HTML generation failed:', error);
            throw new Error(`Failed to generate HTML: ${error.message}`);
        }
    }

    /**
     * Display QR code in the current interface
     */
    displayQRCode(qrCode, language = 'en') {
        // Create or update QR code display section
        let qrSection = document.getElementById('qr-display-section');
        
        if (!qrSection) {
            qrSection = document.createElement('div');
            qrSection.id = 'qr-display-section';
            qrSection.className = 'section qr-display';
            
            // Insert after language info in output section
            const outputContent = document.getElementById('outputContent');
            if (outputContent) {
                outputContent.insertBefore(qrSection, outputContent.firstChild);
            }
        }

        qrSection.innerHTML = `
            <h3>📱 ${this.getLocalizedText('mobile_access', language)}</h3>
            <div class="qr-container">
                <img src="${qrCode.dataURL}" alt="QR Code" class="qr-code-display">
                <div class="qr-instructions">
                    <p><strong>${this.getLocalizedText('scan_qr', language)}</strong></p>
                    <p>${this.getLocalizedText('qr_instructions', language)}</p>
                    ${qrCode.isPlaceholder ? '<p style="color: #dc3545; font-size: 0.9em;">⚠️ QR code generation failed, but downloads are still available.</p>' : ''}
                </div>
            </div>
        `;
    }

    /**
     * Download generated document
     */
    downloadDocument(documentData, type = 'pdf') {
        try {
            console.log(`🔄 Starting ${type.toUpperCase()} download...`);
            
            const link = document.createElement('a');
            
            if (type === 'pdf') {
                link.href = URL.createObjectURL(documentData.blob);
                link.download = documentData.filename;
            } else if (type === 'html') {
                const blob = new Blob([documentData.html], { type: 'text/html' });
                link.href = URL.createObjectURL(blob);
                link.download = documentData.filename;
            }
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            
            console.log(`✅ ${type.toUpperCase()} download initiated`);
            
        } catch (error) {
            console.error(`❌ ${type.toUpperCase()} download failed:`, error);
            throw error;
        }
    }

    // ========== PDF HELPER METHODS ==========

    /**
     * Add document header to PDF
     */
    addDocumentHeader(doc, yPosition, pageWidth, margin) {
        // Hospital name
        doc.setFontSize(18);
        doc.setTextColor(this.hexToRgb(this.hospitalConfig.primaryColor));
        doc.text(this.hospitalConfig.name, margin, yPosition);
        yPosition += 10;

        // Hospital contact info
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(this.hospitalConfig.address, margin, yPosition);
        yPosition += 5;
        doc.text(`Tel: ${this.hospitalConfig.phone}`, margin, yPosition);
        yPosition += 10;

        // Title line
        doc.setLineWidth(1);
        doc.setDrawColor(this.hexToRgb(this.hospitalConfig.primaryColor));
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 15;

        // Document title
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text('DISCHARGE INSTRUCTIONS', margin, yPosition);
        yPosition += 15;

        return yPosition;
    }

    /**
     * Add patient information section to PDF
     */
    addPatientInfo(doc, patientInfo, yPosition, margin, contentWidth) {
        doc.setFontSize(12);
        doc.setTextColor(this.hexToRgb(this.hospitalConfig.primaryColor));
        doc.text('Patient Information', margin, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        
        if (patientInfo.name) {
            doc.text(`Name: ${patientInfo.name}`, margin, yPosition);
            yPosition += 5;
        }
        if (patientInfo.dob) {
            doc.text(`Date of Birth: ${patientInfo.dob}`, margin, yPosition);
            yPosition += 5;
        }
        if (patientInfo.mrn) {
            doc.text(`MRN: ${patientInfo.mrn}`, margin, yPosition);
            yPosition += 5;
        }
        
        yPosition += 5;
        return yPosition;
    }

    /**
     * Add language indicator to PDF
     */
    addLanguageIndicator(doc, language, yPosition, margin) {
        const languageName = this.getLanguageName(language);
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`Language: ${languageName}`, margin, yPosition);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, margin + 80, yPosition);
        return yPosition + 15;
    }

    /**
     * Add QR code to PDF
     */
    addQRCodeToPDF(doc, qrCode, x, y) {
        const qrSize = 40; // Size in mm
        try {
            doc.addImage(qrCode.dataURL, 'PNG', x, y, qrSize, qrSize);
            
            // Add QR code label
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text('Scan for mobile access', x + qrSize/2, y + qrSize + 5, { align: 'center' });
        } catch (error) {
            console.warn('Failed to add QR code to PDF:', error);
            // Add text placeholder instead
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text('QR Code', x + qrSize/2, y + qrSize/2, { align: 'center' });
            doc.text('Unavailable', x + qrSize/2, y + qrSize/2 + 3, { align: 'center' });
        }
    }

    /**
     * Add QR code information section to PDF
     */
    addQRCodeInfo(doc, yPosition, margin, language) {
        doc.setFontSize(11);
        doc.setTextColor(this.hexToRgb(this.hospitalConfig.primaryColor));
        doc.text('📱 Mobile Access', margin, yPosition);
        yPosition += 6;

        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        const qrText = this.getLocalizedText('qr_instructions', language);
        const lines = doc.splitTextToSize(qrText, 140);
        lines.forEach(line => {
            doc.text(line, margin, yPosition);
            yPosition += 4;
        });
        
        return yPosition + 8;
    }

    /**
     * Add content section to PDF
     */
    addContentSection(doc, section, yPosition, margin, contentWidth) {
        // Section title
        doc.setFontSize(12);
        doc.setTextColor(this.hexToRgb(this.hospitalConfig.primaryColor));
        doc.text(`${section.icon} ${section.title}`, margin, yPosition);
        yPosition += 8;

        // Section content
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        
        section.data.forEach(item => {
            const lines = doc.splitTextToSize(`• ${item}`, contentWidth);
            lines.forEach(line => {
                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = 20;
                }
                doc.text(line, margin + 5, yPosition);
                yPosition += 5;
            });
            yPosition += 2;
        });
        
        return yPosition + 8;
    }

    /**
     * Add enhanced footer with QR code information
     */
    addDocumentFooterWithQR(doc, language) {
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        
        const disclaimerText = this.getLocalizedText('disclaimer_text', language);
        const qrFooterText = this.getLocalizedText('qr_footer_text', language);
        
        const footerY = pageHeight - 25;
        
        doc.text(disclaimerText, margin, footerY, { maxWidth: 180 });
        doc.text(qrFooterText, margin, footerY + 8, { maxWidth: 180 });
    }

    // ========== HTML HELPER METHODS ==========

    /**
     * Generate section HTML
     */
    generateSectionHTML(section) {
        const itemsHTML = section.data.map(item => `<li>${this.escapeHtml(item)}</li>`).join('');
        
        return `
        <section class="content-section">
            <h2 class="section-title">
                <span class="section-icon">${section.icon}</span>
                ${section.title}
            </h2>
            <p class="section-description">${section.description}</p>
            <ul class="section-content">
                ${itemsHTML}
            </ul>
        </section>`;
    }

    /**
     * Generate patient info HTML
     */
    generatePatientInfoHTML(patientInfo, language) {
        return `
        <section class="patient-info">
            <h2>${this.getLocalizedText('patient_information', language)}</h2>
            <div class="patient-details">
                ${patientInfo.name ? `<div><strong>${this.getLocalizedText('name', language)}:</strong> ${patientInfo.name}</div>` : ''}
                ${patientInfo.dob ? `<div><strong>${this.getLocalizedText('date_of_birth', language)}:</strong> ${patientInfo.dob}</div>` : ''}
                ${patientInfo.mrn ? `<div><strong>${this.getLocalizedText('medical_record', language)}:</strong> ${patientInfo.mrn}</div>` : ''}
            </div>
        </section>`;
    }

    /**
     * Get document CSS styles
     */
    getDocumentCSS() {
        return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            color: #333;
            background: white;
        }
        
        .document-container {
            max-width: 8.5in;
            margin: 0 auto;
            padding: 1in;
            background: white;
            min-height: 11in;
        }
        
        .hospital-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid ${this.hospitalConfig.primaryColor};
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .hospital-name {
            font-size: 24px;
            color: ${this.hospitalConfig.primaryColor};
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .hospital-contact {
            font-size: 12px;
            color: #666;
        }
        
        .qr-section {
            text-align: center;
            min-width: 120px;
        }
        
        .qr-code {
            width: 100px;
            height: 100px;
            border: 2px solid #ddd;
            border-radius: 8px;
        }
        
        .qr-label {
            font-size: 10px;
            color: #666;
            margin-top: 5px;
        }
        
        .qr-info-section {
            background: #e8f4fd;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid ${this.hospitalConfig.secondaryColor};
        }
        
        .qr-info-section h3 {
            color: ${this.hospitalConfig.primaryColor};
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .qr-info-section p {
            font-size: 12px;
            color: #555;
        }
        
        .document-title {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .document-title h1 {
            font-size: 22px;
            color: ${this.hospitalConfig.primaryColor};
            margin-bottom: 10px;
        }
        
        .document-info {
            display: flex;
            justify-content: center;
            gap: 30px;
            font-size: 14px;
            color: #666;
        }
        
        .patient-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 30px;
            border-left: 4px solid ${this.hospitalConfig.primaryColor};
        }
        
        .patient-info h2 {
            color: ${this.hospitalConfig.primaryColor};
            margin-bottom: 15px;
            font-size: 16px;
        }
        
        .patient-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            font-size: 14px;
        }
        
        .content-section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .section-title {
            color: ${this.hospitalConfig.primaryColor};
            font-size: 18px;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #ddd;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .section-icon {
            font-size: 20px;
        }
        
        .section-description {
            font-style: italic;
            color: #666;
            margin-bottom: 15px;
            font-size: 14px;
        }
        
        .section-content {
            list-style: none;
            padding-left: 0;
        }
        
        .section-content li {
            padding: 8px 0;
            padding-left: 20px;
            position: relative;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .section-content li:before {
            content: "•";
            color: ${this.hospitalConfig.primaryColor};
            font-weight: bold;
            position: absolute;
            left: 0;
        }
        
        .document-footer {
            margin-top: 50px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
            font-size: 12px;
            color: #666;
        }
        
        .disclaimer {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        
        .generation-info {
            text-align: center;
            font-size: 11px;
        }
        
        @media print {
            .document-container {
                max-width: none;
                margin: 0;
                padding: 0.5in;
            }
            
            .content-section {
                page-break-inside: avoid;
            }
        }
        
        @media (max-width: 768px) {
            .document-container {
                padding: 20px;
            }
            
            .hospital-header {
                flex-direction: column;
                text-align: center;
                gap: 15px;
            }
            
            .document-info {
                flex-direction: column;
                gap: 10px;
            }
            
            .patient-details {
                grid-template-columns: 1fr;
            }
        }`;
    }

    // ========== LOCALIZATION METHODS ==========

    /**
     * Get language name from code
     */
    getLanguageName(code) {
        const languages = {
            'en': 'English',
            'es': 'Español (Spanish)',
            'fr': 'Français (French)',
            'de': 'Deutsch (German)',
            'it': 'Italiano (Italian)',
            'pt': 'Português (Portuguese)',
            'zh': '中文 (Chinese)',
            'ja': '日本語 (Japanese)',
            'ko': '한국어 (Korean)',
            'ar': 'العربية (Arabic)',
            'hi': 'हिन्दी (Hindi)'
        };
        return languages[code] || 'Unknown Language';
    }

    /**
     * Get localized section titles
     */
    getLocalizedSectionTitle(section, language) {
        const titles = {
            'en': {
                'diagnoses': 'Diagnoses & Conditions',
                'procedures': 'Procedures & Treatments', 
                'medications': 'Medications',
                'instructions': 'Care Instructions',
                'returnReasons': 'When to Seek Emergency Care',
                'followUp': 'Follow-up Care'
            },
            'es': {
                'diagnoses': 'Diagnósticos y Condiciones',
                'procedures': 'Procedimientos y Tratamientos',
                'medications': 'Medicamentos', 
                'instructions': 'Instrucciones de Cuidado',
                'returnReasons': 'Cuándo Buscar Atención de Emergencia',
                'followUp': 'Atención de Seguimiento'
            }
        };
        return titles[language]?.[section] || titles['en'][section] || section;
    }

    /**
     * Get localized section descriptions
     */
    getLocalizedSectionDescription(section, language) {
        const descriptions = {
            'en': {
                'diagnoses': 'Medical conditions identified during your visit',
                'procedures': 'Medical procedures performed during your stay',
                'medications': 'Prescribed medications and instructions',
                'instructions': 'Important care instructions for your recovery',
                'returnReasons': 'Warning signs that require immediate medical attention',
                'followUp': 'Scheduled appointments and ongoing care requirements'
            },
            'es': {
                'diagnoses': 'Condiciones médicas identificadas durante su visita',
                'procedures': 'Procedimientos médicos realizados durante su estadía',
                'medications': 'Medicamentos recetados e instrucciones',
                'instructions': 'Instrucciones importantes de cuidado para su recuperación',
                'returnReasons': 'Señales de advertencia que requieren atención médica inmediata',
                'followUp': 'Citas programadas y requisitos de atención continua'
            }
        };
        return descriptions[language]?.[section] || descriptions['en'][section] || '';
    }

    /**
     * Get localized text for various UI elements
     */
    getLocalizedText(key, language) {
        const texts = {
            'en': {
                'document_title': 'DISCHARGE INSTRUCTIONS',
                'language': 'Language',
                'date': 'Date',
                'patient_information': 'Patient Information',
                'name': 'Name',
                'date_of_birth': 'Date of Birth',
                'medical_record': 'Medical Record Number',
                'mobile_access': 'Mobile Access',
                'scan_qr': 'Scan QR Code for Mobile Access',
                'qr_instructions': 'Use your smartphone camera or QR scanner app to scan this code and access these instructions on your mobile device in your preferred language.',
                'qr_footer_text': 'QR Code contains encrypted medical data for secure mobile access.',
                'disclaimer_title': 'Important Notice',
                'disclaimer_text': 'This translation is for informational purposes only. Always consult your healthcare provider for medical advice. If you have questions about these instructions, contact your doctor or pharmacist.',
                'generated_on': 'Generated on',
                'generated_by': 'Generated by'
            },
            'es': {
                'document_title': 'INSTRUCCIONES DE ALTA',
                'language': 'Idioma',
                'date': 'Fecha',
                'patient_information': 'Información del Paciente',
                'name': 'Nombre',
                'date_of_birth': 'Fecha de Nacimiento',
                'medical_record': 'Número de Expediente Médico',
                'mobile_access': 'Acceso Móvil',
                'scan_qr': 'Escanee el Código QR para Acceso Móvil',
                'qr_instructions': 'Use la cámara de su teléfono inteligente o una aplicación de escáner QR para escanear este código y acceder a estas instrucciones en su dispositivo móvil en su idioma preferido.',
                'qr_footer_text': 'El código QR contiene datos médicos encriptados para acceso móvil seguro.',
                'disclaimer_title': 'Aviso Importante',
                'disclaimer_text': 'Esta traducción es solo para fines informativos. Siempre consulte a su proveedor de atención médica para obtener consejos médicos. Si tiene preguntas sobre estas instrucciones, comuníquese con su médico o farmacéutico.',
                'generated_on': 'Generado el',
                'generated_by': 'Generado por'
            }
        };
        return texts[language]?.[key] || texts['en'][key] || key;
    }

    // ========== UTILITY METHODS ==========

    /**
     * Generate filename for downloads
     */
    generateFilename(prefix, language, extension = 'pdf') {
        const timestamp = new Date().toISOString().slice(0, 10);
        const langCode = language.toUpperCase();
        return `${prefix}-${langCode}-${timestamp}.${extension}`;
    }

    /**
     * Convert hex color to RGB array
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16), 
            parseInt(result[3], 16)
        ] : [0, 0, 0];
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

// Export for use in main app
window.MedicalDocumentGenerator = MedicalDocumentGenerator;

// Add diagnostic logging
console.log('✅ Enhanced Medical Document Generator with QR Code support loaded');
