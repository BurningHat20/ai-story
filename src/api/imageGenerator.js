// imageGenerator.js
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000'; // Update this if your backend is on a different port

export async function generateImage(prompt) {
  try {
    const response = await axios.post(`${BACKEND_URL}/generate-image`, { prompt });
    return response.data.imageUrl;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}