import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import Tesseract from 'tesseract.js';

// Configure PDF.js worker - use CDN as fallback
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url
  ).toString();
} catch {
  // Fallback to CDN if local worker fails
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export class TextExtractionService {
  /**
   * Extract text content from various file types with enhanced error handling
   */
  static async extractText(file: File): Promise<string> {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    try {
      // Handle PDF files with multiple extraction strategies
      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        console.log(`Starting PDF text extraction for: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        
        // For large files, try a quick check to see if it's a scanned PDF
        let extractedText = '';
        if (file.size > 10 * 1024 * 1024) { // 10MB+
          console.log('Large PDF detected, checking if it\'s a scanned document...');
          const quickCheck = await this.quickPDFTextCheck(file);
          if (quickCheck === 0) {
            console.log('Quick check suggests this is a scanned PDF, skipping text extraction and going straight to OCR...');
            extractedText = await this.extractFromPDFWithOCR(file);
          } else {
            console.log('Quick check found text, proceeding with normal extraction...');
            extractedText = await this.extractFromPDF(file);
          }
        } else {
          // Try primary extraction method
          extractedText = await this.extractFromPDF(file);
        }
        
        // If extraction yielded little text, try alternative methods
        if (extractedText.length < 100) {
          console.log('Primary PDF extraction yielded little text, trying alternative methods...');
          const alternativeText = await this.extractFromPDFAlternative(file);
          if (alternativeText.length > extractedText.length) {
            console.log(`Alternative method yielded more text: ${alternativeText.length} vs ${extractedText.length} characters`);
            extractedText = alternativeText;
          }
          
          // If still no text, try OCR fallback for scanned PDFs
          if (extractedText.length < 50) {
            console.log('Text extraction failed, attempting OCR fallback for scanned PDF...');
            console.log('This PDF appears to be image-based (scanned document) - using OCR...');
            console.log('Calling extractFromPDFWithOCR method...');
            const ocrText = await this.extractFromPDFWithOCR(file);
            console.log(`OCR extraction completed. Result length: ${ocrText.length} characters`);
            if (ocrText.length > extractedText.length) {
              console.log(`OCR method yielded more text: ${ocrText.length} vs ${extractedText.length} characters`);
              extractedText = ocrText;
            } else {
              console.log(`OCR also failed to extract text. This might be a very low-quality scan or non-text content.`);
            }
          }
        }
        
        return extractedText;
      }

      // Handle Word documents
      if (
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileType === 'application/msword' ||
        fileName.endsWith('.docx') ||
        fileName.endsWith('.doc')
      ) {
        return await this.extractFromWord(file);
      }

      // Handle Excel files
      if (
        fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        fileType === 'application/vnd.ms-excel' ||
        fileName.endsWith('.xlsx') ||
        fileName.endsWith('.xls')
      ) {
        return await this.extractFromExcel(file);
      }

      // Handle images (PNG, JPG, JPEG) - use OCR
      if (
        fileType === 'image/png' ||
        fileType === 'image/jpeg' ||
        fileType === 'image/jpg' ||
        fileName.endsWith('.png') ||
        fileName.endsWith('.jpg') ||
        fileName.endsWith('.jpeg')
      ) {
        return await this.extractFromImage(file);
      }

      // If file type is not supported, return empty string
      console.warn(`Unsupported file type for text extraction: ${fileType}`);
      return '';
    } catch (error) {
      console.error('Error extracting text from file:', error);
      return '';
    }
  }

  /**
   * Extract text from PDF files using PDF.js with enhanced configuration
   */
  private static async extractFromPDF(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          console.log(`Starting PDF extraction for ${file.name}, size: ${file.size} bytes`);
          
          // Enhanced PDF.js configuration for better text extraction
          const loadingTask = pdfjsLib.getDocument({ 
            data: arrayBuffer,
            verbosity: 0, // Reduce console output
            cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
            cMapPacked: true,
            // Enhanced options for better text extraction
            disableFontFace: false, // Enable font face loading
            disableRange: false, // Enable range requests
            disableStream: false, // Enable streaming
            maxImageSize: -1, // No image size limit
            isEvalSupported: false, // Disable eval for security
            useSystemFonts: true, // Use system fonts
            // Memory management for large files
            stopAtErrors: false // Continue processing even with errors
          });
          
          const pdf = await loadingTask.promise;
          console.log(`PDF loaded successfully. Pages: ${pdf.numPages}`);
          
          let fullText = '';
          let extractedPages = 0;
          const failedPages: number[] = [];
          
          // Extract text from all pages with retry mechanism
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            let pageText = '';
            let retryCount = 0;
            const maxRetries = 1; // Reduced retries since we know this is a scanned PDF
            
            while (retryCount <= maxRetries && !pageText.trim()) {
              try {
                console.log(`Extracting text from page ${pageNum}/${pdf.numPages} (attempt ${retryCount + 1})`);
                const page = await pdf.getPage(pageNum);
                
                // Try multiple text extraction approaches
                let extractedText = '';
                
                // Approach 1: Standard text content
                try {
                  const textContent = await page.getTextContent({
                    includeMarkedContent: true
                  });
                  
                  // Debug logging to understand PDF structure
                  console.log(`Page ${pageNum} textContent:`, {
                    itemsCount: textContent.items.length,
                    items: textContent.items.slice(0, 5), // First 5 items for debugging
                    hasItems: textContent.items.length > 0
                  });
                  
                  extractedText = this.processTextContent(textContent, pageNum);
                } catch (textError) {
                  console.warn(`Standard text extraction failed for page ${pageNum}:`, textError);
                }
                
                // Approach 2: Try without marked content if first approach failed
                if (extractedText.length < 10) {
                  try {
                    console.log(`Trying alternative text extraction for page ${pageNum}...`);
                    const altTextContent = await page.getTextContent({
                      includeMarkedContent: false
                    });
                    
                    console.log(`Page ${pageNum} altTextContent:`, {
                      itemsCount: altTextContent.items.length,
                      hasItems: altTextContent.items.length > 0
                    });
                    
                    const altExtractedText = this.processTextContent(altTextContent, pageNum);
                    if (altExtractedText.length > extractedText.length) {
                      extractedText = altExtractedText;
                      console.log(`Alternative extraction yielded more text: ${altExtractedText.length} characters`);
                    }
                  } catch (altError) {
                    console.warn(`Alternative text extraction failed for page ${pageNum}:`, altError);
                  }
                }
                
                pageText = extractedText;
                
                if (pageText.trim().length > 0) {
                  fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
                  extractedPages++;
                  console.log(`Page ${pageNum} extracted: ${pageText.length} characters`);
                } else if (retryCount === maxRetries) {
                  console.warn(`Page ${pageNum} had no extractable text after ${maxRetries + 1} attempts`);
                  failedPages.push(pageNum);
                }
                
              } catch (pageError) {
                console.warn(`Error extracting text from page ${pageNum} (attempt ${retryCount + 1}):`, pageError);
                retryCount++;
                
                if (retryCount > maxRetries) {
                  failedPages.push(pageNum);
                  console.error(`Failed to extract text from page ${pageNum} after ${maxRetries + 1} attempts`);
                }
              }
            }
            
            // Add small delay between pages to prevent memory issues with large files
            if (pageNum < pdf.numPages) {
              await new Promise(resolve => setTimeout(resolve, 10));
            }
          }
          
          const result = fullText.trim();
          console.log(`PDF extraction completed. Pages processed: ${extractedPages}/${pdf.numPages}, Total characters: ${result.length}`);
          
          if (failedPages.length > 0) {
            console.warn(`Failed to extract text from pages: ${failedPages.join(', ')}`);
          }
          
          // Clean up PDF document to free memory
          pdf.destroy();
          
          resolve(result);
        } catch (error) {
          console.error('Error parsing PDF:', error);
          resolve('');
        }
      };
      
      reader.onerror = () => {
        console.error('Error reading PDF file');
        resolve('');
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Process text content with enhanced extraction logic
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static processTextContent(textContent: { items: any[] }, pageNum: number): string {
    let pageText = '';
    
    try {
      console.log(`Processing text content for page ${pageNum}:`, {
        totalItems: textContent.items.length,
        itemTypes: textContent.items.map((item) => ({
          hasStr: 'str' in item,
          strValue: 'str' in item ? item.str : 'N/A',
          hasTransform: 'transform' in item,
          itemKeys: Object.keys(item)
        })).slice(0, 3) // First 3 items for debugging
      });
      
      // Method 1: Standard text extraction
      const standardText = textContent.items
        .map((item) => {
          if ('str' in item && item.str) {
            return item.str;
          }
          return '';
        })
        .filter((text: string) => text.trim().length > 0)
        .join(' ');
      
      // Method 2: Enhanced extraction with position awareness
      const enhancedText = textContent.items
        .filter((item) => 'str' in item && item.str && item.str.trim().length > 0)
        .sort((a, b) => {
          // Sort by vertical position (top to bottom), then horizontal (left to right)
          const aY = a.transform ? a.transform[5] : 0;
          const bY = b.transform ? b.transform[5] : 0;
          if (Math.abs(aY - bY) > 5) { // Different lines
            return bY - aY; // Higher Y values first (top to bottom)
          }
          const aX = a.transform ? a.transform[4] : 0;
          const bX = b.transform ? b.transform[4] : 0;
          return aX - bX; // Left to right
        })
        .map((item) => item.str || '')
        .join(' ');
      
      // Method 3: Raw text extraction (fallback)
      const rawText = textContent.items
        .filter((item) => 'str' in item && item.str)
        .map((item) => item.str || '')
        .join(' ');
      
      // Choose the best result
      const texts = [standardText, enhancedText, rawText];
      pageText = texts.reduce((best, current) => 
        current.length > best.length ? current : best
      );
      
      // Additional processing for better readability
      pageText = this.cleanExtractedText(pageText);
      
      console.log(`Page ${pageNum} processing: Standard=${standardText.length}, Enhanced=${enhancedText.length}, Raw=${rawText.length}, Final=${pageText.length}`);
      
    } catch (error) {
      console.warn(`Error processing text content for page ${pageNum}:`, error);
    }
    
    return pageText;
  }

  /**
   * Clean and normalize OCR text for better readability
   */
  private static cleanOCRText(text: string): string {
    return text
      // Fix common OCR errors
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
      .replace(/([a-z])(\d)/g, '$1 $2') // Add space between letters and numbers
      .replace(/(\d)([A-Z])/g, '$1 $2') // Add space between numbers and letters
      .replace(/([.!?])([A-Z])/g, '$1 $2') // Add space after sentences
      // Fix common OCR character misrecognitions
      .replace(/[|]/g, 'I') // Fix pipe to I
      .replace(/[0]/g, 'O') // Fix 0 to O in words (context-dependent)
      .replace(/\b0+(\w)/g, 'O$1') // Fix 0 to O at word boundaries
      .replace(/[1]/g, 'l') // Fix 1 to l in words
      .replace(/\b1+(\w)/g, 'l$1') // Fix 1 to l at word boundaries
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  }

  /**
   * Clean and normalize extracted text
   */
  private static cleanExtractedText(text: string): string {
    return text
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Fix common PDF extraction issues
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
      .replace(/([.!?])([A-Z])/g, '$1 $2') // Add space after sentences
      .replace(/([a-z])(\d)/g, '$1 $2') // Add space between letters and numbers
      .replace(/(\d)([A-Z])/g, '$1 $2') // Add space between numbers and letters
      // Remove excessive line breaks
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Trim whitespace
      .trim();
  }

  /**
   * Alternative PDF extraction method for difficult PDFs
   */
  private static async extractFromPDFAlternative(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          console.log(`Starting alternative PDF extraction for ${file.name}`);
          
          // Alternative configuration focused on maximum text extraction
          const loadingTask = pdfjsLib.getDocument({ 
            data: arrayBuffer,
            verbosity: 0,
            cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
            cMapPacked: true,
            // Alternative options for difficult PDFs
            disableFontFace: false,
            disableRange: false,
            disableStream: false,
            maxImageSize: 16777216, // 16MB limit for images
            isEvalSupported: false,
            useSystemFonts: true,
            stopAtErrors: false,
            // Different text layer settings
            // Additional options for better text extraction
            disableAutoFetch: false
          });
          
          const pdf = await loadingTask.promise;
          console.log(`Alternative PDF loaded successfully. Pages: ${pdf.numPages}`);
          
          let fullText = '';
          let extractedPages = 0;
          
          // Process pages with different strategy
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            try {
              console.log(`Alternative extraction from page ${pageNum}/${pdf.numPages}`);
              const page = await pdf.getPage(pageNum);
              
              // Try different text extraction approaches
              const textContent = await page.getTextContent({
                includeMarkedContent: true
              });
              
              // Alternative text processing
              let pageText = '';
              
              // Method 1: Preserve original spacing
              const originalText = textContent.items
                .filter((item) => 'str' in item && item.str)
                .map((item) => ('str' in item ? item.str : '') || '')
                .join('');
              
              // Method 2: With spaces between items
              const spacedText = textContent.items
                .filter((item) => 'str' in item && item.str)
                .map((item) => ('str' in item ? item.str : '') || '')
                .join(' ');
              
              // Method 3: Position-based extraction
              const positionText = textContent.items
                .filter((item) => 'str' in item && item.str)
                .sort((a, b) => {
                  const aY = 'transform' in a && a.transform ? a.transform[5] : 0;
                  const bY = 'transform' in b && b.transform ? b.transform[5] : 0;
                  const aX = 'transform' in a && a.transform ? a.transform[4] : 0;
                  const bX = 'transform' in b && b.transform ? b.transform[4] : 0;
                  
                  if (Math.abs(aY - bY) > 10) {
                    return bY - aY;
                  }
                  return aX - bX;
                })
                .map((item) => ('str' in item ? item.str : '') || '')
                .join(' ');
              
              // Choose the longest result
              const texts = [originalText, spacedText, positionText];
              pageText = texts.reduce((best, current) => 
                current.length > best.length ? current : best
              );
              
              // Additional cleaning
              pageText = this.cleanExtractedText(pageText);
              
              if (pageText.trim().length > 0) {
                fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
                extractedPages++;
                console.log(`Alternative page ${pageNum} extracted: ${pageText.length} characters`);
              }
              
            } catch (pageError) {
              console.warn(`Alternative extraction failed for page ${pageNum}:`, pageError);
            }
          }
          
          const result = fullText.trim();
          console.log(`Alternative PDF extraction completed. Pages processed: ${extractedPages}/${pdf.numPages}, Total characters: ${result.length}`);
          
          // Clean up
          pdf.destroy();
          
          resolve(result);
        } catch (error) {
          console.error('Error in alternative PDF extraction:', error);
          resolve('');
        }
      };
      
      reader.onerror = () => {
        console.error('Error reading PDF file for alternative extraction');
        resolve('');
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Extract text from Word documents (.docx, .doc)
   */
  private static async extractFromWord(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          console.log(`Starting Word extraction for ${file.name}, size: ${file.size} bytes`);
          
          const result = await mammoth.extractRawText({ arrayBuffer });
          const extractedText = result.value;
          
          console.log(`Word extraction completed. Characters extracted: ${extractedText.length}`);
          if (result.messages && result.messages.length > 0) {
            console.log('Word extraction messages:', result.messages);
          }
          
          resolve(extractedText);
        } catch (error) {
          console.error('Error parsing Word document:', error);
          resolve('');
        }
      };
      
      reader.onerror = () => {
        console.error('Error reading Word file');
        resolve('');
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Extract text from Excel files (.xlsx, .xls)
   */
  private static async extractFromExcel(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          console.log(`Starting Excel extraction for ${file.name}, size: ${file.size} bytes`);
          
          const workbook = XLSX.read(arrayBuffer, { 
            type: 'array',
            cellText: false, // Get actual cell values
            cellDates: true, // Convert dates
            raw: false // Convert numbers to strings
          });
          
          console.log(`Excel workbook loaded. Sheets: ${workbook.SheetNames.length}`);
          
          let extractedText = '';
          let processedSheets = 0;
          
          // Extract text from all sheets
          workbook.SheetNames.forEach(sheetName => {
            try {
              const worksheet = workbook.Sheets[sheetName];
              if (worksheet) {
                // Try different extraction methods
                const sheetData = XLSX.utils.sheet_to_txt(worksheet, { 
                  blankrows: false // Skip blank rows
                });
                
                if (sheetData.trim().length > 0) {
                  extractedText += `\n--- Sheet: ${sheetName} ---\n${sheetData}\n`;
                  processedSheets++;
                  console.log(`Sheet ${sheetName} extracted: ${sheetData.length} characters`);
                } else {
                  console.warn(`Sheet ${sheetName} had no extractable data`);
                }
              }
            } catch (sheetError) {
              console.warn(`Error processing sheet ${sheetName}:`, sheetError);
            }
          });
          
          const result = extractedText.trim();
          console.log(`Excel extraction completed. Sheets processed: ${processedSheets}/${workbook.SheetNames.length}, Total characters: ${result.length}`);
          
          resolve(result);
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          resolve('');
        }
      };
      
      reader.onerror = () => {
        console.error('Error reading Excel file');
        resolve('');
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Quick check to see if PDF has extractable text (for large files)
   */
  private static async quickPDFTextCheck(file: File): Promise<number> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const loadingTask = pdfjsLib.getDocument({ 
            data: arrayBuffer,
            verbosity: 0
          });
          
          const pdf = await loadingTask.promise;
          console.log(`Quick check: PDF has ${pdf.numPages} pages`);
          
          // Check only the first page for text
          const page = await pdf.getPage(1);
          const textContent = await page.getTextContent();
          
          const textCount = textContent.items.length;
          console.log(`Quick check: Found ${textCount} text items on first page`);
          
          pdf.destroy();
          resolve(textCount);
        } catch (error) {
          console.warn('Quick PDF check failed:', error);
          resolve(0);
        }
      };
      
      reader.onerror = () => {
        console.error('Error reading PDF for quick check');
        resolve(0);
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Extract text from PDF using OCR (for scanned PDFs)
   */
  private static async extractFromPDFWithOCR(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          console.log(`Starting OCR extraction for scanned PDF: ${file.name}`);
          
          // Load PDF and convert pages to images for OCR
          const loadingTask = pdfjsLib.getDocument({ 
            data: arrayBuffer,
            verbosity: 0,
            cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
            cMapPacked: true
          });
          
          const pdf = await loadingTask.promise;
          console.log(`OCR PDF loaded successfully. Pages: ${pdf.numPages}`);
          
          let fullText = '';
          let processedPages = 0;
          
          // Process each page as an image for OCR
          console.log(`Starting OCR processing for ${pdf.numPages} pages...`);
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) { // Process all pages for better coverage
            try {
              console.log(`Converting page ${pageNum} to image for OCR...`);
              const page = await pdf.getPage(pageNum);
              
              // Set up canvas for rendering
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              if (!context) {
                console.warn(`Could not get canvas context for page ${pageNum}`);
                continue;
              }
              
              // Get viewport and set canvas size with higher resolution
              const viewport = page.getViewport({ scale: 3.0 }); // Even higher scale for better OCR
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              
              // Render page to canvas
              const renderContext = {
                canvasContext: context,
                viewport: viewport
              };
              
              await page.render(renderContext).promise;
              
              // Convert canvas to data URL for OCR
              const dataUrl = canvas.toDataURL('image/png', 1.0); // Maximum quality
              
              // Multi-pass OCR approach for better text extraction
              console.log(`Performing multi-pass OCR on page ${pageNum}...`);
              
              let bestText = '';
              let bestScore = 0;
              
              // Pass 1: Standard OCR with enhanced settings
              try {
                const { data: { text: text1 } } = await Tesseract.recognize(dataUrl, 'eng', {
                  logger: m => console.log(`OCR Page ${pageNum} Pass 1:`, m),
                  // @ts-expect-error - Tesseract.js options not in TypeScript definitions
                  tessedit_pageseg_mode: '1', // Automatic page segmentation with OSD
                  tessedit_ocr_engine_mode: '1', // Neural nets LSTM engine only
                  preserve_interword_spaces: '1'
                });
                
                if (text1.trim().length > bestScore) {
                  bestText = text1;
                  bestScore = text1.trim().length;
                  console.log(`Pass 1: ${text1.length} characters`);
                }
              } catch (error) {
                console.warn(`OCR Pass 1 failed for page ${pageNum}:`, error);
              }
              
              // Pass 2: OCR optimized for single text block
              try {
                const { data: { text: text2 } } = await Tesseract.recognize(dataUrl, 'eng', {
                  logger: m => console.log(`OCR Page ${pageNum} Pass 2:`, m),
                  // @ts-expect-error - Tesseract.js options not in TypeScript definitions
                  tessedit_pageseg_mode: '6', // Single uniform block of text
                  tessedit_ocr_engine_mode: '1',
                  preserve_interword_spaces: '1'
                });
                
                if (text2.trim().length > bestScore) {
                  bestText = text2;
                  bestScore = text2.trim().length;
                  console.log(`Pass 2: ${text2.length} characters (better)`);
                }
              } catch (error) {
                console.warn(`OCR Pass 2 failed for page ${pageNum}:`, error);
              }
              
              // Pass 3: OCR optimized for single text line
              try {
                const { data: { text: text3 } } = await Tesseract.recognize(dataUrl, 'eng', {
                  logger: m => console.log(`OCR Page ${pageNum} Pass 3:`, m),
                  // @ts-expect-error - Tesseract.js options not in TypeScript definitions
                  tessedit_pageseg_mode: '7', // Single text line
                  tessedit_ocr_engine_mode: '1',
                  preserve_interword_spaces: '1'
                });
                
                if (text3.trim().length > bestScore) {
                  bestText = text3;
                  bestScore = text3.trim().length;
                  console.log(`Pass 3: ${text3.length} characters (better)`);
                }
              } catch (error) {
                console.warn(`OCR Pass 3 failed for page ${pageNum}:`, error);
              }
              
              // Pass 4: OCR with character whitelist for better recognition
              try {
                const { data: { text: text4 } } = await Tesseract.recognize(dataUrl, 'eng', {
                  logger: m => console.log(`OCR Page ${pageNum} Pass 4:`, m),
                  // @ts-expect-error - Tesseract.js options not in TypeScript definitions
                  tessedit_pageseg_mode: '1',
                  tessedit_ocr_engine_mode: '1',
                  tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?;:()[]{}\'"-+=*/%$@#&|\\~`^<> ',
                  preserve_interword_spaces: '1'
                });
                
                if (text4.trim().length > bestScore) {
                  bestText = text4;
                  bestScore = text4.trim().length;
                  console.log(`Pass 4: ${text4.length} characters (better)`);
                }
              } catch (error) {
                console.warn(`OCR Pass 4 failed for page ${pageNum}:`, error);
              }
              
              // Use the best result
              const finalText = this.cleanOCRText(bestText);
              
              if (finalText.trim().length > 0) {
                fullText += `\n--- Page ${pageNum} (OCR) ---\n${finalText}\n`;
                processedPages++;
                console.log(`Best OCR result for page ${pageNum}: ${finalText.length} characters`);
              } else {
                console.warn(`All OCR passes failed for page ${pageNum}`);
              }
              
            } catch (pageError) {
              console.warn(`OCR failed for page ${pageNum}:`, pageError);
            }
          }
          
          const result = fullText.trim();
          console.log(`OCR extraction completed. Pages processed: ${processedPages}/${Math.min(pdf.numPages, 3)}, Total characters: ${result.length}`);
          
          // Clean up
          pdf.destroy();
          
          resolve(result);
        } catch (error) {
          console.error('Error in OCR PDF extraction:', error);
          resolve('');
        }
      };
      
      reader.onerror = () => {
        console.error('Error reading PDF file for OCR extraction');
        resolve('');
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Extract text from images using OCR
   */
  private static async extractFromImage(file: File): Promise<string> {
    try {
      // Convert file to data URL for Tesseract
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data: { text } } = await Tesseract.recognize(dataUrl, 'eng', {
        logger: m => console.log(m) // Optional: log OCR progress
      });

      return text.trim();
    } catch (error) {
      console.error('Error performing OCR on image:', error);
      return '';
    }
  }

  /**
   * Check if a file type supports text extraction
   */
  static isTextExtractable(file: File): boolean {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    return (
      // PDF files
      fileType === 'application/pdf' ||
      fileName.endsWith('.pdf') ||
      
      // Word documents
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileType === 'application/msword' ||
      fileName.endsWith('.docx') ||
      fileName.endsWith('.doc') ||
      
      // Excel files
      fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      fileType === 'application/vnd.ms-excel' ||
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls') ||
      
      // Images (for OCR)
      fileType === 'image/png' ||
      fileType === 'image/jpeg' ||
      fileType === 'image/jpg' ||
      fileName.endsWith('.png') ||
      fileName.endsWith('.jpg') ||
      fileName.endsWith('.jpeg')
    );
  }
}
