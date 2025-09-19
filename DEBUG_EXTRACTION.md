# Debugging Text Extraction Issues

## Why Extracted Content Might Be Limited

### Common Causes:

1. **PDF Issues:**
   - Scanned PDFs (images) - need OCR
   - Password-protected PDFs
   - Complex layouts with tables/images
   - Text in unusual fonts or encodings
   - Multi-column layouts

2. **Word Document Issues:**
   - Complex formatting
   - Tables and images
   - Headers/footers not extracted
   - Text in text boxes or shapes

3. **Excel Issues:**
   - Charts and images
   - Complex formulas
   - Hidden sheets
   - Merged cells

4. **Image Issues:**
   - Poor image quality
   - Handwritten text
   - Unusual fonts
   - Low contrast

## How to Debug

### 1. Check Console Logs
Open browser developer tools (F12) and look for:
- `Starting PDF extraction for filename.pdf, size: X bytes`
- `PDF loaded successfully. Pages: X`
- `Page 1 extracted: X characters`
- `PDF extraction completed. Pages processed: X/Y, Total characters: X`

### 2. Check Content Preview
- Click the purple document icon on any document card
- See exactly what text was extracted
- Compare with original document

### 3. Check Character Count
- Look at the "✓ Searchable (X chars)" badge
- If it shows very few characters, extraction may have failed

## Expected Character Counts

| Document Type | Expected Range | Notes |
|---------------|----------------|-------|
| PDF (1 page) | 500-5000 chars | Depends on content density |
| Word (1 page) | 1000-8000 chars | Usually more than PDF |
| Excel (1 sheet) | 200-2000 chars | Depends on data |
| Image (OCR) | 50-2000 chars | Very variable |

## Troubleshooting Steps

### If PDF extraction is poor:
1. Try a different PDF file
2. Check if PDF is searchable (try Ctrl+F in PDF viewer)
3. Look for console errors
4. Try a simpler PDF layout

### If Word extraction is poor:
1. Check if document has complex formatting
2. Try saving as .docx instead of .doc
3. Look for console messages from mammoth

### If Excel extraction is poor:
1. Check if sheets have data
2. Look for hidden sheets
3. Try with a simpler spreadsheet

### If Image OCR is poor:
1. Use higher resolution images
2. Ensure good contrast
3. Try with printed text (not handwritten)
4. Use clear, readable fonts

## Testing with Different Files

Try uploading these types of files to test:

1. **Simple PDF** - Text-only, single column
2. **Complex PDF** - Multi-column, tables, images
3. **Word document** - With tables and formatting
4. **Excel spreadsheet** - With multiple sheets and data
5. **Image with text** - Clear, high-contrast text

## What to Look For

### Good Extraction:
- Character count matches document size
- Content preview shows readable text
- Search finds documents based on content
- Console shows successful extraction logs

### Poor Extraction:
- Very low character count
- Content preview shows garbled text
- Search doesn't find content
- Console shows errors or warnings

## Next Steps

If extraction is still poor:
1. Check the specific file type and format
2. Try with a different file
3. Look at console logs for specific errors
4. Consider the document complexity
5. Test with simpler documents first
