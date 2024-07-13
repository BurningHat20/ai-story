import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = 'AIzaSyDvzBxfkN1HCykPlqK0OKEarXImlf9BX2w';
const genAI = new GoogleGenerativeAI(API_KEY);

export async function generateStory(prompt) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(`${prompt}\n\nPlease write a story with a title and exactly 3 paragraphs. Format it as follows:\nTitle: [Your Title]\n\n[First Paragraph]\n\n[Second Paragraph]\n\n[Third Paragraph]`);
    const response = await result.response;
    return response.text();
  }