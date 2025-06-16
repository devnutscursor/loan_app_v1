import fs from 'fs/promises';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extractPdfFieldNames = async () => {
  const filePath = path.join(__dirname,'frontend', 'public', 'forms', 'URLA.pdf');
  const existingPdfBytes = await fs.readFile(filePath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const form = pdfDoc.getForm();

  const fields = form.getFields();
  console.log(`Total fields found: ${fields.length}\n`);
  
  // Group fields by type
  const fieldsByType = {};
  
  fields.forEach((field, index) => {
    const fieldType = field.constructor.name;
    const fieldName = field.getName();
    
    if (!fieldsByType[fieldType]) {
      fieldsByType[fieldType] = [];
    }
    
    fieldsByType[fieldType].push({
      index: index + 1,
      name: fieldName,
      type: fieldType
    });
  });

  // Display fields organized by type
  Object.keys(fieldsByType).forEach(type => {
    console.log(`\n=== ${type} Fields ===`);
    fieldsByType[type].forEach(field => {
      console.log(`${field.index}. ${field.name}`);
      
      // For radio groups, show options
      if (type === 'PDFRadioGroup') {
        try {
          const radioGroup = form.getRadioGroup(field.name);
          const options = radioGroup.getOptions();
          console.log(`   Options: [${options.join(', ')}]`);
        } catch (e) {
          console.log(`   Options: Unable to retrieve`);
        }
      }
    });
  });

  // Filter for Page 6 "About Your Finances" section
  console.log(`\n=== PAGE 6 "ABOUT YOUR FINANCES" FIELDS ===`);
  const page6Fields = fields.filter(field => 
    field.getName().includes('Page6') && 
    (field.getName().includes('_5a') || field.getName().includes('_5b'))
  );
  
  page6Fields.forEach((field, index) => {
    const fieldType = field.constructor.name;
    const fieldName = field.getName();
    console.log(`${index + 1}. ${fieldName} (${fieldType})`);
    
    if (fieldType === 'PDFRadioGroup') {
      try {
        const radioGroup = form.getRadioGroup(fieldName);
        const options = radioGroup.getOptions();
        console.log(`   Options: [${options.join(', ')}]`);
      } catch (e) {
        console.log(`   Options: Unable to retrieve`);
      }
    }
  });
};

extractPdfFieldNames().catch(console.error);