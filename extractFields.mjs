import fs from 'fs/promises';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extractPdfFieldValues = async () => {
  const filePath = path.join(__dirname, 'frontend', 'public', 'forms', 'URLA.pdf');
  const existingPdfBytes = await fs.readFile(filePath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const form = pdfDoc.getForm();

  const fields = form.getFields();
  console.log(`Total fields found: ${fields.length}\n`);

  fields.forEach(field => {
    const name = field.getName();
    const type = field.constructor.name;
    let value = '';

    try {
      if (type === 'PDFTextField') {
        value = field.getText();
      } else if (type === 'PDFCheckBox') {
        value = field.isChecked();
      } else if (type === 'PDFRadioGroup') {
        value = field.getSelected();
      } else if (type === 'PDFDropdown') {
        value = field.getSelected();
      } else {
        value = '[Unknown field type]';
      }
    } catch (e) {
      value = `[Error reading value: ${e.message}]`;
    }

    console.log(`${type}: ${name} = ${value}`);
  });
};

extractPdfFieldValues().catch(console.error);