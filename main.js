// main.js
const fs = require('fs');
const path = require('path');

const rawPath = path.join(__dirname, 'rawdata.txt');
const cleanPath = path.join(__dirname, 'cleanJson.json');

try {
  // Step 1: Read raw JSON from file
  const rawData = fs.readFileSync(rawPath, 'utf-8');

  // Step 2: Parse the main JSON
  const parsed = JSON.parse(rawData);

  // Step 3: Check if 'updated.updated' is a stringified array
  if (
    parsed?.data?.updated?.updated &&
    typeof parsed.data.updated.updated === 'string'
  ) {
    parsed.data.updated.updated = JSON.parse(parsed.data.updated.updated);

    // Step 4: For each invoice, parse the 'attachment' field if it's a string
    parsed.data.updated.updated.forEach((item) => {
      const attachment = item?.invoice?.attachment;
      if (attachment && typeof attachment === 'string') {
        try {
          item.invoice.attachment = JSON.parse(attachment);
        } catch (err) {
          console.warn(`⚠️ Could not parse attachment for invoice: ${item.invoice?.name}`);
        }
      }
    });
  }

  // Step 5: Write clean, formatted JSON to output file
  fs.writeFileSync(cleanPath, JSON.stringify(parsed, null, 2), 'utf-8');
  console.log('✅ Clean JSON written to cleanJson.json');
} catch (err) {
  console.error('❌ Error:', err.message);
}

