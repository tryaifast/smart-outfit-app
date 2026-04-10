// Vercel Serverless Function - API 代理
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // CORS 预检
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { provider, apiKey, messages, model, temperature, max_tokens } = req.body;

        if (!apiKey) {
            return res.status(400).json({ error: 'Missing apiKey' });
        }

        let apiUrl, requestBody, headers;

        if (provider === 'aliyun') {
            apiUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
            requestBody = {
                model: model || 'qwen-max',
                input: { messages },
                parameters: {
                    temperature: temperature || 0.7,
                    max_tokens: max_tokens || 2000,
                    result_format: 'message'
                }
            };
            headers = apiKey.startsWith('sk-sp-') 
                ? { 'X-DashScope-API-Key': apiKey }
                : { 'Authorization': `Bearer ${apiKey}` };
        } else {
            apiUrl = 'https://api.moonshot.cn/v1/chat/completions';
            requestBody = {
                model: model || 'kimi-k2.5',
                messages,
                temperature: temperature || 0.7,
                max_tokens: max_tokens || 2000
            };
            headers = { 'Authorization': `Bearer ${apiKey}` };
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(response.status).json(data);
    } catch (error) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(500).json({ error: error.message });
    }
};
