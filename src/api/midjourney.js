import axios from 'axios';

const API_KEY = '7f246d4ed1mshf25f3e15418900bp1b20e7jsn524c5786ebb3';

export async function generateImage(prompt) {
  const options = {
    method: 'POST',
    url: 'https://chatgpt-42.p.rapidapi.com/texttoimage',
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': 'chatgpt-42.p.rapidapi.com',
      'Content-Type': 'application/json'
    },
    data: {
      text: `${prompt} (without any text in the image)`,
      width: 512,
      height: 512,
      fit: 'contain',
      style: 'natural'
    }
  };

  try {
    const response = await axios.request(options);
    return response.data.generated_image;
  } catch (error) {
    console.error(error);
    throw error;
  }
}