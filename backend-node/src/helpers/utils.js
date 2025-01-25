const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const Document = require('../models/Document');

async function uploadDocument(file, metadata, userId) {
  const { title, category, docScope, language, bot_id } = metadata;

  // Validation
  if (!title?.trim()) throw new Error('Title is required');
  if (!file) throw new Error('No file uploaded');
  if (!category) throw new Error('Category is required');
  if (!docScope) throw new Error('Document Scope is required');
  if (!language) throw new Error('Language is required');
  if (!bot_id) throw new Error('Bot ID is required');


  console.log('File object:', file);
  console.log('Metadata:', metadata);

  // Create document record
  const newDoc = new Document({
    title,
    bot_id,
    filePath: file.path,
    uploaderId: userId,
    status: 'processing', // Add status field to your schema
    processingError: null,
    category,
    docScope,
    language,
  });

  await newDoc.save();
  const pdfFullPath = path.resolve(file.path).replace(/\\/g, '/'); // Replace backslashes
  const aiServiceUrl = process.env.AI_SERVICE_URL;

  if (!fs.existsSync(pdfFullPath)) {
    newDoc.status = 'failed';
    newDoc.processingError = 'File not found on server';
    await newDoc.save();
    throw new Error('Uploaded file not found on server.');
  }

  try {
    // Process with AI service asynchronously
    const form = new FormData();
    form.append('doc_ids', newDoc._id.toString());       // Use plural form
    form.append('pdf_paths', pdfFullPath);
    form.append('doc_scopes', docScope);
    form.append('categories', category);
    form.append('languages', language);
    form.append('bot_ids', bot_id.toString());

    const response = await axios.post(`${aiServiceUrl}/embed_documents`, form, {
      headers: form.getHeaders(),
      timeout: 300000, // 5-minute timeout
    });

    // Update document status on success
    newDoc.status = 'completed';
    newDoc.processingError = null;
    await newDoc.save();

    return {
      docId: newDoc._id,
      chunksAdded: response.data.chunks_added,
    };
  } catch (error) {
    newDoc.status = 'failed';
    newDoc.processingError = error.message;
    await newDoc.save();
    throw error;
  }
}

module.exports = {
  uploadDocument,
};
