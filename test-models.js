import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf8');
const match = envFile.match(/GEMINI_API_KEY_1=(.*)/);
if (match) {
  const key = match[1].trim();
  fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
    .then(r => r.json())
    .then(data => console.log("AVAILABLE MODELS:", data.models?.map(m => m.name).join('\n')))
    .catch(console.error);
} else {
  console.log("No key found");
}
