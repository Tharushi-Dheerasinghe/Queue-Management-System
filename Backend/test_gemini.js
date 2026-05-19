import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI('AIzaSyC0sjSGXqEWi0XfYlMDGZ04v0tgHBLw9i8');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
model.generateContent('hello').then(res => console.log(res.response.text())).catch(e => console.error('ERROR:', e.message));
