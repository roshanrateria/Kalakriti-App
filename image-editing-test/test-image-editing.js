import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // API key from environment variable
  const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_AI_API_KEY || "YOUR_API_KEY_HERE"
  });

  // Use a sample image path - you'll need to provide your own image
  const imagePath = path.join(__dirname, "cat_image.png");
  
  // Check if image exists
  if (!fs.existsSync(imagePath)) {
    console.error(`Image not found at ${imagePath}`);
    console.log("Please place a cat_image.png file in the project directory.");
    return;
  }

  console.log("Reading image from:", imagePath);
  const imageData = fs.readFileSync(imagePath);
  const base64Image = imageData.toString("base64");

  const prompt = [
    { 
      text: "Create a picture of my cat eating a nano-banana in a fancy restaurant under the Gemini constellation" 
    },
    {
      inlineData: {
        mimeType: "image/png",
        data: base64Image,
      },
    },
  ];

  console.log("Sending request to Gemini API...");
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: prompt,
    });

    console.log("Response received!");
    
    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        console.log("Text response:", part.text);
      } else if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");
        const outputPath = path.join(__dirname, "gemini-native-image.png");
        fs.writeFileSync(outputPath, buffer);
        console.log("Image saved as:", outputPath);
      }
    }
  } catch (error) {
    console.error("Error generating content:", error.message);
    if (error.response) {
      console.error("Response error:", error.response);
    }
  }
}

main();
