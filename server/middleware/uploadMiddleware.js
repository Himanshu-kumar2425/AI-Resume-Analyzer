const multer = require('multer');

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];

const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5 MB

/**
 * Validates both MIME type AND file extension.
 * A mismatch between the two results in rejection (REQ-UPLOAD-05).
 */
const fileFilter = (req, file, cb) => {
  const ext = '.' + file.originalname.split('.').pop().toLowerCase();

  const mimeOk = ALLOWED_MIME_TYPES.includes(file.mimetype);
  const extOk = ALLOWED_EXTENSIONS.includes(ext);

  if (mimeOk && extOk) {
    cb(null, true);
  } else {
    const err = new Error('Only PDF and DOCX files are accepted.');
    err.statusCode = 400;
    cb(err, false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(), // keep file in memory — no disk writes on Render
  fileFilter,
  limits: { fileSize: FILE_SIZE_LIMIT },
});

/**
 * Single-file upload middleware for the 'resume' field.
 * Converts Multer errors into the standard { error } shape.
 */
const uploadResume = (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size must not exceed 5 MB.' });
    }

    if (err) {
      return res.status(400).json({ error: err.message || 'File upload failed.' });
    }
  });
};

module.exports = { uploadResume };
