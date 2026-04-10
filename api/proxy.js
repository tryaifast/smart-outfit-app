// Vercel Serverless Function - API 代理
// 解决阿里云百炼 API 的 CORS 问题

module.exports = async (req, res) => {
    // 处理 CORS 预检请求
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).end();
    }

    // 只允许 POST 请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { provider, apiKey, messages, model, temperature, max_tokens } = req.body;

        // 验证必填参数
        if (!apiKey) {
            return res.status(400).json({ error: 'Missing apiKey in request body' });
        }

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Missing or invalid messages in request body' });
        }

        let apiUrl, requestBody;

        if (provider === 'aliyun') {
            // 阿里云百炼 API
            apiUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
            requestBody = {
                model: model || 'qwen-max',
                input: {
                    messages: messages
                },
                parameters: {
                    temperature: temperature || 0.7,
                    max_tokens: max_tokens || 2000,
                    result_format: 'message'
                }
            };
        } else {
            // Kimi API
            apiUrl = 'https://api.moonshot.cn/v1/chat/completions';
            requestBody = {
                model: model || 'kimi-k2.5',
                messages: messages,
                temperature: temperature || 0.7,
                max_tokens: max_tokens || 2000
            };
        }

        // 阿里云百炼支持两种认证方式
        let headers;
        if (provider === 'aliyun') {
            if (apiKey.startsWith('sk-sp-')) {
                // 应用 Key 格式：使用 X-DashScope-API-Key
                headers = {
                    'Content-Type': 'application/json',
                    'X-DashScope-API-Key': apiKey
                };
            } else {
                // 标准 Key 格式：使用 Bearer
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                };
            }
        } else {
            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            };
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        // 设置 CORS 头
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');
        return res.status(response.status).json(data);
    } catch (error) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(500).json({ error: error.message, stack: error.stack });
    }
};
