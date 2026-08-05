import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const match = envFile.match(/GEMINI_API_KEY_1=(.*)/);
if (match) {
  const key = match[1].trim();
  const genAI = new GoogleGenerativeAI(key);
  
  async function testModel(modelName) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Say 'hello' in one word.");
      console.log(`[SUCCESS] ${modelName}:`, result.response.text());
    } catch (e) {
      console.log(`[ERROR] ${modelName}:`, e.message);
    }
  }

  (async () => {
    await testModel("gemini-2.5-flash");
    await testModel("gemini-flash-latest");
    await testModel("gemini-3.5-flash");
  })();
}
