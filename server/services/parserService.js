const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Operational error for parse failures — flagged so errorMiddleware
 * knows it can expose the message safely.
 */
class ParseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ParseError';
    this.statusCode = 422;
    this.isOperational = true;
  }
}

/**
 * Extracts plain text from a file buffer.
 * @param {Buffer} buffer    - raw file bytes
 * @param {string} mimetype  - validated MIME type from Multer
 * @returns {Promise<string>} extracted text
 * @throws {ParseError} if text is empty or type is unsupported
 */
const extractText = async (buffer, mimetype) => {
  let text = '';

  if (mimetype === 'application/pdf') {
    const result = await pdfParse(buffer);
    text = result.text;
  } else if (
    mimetype ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else {
    throw new ParseError('Unsupported file type.');
  }

  if (!text || text.trim().length === 0) {
    throw new ParseError(
      'Could not extract text from the uploaded file. Please ensure the file is not scanned or image-based.'
    );
  }

  return text.trim();
};

module.exports = { extractText, ParseError };
