# Content Search Testing Guide

## How to Verify Content Search is Working

### 1. Visual Indicators

After uploading documents, you'll see status indicators on each document card:

- **✓ Searchable** (Green badge) - Text content was successfully extracted
- **⚠ Metadata only** (Yellow badge) - Only metadata is searchable, no content extracted

### 2. Testing Steps

#### Step 1: Upload Test Documents

1. **PDF Document Test:**
   - Upload a PDF with text content
   - Look for "✓ Searchable" badge
   - Click the purple document icon to view extracted content
   - Verify the text matches what's in your PDF

2. **Word Document Test:**
   - Upload a .docx or .doc file
   - Check for "✓ Searchable" badge
   - View extracted content to verify accuracy

3. **Excel Document Test:**
   - Upload a .xlsx or .xls file
   - Verify content extraction includes all sheet data
   - Check that text from all sheets is searchable

4. **Image Test (OCR):**
   - Upload a PNG/JPG with text
   - Note: OCR may take longer and be less accurate
   - Check extracted content for text recognition

#### Step 2: Test Search Functionality

1. **Content Search Test:**
   - Use the search box to search for text that appears ONLY in the document content
   - NOT in the title, description, or reference number
   - The document should appear in search results

2. **Search Examples:**
   - Search for a specific word or phrase from inside a PDF
   - Search for data from an Excel spreadsheet
   - Search for text from a Word document paragraph

#### Step 3: Verify Search Results

1. **Check Search Accuracy:**
   - Search results should include documents where the term appears in content
   - Results should also include documents where the term appears in metadata
   - Test with partial words and phrases

2. **Test Different Search Terms:**
   - Try searching for common words
   - Try searching for specific technical terms
   - Try searching for numbers or dates from documents

### 3. Debugging Features

#### Content Preview
- Click the purple document icon on any document card
- View the exact text that was extracted
- Verify it matches the original document content

#### Console Logging
- Open browser developer tools (F12)
- Check console for text extraction logs:
  - "Extracting text content from document..."
  - "Text extraction completed. Content length: X"
  - Any error messages if extraction fails

### 4. Expected Behavior

#### Successful Text Extraction:
- Document shows "✓ Searchable" badge
- Content preview shows extracted text
- Search finds documents based on content
- Console shows successful extraction logs

#### Failed Text Extraction:
- Document shows "⚠ Metadata only" badge
- Content preview shows "No content extracted"
- Search only works on metadata (title, description, reference)
- Console may show error messages

### 5. Troubleshooting

#### If Text Extraction Fails:
1. Check browser console for error messages
2. Verify file type is supported (PDF, Word, Excel, Images)
3. Try with a different file
4. Check if file is corrupted or password-protected

#### If Search Doesn't Work:
1. Verify document shows "✓ Searchable" badge
2. Check that search term appears in extracted content
3. Try searching for terms from title/description first
4. Clear browser cache and try again

### 6. File Type Support

| File Type | Extension | Status | Notes |
|-----------|-----------|--------|-------|
| PDF | .pdf | ✅ Supported | Uses PDF.js |
| Word | .docx, .doc | ✅ Supported | Uses mammoth |
| Excel | .xlsx, .xls | ✅ Supported | Uses xlsx |
| Images | .png, .jpg, .jpeg | ✅ Supported | Uses OCR (Tesseract) |

### 7. Performance Notes

- **PDF files**: May take longer for large files
- **Images**: OCR processing can be slow
- **Excel files**: All sheets are processed
- **Word files**: All text content is extracted

### 8. Testing Checklist

- [ ] Upload a PDF document
- [ ] Verify "✓ Searchable" badge appears
- [ ] Click content preview to see extracted text
- [ ] Search for text that appears only in document content
- [ ] Verify document appears in search results
- [ ] Test with different file types
- [ ] Test search with various terms
- [ ] Check console for any errors

## Success Criteria

Content search is working properly when:
1. Documents show "✓ Searchable" status
2. Content preview shows accurate extracted text
3. Search finds documents based on their actual content
4. No console errors during upload or search
5. All supported file types work correctly
