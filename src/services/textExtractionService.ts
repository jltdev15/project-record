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
} catch (error) {
  // Fallback to CDN if local worker fails
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export class TextExtractionService {
  /**
   * Extract text content from various file types
   */
  static async extractText(file: File): Promise<string> {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    try {
      // Handle PDF files
      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        return await this.extractFromPDF(file);
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
   * Extract text from PDF files using PDF.js
   */
  private static async extractFromPDF(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          console.log(`Starting PDF extraction for ${file.name}, size: ${file.size} bytes`);
          
          // Try to load PDF document
          const loadingTask = pdfjsLib.getDocument({ 
            data: arrayBuffer,
            verbosity: 0, // Reduce console output
            cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
            cMapPacked: true
          });
          
          const pdf = await loadingTask.promise;
          console.log(`PDF loaded successfully. Pages: ${pdf.numPages}`);
          
          let fullText = '';
          let extractedPages = 0;
          
          // Extract text from all pages
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            try {
              console.log(`Extracting text from page ${pageNum}/${pdf.numPages}`);
              const page = await pdf.getPage(pageNum);
              const textContent = await page.getTextContent();
              
              // More detailed text extraction
              const pageText = textContent.items
                .map((item: any) => {
                  // Handle different text item types
                  if (item.str) {
                    return item.str;
                  } else if (item.transform) {
                    // Handle transformed text
                    return item.str || '';
                  }
                  return '';
                })
                .filter(text => text.trim().length > 0) // Remove empty strings
                .join(' ');
              
              // Alternative extraction method if first method yields little text
              let alternativeText = '';
              if (pageText.length < 50) { // If we got very little text, try alternative method
                try {
                  const textItems = textContent.items
                    .filter((item: any) => item.str && item.str.trim().length > 0)
                    .map((item: any) => item.str);
                  
                  alternativeText = textItems.join(' ');
                  console.log(`Alternative extraction for page ${pageNum}: ${alternativeText.length} characters`);
                } catch (altError) {
                  console.warn(`Alternative extraction failed for page ${pageNum}:`, altError);
                }
              }
              
              const finalPageText = alternativeText.length > pageText.length ? alternativeText : pageText;
              
              if (finalPageText.trim().length > 0) {
                fullText += `\n--- Page ${pageNum} ---\n${finalPageText}\n`;
                extractedPages++;
                console.log(`Page ${pageNum} extracted: ${finalPageText.length} characters`);
              } else {
                console.warn(`Page ${pageNum} had no extractable text`);
              }
            } catch (pageError) {
              console.warn(`Error extracting text from page ${pageNum}:`, pageError);
              // Continue with other pages
            }
          }
          
          const result = fullText.trim();
          console.log(`PDF extraction completed. Pages processed: ${extractedPages}/${pdf.numPages}, Total characters: ${result.length}`);
          
          resolve(result);
        } catch (error) {
          console.error('Error parsing PDF:', error);
          // Return empty string instead of failing completely
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
   * Extract text from Word documents (.docx, .doc)
   */
  private static async extractFromWord(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
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
    return new Promise((resolve, reject) => {
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
                  blankrows: false, // Skip blank rows
                  defval: '' // Default value for empty cells
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
