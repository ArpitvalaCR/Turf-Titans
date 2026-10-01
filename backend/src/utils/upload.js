import multer from 'multer';
import ApiError from './ApiError.js';

const storage = multer.memoryStorage();

const imageMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const videoMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
const pdfMimeTypes = ['application/pdf'];
const paymentMimeTypes = [...imageMimeTypes, 'application/pdf'];

const createFileFilter = (allowedMimeTypes) => (_req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `Invalid file type: ${file.mimetype}. Expected: ${allowedMimeTypes.join(', ')}`), false);
  }
};

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: createFileFilter(imageMimeTypes),
});

export const uploadPdf = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: createFileFilter(pdfMimeTypes),
});

export const uploadVideo = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: createFileFilter(videoMimeTypes),
});

export const uploadPaymentProof = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: createFileFilter(paymentMimeTypes),
});

export const uploadMedia = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: createFileFilter([...imageMimeTypes, ...videoMimeTypes]),
});

export const handleMulterError = (err, _req, _res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(400, 'File too large'));
    }
    return next(new ApiError(400, err.message));
  }
  return next(err);
};
