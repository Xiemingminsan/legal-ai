// src/helpers/extractor.js
const fs = require('fs').promises;  // Use promises version of fs
const path = require('path');
const pdf = require('pdf-parse');
const sharp = require('sharp');

// PDF Parser
const parsePDF = async (filePath) => {
  try {
    // Read file as buffer
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    
    if (!data || !data.text) {
      throw new Error('PDF parsing resulted in empty content');
    }
    
    return {
      text: data.text,
      pageCount: data.numpages,
      metadata: data.info
    };
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error(`PDF processing failed: ${error.message}`);
  }
};

// Text file processor
const processTxt = async (filePath) => {
  try {
    // Read file as text
    const text = await fs.readFile(filePath, 'utf8');
    
    // Get text statistics
    const charCount = text.length;
    const lineCount = text.split('\n').length;
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    
    // Get file stats
    const stats = await fs.stat(filePath);
    
    return {
      text: text,
      metadata: {
        encoding: 'utf8',
        charCount,
        lineCount,
        wordCount,
        fileSize: stats.size,
        modifiedAt: stats.mtime
      }
    };
  } catch (error) {
    console.error("Error processing TXT file:", error);
    throw new Error(`TXT processing failed: ${error.message}`);
  }
};

// Image processor
const processImage = async (filePath, mimeType) => {
  try {
    // Read the image file
    const imageBuffer = await fs.readFile(filePath);
    
    // Convert image to base64
    const base64Image = imageBuffer.toString('base64');
    
    // Get image metadata using sharp
    const metadata = await sharp(imageBuffer).metadata();
    
    return {
      base64: base64Image,
      mimeType: mimeType,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format
      }
    };
  } catch (error) {
    console.error("Error processing image:", error);
    throw new Error(`Image processing failed: ${error.message}`);
  }
};

// Main file processor
const processUploadedFile = async (file) => {
  const { mimetype, path: filePath } = file;
  
  try {
    console.log(`Processing file: ${filePath} with mime type: ${mimetype}`);

    // Define supported mime types
    const supportedTypes = {
      'application/pdf': parsePDF,
      'text/plain': processTxt,
      'image/jpeg': processImage,
      'image/png': processImage,
      'image/jpg': processImage,
    };

    // Check if mime type is supported
    const processor = supportedTypes[mimetype];
    if (!processor) {
      throw new Error(`Unsupported file type: ${mimetype}`);
    }

    // Process the file based on its type
    const result = await processor(filePath, mimetype);

    // Return standardized response
    return {
      type: mimetype.split('/')[0], // 'application' -> 'pdf', 'image' -> 'image', etc.
      content: result.text || result.base64, // text for documents, base64 for images
      metadata: result.metadata,
      mimeType: mimetype
    };

  } catch (error) {
    console.error(`Error processing file: ${error.message}`);
    throw error;
  } finally {
    // Cleanup: Remove the temporary file
    try {
      await fs.unlink(filePath);
    } catch (cleanupError) {
      console.error(`Failed to cleanup file ${filePath}:`, cleanupError);
    }
  }
};

module.exports = { processUploadedFile };