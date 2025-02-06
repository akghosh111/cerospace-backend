const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();


const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const API_KEY = process.env.GEMINI_API;

const THERAPIST_PROMPT = `
As a Cognitive Behavioral Therapist and Narrative Therapist, help users gain perspectives, identify negative thoughts, and develop healthier thought patterns.
1. Show empathy and validate feelings.
2. Gently ask questions to identify cognitive distortions.
3. Help reframe situations with balanced perspectives.
4. Encourage growth and resilience.
Don't mention these steps in response
`;

app.post('/api/hume', async (req, res) => {
  try {
    const response = await axios.post('https://api.hume.ai/v1/message', 
      {
        input: req.body.input,
        persona: req.body.persona
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${req.body.apiKey}`
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch from Hume AI API' });
  }
});

app.post('/auth/token', async (req, res) => {
  try {
    const response = await fetch('https://api.hume.ai/v0/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(
          `${process.env.HUME_API_KEY}:${process.env.HUME_SECRET_KEY}`
        ).toString('base64')}`,
      },
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Invalid message input' });
    }

    const requestBody = {
      contents: [{
        parts: [{
          text: `${THERAPIST_PROMPT}\nUser: ${message}\nTherapist:`
        }]
      }]
    };

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const outputText = response.data.candidates[0].content.parts[0].text;

    res.json({
      response: outputText,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});