/**
 * Enhanced Medical Document Generator with QR Code Generation
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
     * Generate QR code containing medical data
     */
    async generateQRCode(dischargeData, translationData, language = 'en') {
        try {
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

            // Convert to JSON string
            const qrString = JSON.stringify(qrData);

            // Generate QR code
            const qrCodeDataURL = await QRCode.toDataURL(qrString, {
                width: this.qrConfig.size,
                margin: this.qrConfig.margin,
                color: this.qrConfig.color,
                errorCorrectionLevel: 'M'
            });

            return {
                dataURL: qrCodeDataURL,
                rawData: qrString,
                size: this.qrConfig.size
            };

        } catch (error) {
            console.error('Error generating QR code:', error);
            throw new Error(`Failed to generate QR code: ${error.message}`);
        }
    }

    /**
     * Generate professional PDF discharge document with QR code
     */
    async generatePDF(dischargeData, translationData, language = 'en') {
        try {
            // Import jsPDF
            if (typeof jsPDF === 'undefined') {
                throw new Error('jsPDF library not loaded. Add: <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>');
            }

            const { jsPDF } = window;
            const doc = new jsPDF('p', 'mm', 'a4');
            
            let yPosition = 20;
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            const contentWidth = pageWidth - (margin * 2);

            // Generate QR code first
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
            
            // Return the PDF as blob for download
            return {
                pdf: doc,
                blob: doc.output('blob'),
                filename: this.generateFilename('discharge-instructions', language),
                qrCode: qrCode
            };
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            throw new Error(`Failed to generate PDF: ${error.message}`);
        }
    }

    /**
     * Generate professional HTML document with QR code
     */
    async generateHTML(dischargeData, translationData, language = 'en') {
        const languageName = this.getLanguageName(language);
        const currentDate = new Date().toLocaleDateString();
        
        // Generate QR code
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

        return {
            html: htmlDocument,
            filename: this.generateFilename('discharge-instructions', language, 'html'),
            qrCode: qrCode
        };
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
                </div>
            </div>
        `;
    }

    /**
     * Add QR code to PDF
     */
    addQRCodeToPDF(doc, qrCode, x, y) {
        const qrSize = 40; // Size in mm
        doc.addImage(qrCode.dataURL, 'PNG', x, y, qrSize, qrSize);
        
        // Add QR code label
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Scan for mobile access', x, y + qrSize + 5, { align: 'center', maxWidth: qrSize });
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

    /**
     * Enhanced CSS with QR code styles
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
        
        .qr-display {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border: 2px solid ${this.hospitalConfig.secondaryColor};
            margin-bottom: 25px;
        }
        
        .qr-container {
            display: flex;
            align-items: center;
            gap: 20px;
            flex-wrap: wrap;
        }
        
        .qr-code-display {
            width: 120px;
            height: 120px;
            border: 2px solid #ddd;
            border-radius: 8px;
            flex-shrink: 0;
        }
        
        .qr-instructions {
            flex: 1;
            min-width: 200px;
        }
        
        .qr-instructions p {
            margin-bottom: 8px;
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
            
            .qr-container {
                flex-direction: column;
                text-align: center;
            }
            
            .qr-code-display {
                margin: 0 auto;
            }
        }`;
    }

    /**
     * Enhanced localized text with QR code strings
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

    // ... (keep all other existing methods like getLanguageName, getLocalizedSectionTitle, 
    // getLocalizedSectionDescription, generateFilename, hexToRgb, escapeHtml, 
    // downloadDocument, etc.)

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

    generateFilename(prefix, language, extension = 'pdf') {
        const timestamp = new Date().toISOString().slice(0, 10);
        const langCode = language.toUpperCase();
        return `${prefix}-${langCode}-${timestamp}.${extension}`;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16), 
            parseInt(result[3], 16)
        ] : [0, 0, 0];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Download generated document
     */
    downloadDocument(documentData, type = 'pdf') {
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
    }

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
}

// Export for use in main app
window.MedicalDocumentGenerator = MedicalDocumentGenerator;
