// Enhanced parsePDF function
const pdf = require('pdf-parse');
const sharp = require('sharp');

const parsePDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    
    // Additional error checking
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
    throw error; // Propagate error for proper handling
  }
};

const processTxt = (filePath) => {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    
    // Get text statistics
    const charCount = text.length;
    const lineCount = text.split('\n').length;
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    
    // Get file stats
    const stats = fs.statSync(filePath);
    
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

// Image processing function
const processImage = async (filePath, mimeType) => {
  try {
    // Read the image file
    const imageBuffer = await fs.promises.readFile(filePath);
    
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
    throw error;
  }
};

// Enhanced file processor
const processUploadedFile = async (file) => {
  const { mimetype, path: filePath } = file;
  
  try {
    if (mimetype === 'application/pdf') {
      const pdfData = await parsePDF(filePath);
      return {
        type: 'pdf',
        content: pdfData.text,
        metadata: {
          pageCount: pdfData.pageCount,
          ...pdfData.metadata
        }
      };
    } else if (mimetype.startsWith('image/')) {
      const imageData = await processImage(filePath, mimetype);
      return {
        type: 'image',
        content: imageData.base64,
        metadata: imageData.metadata,
        mimeType: imageData.mimeType
      };
    } else if (mimetype === 'text/plain') {
      const txtData = processTxt(filePath);
      return {
        type: 'text',
        content: txtData.text,
        metadata: {
          fileName: path.basename(filePath),
          ...txtData.metadata
        }
      };
    }
       
    throw new Error(`Unsupported file type: ${mimetype}`);
  } catch (error) {
    console.error(`Error processing file: ${error.message}`);
    throw error;
  }
};

module.exports = { processUploadedFile };
