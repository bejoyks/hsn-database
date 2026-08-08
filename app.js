/** @format */

import axios from "axios";
import fs from "fs";

const HSN_DATA_URL = "https://raw.githubusercontent.com/QuantumByteStudios/gst-hsn-sac-codes/main/data/hsn_codes.json";

async function writeFile(file, text) {
  const dir = file.substring(0, file.lastIndexOf('/'));
  if (dir && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const stream = fs.createWriteStream(file);
  return stream.write(text);
}

function generateHtmlTable(data) {
  let html = `<!DOCTYPE html>
<html>
<head>
  <style>
    #goods_table { font-family: Arial, sans-serif; border-collapse: collapse; width: 100%; }
    #goods_table td, #goods_table th { border: 1px solid #ddd; padding: 8px; }
    #goods_table tr:nth-child(even){background-color: #f2f2f2;}
    #goods_table th { padding-top: 12px; padding-bottom: 12px; text-align: left; background-color: #397eb9; color: white; }
  </style>
</head>
<body>
  <h2>8-Digit HSN Codes and GST Rates</h2>
  <table id="goods_table">
    <thead>
      <tr>
        <th>HSN Code</th>
        <th>Description</th>
        <th>CGST</th>
        <th>SGST</th>
        <th>IGST</th>
      </tr>
    </thead>
    <tbody>`;
  
  data.forEach(item => {
    html += `
      <tr>
        <td>${item.hsn}</td>
        <td>${item.description}</td>
        <td>${item.CGST}</td>
        <td>${item.SGST}</td>
        <td>${item.IGST}</td>
      </tr>`;
  });

  html += `
    </tbody>
  </table>
</body>
</html>`;
  return html;
}

async function main() {
  console.log("Fetching 8-digit HSN code database...");
  try {
    const response = await axios.get(HSN_DATA_URL);
    const rawData = response.data;
    
    console.log(`Fetched ${rawData.length} entries. Processing all HSN codes...`);
    
    // Filter and map to original format
    const processedData = rawData
      .filter(item => item.code)
      .map(item => ({
        hsn: item.code.toString().trim(),
        description: item.description ? item.description.trim() : "",
        CGST: item.cgst_rate !== undefined ? `${item.cgst_rate}%` : "0%",
        SGST: item.sgst_rate !== undefined ? `${item.sgst_rate}%` : "0%",
        IGST: item.igst_rate !== undefined ? `${item.igst_rate}%` : "0%"
      }));

    console.log(`Found ${processedData.length} total HSN codes. Saving outputs...`);

    // Save JSON output
    const json = JSON.stringify(processedData, null, 2);
    const timestamp = Math.floor(Date.now() / 1000);
    const jsonPath = `./output/hsn-${timestamp}.json`;
    const staticJsonPath = `./output/hsn-all.json`;
    await writeFile(jsonPath, json);
    await writeFile(staticJsonPath, json);
    console.log(`Saved JSON: ${jsonPath}`);
    console.log(`Saved JSON Copy: ${staticJsonPath}`);

    // Save HTML output
    const html = generateHtmlTable(processedData);
    const htmlPath = "./output/table.html";
    await writeFile(htmlPath, html);
    console.log(`Saved HTML: ${htmlPath}`);

    console.log("Success! Processing finished.");
  } catch (error) {
    console.error("An error occurred during execution:", error.message);
  }
}

main();
