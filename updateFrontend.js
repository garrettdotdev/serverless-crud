const fs = require('fs');
const { execSync } = require('child_process');

try {
  // Run the Serverless command to get the output with API URL, redirect stderr to stdout
  const stdout = execSync('serverless info --verbose 2>&1', { encoding: 'utf-8' });

  console.log('Successfully fetched Serverless info output.');
  console.log('stdout = ' + stdout);  // Debugging: log the full output to verify

  // Extract the API Gateway URL from the Serverless output
  const apiUrlMatch = stdout.match(/ServiceEndpoint:\s+(https:\/\/[^\s]+)/);
  if (!apiUrlMatch) {
    console.error('API Gateway URL not found in serverless output.');
    console.log('Serverless info output:', stdout);  // Output for debugging
    return;
  }

  const apiUrl = apiUrlMatch[1];
  console.log(`Extracted API Gateway URL: ${apiUrl}`);

  // Read the app.js file to replace the placeholder
  const filePath = './frontend/app.js';
  fs.readFile(filePath, 'utf8', (readErr, data) => {
    if (readErr) {
      console.error(`Error reading app.js: ${readErr.message}`);
      return;
    }

    // Replace the placeholder with the real API URL
    const updatedData = data.replace(/const apiUrl = '.*';/, `const apiUrl = '${apiUrl}';`);

    // Write the updated content back to app.js
    fs.writeFile(filePath, updatedData, 'utf8', (writeErr) => {
      if (writeErr) {
        console.error(`Error writing updated app.js: ${writeErr.message}`);
        return;
      }

      console.log(`Successfully updated app.js with API Gateway URL: ${apiUrl}`);
    });
  });
} catch (error) {
  console.error(`Error running serverless info: ${error.message}`);
  console.error(error.stack);  // Additional debugging to understand the error
}
