// extractFields.mjs
import fs from 'fs/promises';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extractPdfFieldNames = async () => {
  const filePath = path.join(__dirname,'frontend', 'public', 'forms', 'URLA.pdf'); // or 'URLD.pdf'
  const existingPdfBytes = await fs.readFile(filePath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const form = pdfDoc.getForm();

  const fields = form.getFields();
  console.log(`Total fields found: ${fields.length}\n`);
  fields.forEach((field, index) => {
    console.log(`${index + 1}. ${field.getName()} (${field.constructor.name})`);
  });
};

extractPdfFieldNames().catch(console.error);
