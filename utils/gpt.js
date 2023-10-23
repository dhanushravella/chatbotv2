require('dotenv').config();
const axios = require('axios');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function getChatGptResponse(prompt) {
    try {
        const response = await axios.post('https://api.openai.com/v1/engines/text-davinci-003/completions', {
            prompt,
            max_tokens: 200,
            temperature: 0
        }, {
            headers: {
                Authorization: `Bearer ${ OPENAI_API_KEY }`,
                'Content-Type': 'application/json'
            }
        });
        //   console.log('======>>',response.data)

        if (response.data.choices && response.data.choices.length > 0) {
            return response.data.choices[0].text;
        }
    } catch (error) {
        console.error('Error getting ChatGPT response:', error.message);
    }

    return 'Resources are busy please try later!';
}

module.exports = { getChatGptResponse };
