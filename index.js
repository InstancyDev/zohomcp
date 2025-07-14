const express = require('express');
const axios = require('axios');
const qs = require('qs');
require('dotenv').config();

const app = express();
app.use(express.json());

let accessToken = null;

// OAuth Redirect Handler
app.get('/oauth/callback', async (req, res) => {
  const code = req.query.code;
  const tokenUrl = 'https://accounts.zoho.com/oauth/v2/token';
  
  const data = {
    code,
    client_id: process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    redirect_uri: process.env.ZOHO_REDIRECT_URI,
    grant_type: 'authorization_code'
  };

  try {
    const response = await axios.post(tokenUrl, qs.stringify(data), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    accessToken = response.data.access_token;
    res.send('Authorization successful! You can now use Microsoft Copilot.');
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).send('OAuth Error');
  }
});

// Main Query Handler
app.post('/queryZoho', async (req, res) => {
  const query = req.body.query?.toLowerCase() || '';
  if (!accessToken) {
    return res.status(401).json({ error: 'Not authenticated with Zoho yet.' });
  }

  let endpoint = '';
  if (query.includes('lead')) endpoint = 'Leads';
  else if (query.includes('contact')) endpoint = 'Contacts';
  else return res.status(400).json({ error: 'Unsupported module in query.' });

  try {
    const zohoResponse = await axios.get(
      `https://www.zohoapis.com/crm/v2/${endpoint}`,
      { headers: { Authorization: `Zoho-oauthtoken ${accessToken}` } }
    );
    res.json({
      summary: `Retrieved ${zohoResponse.data.data.length} ${endpoint}`,
      results: zohoResponse.data.data
    });
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ error: 'Error fetching from Zoho CRM' });
  }
});

app.get('/', (req, res) => res.send('Zoho Copilot Plugin is live.'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));