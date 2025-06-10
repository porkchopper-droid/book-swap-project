import multer from 'multer';

const storage = multer.memoryStorage();
const parser = multer({ storage });

export default parser;