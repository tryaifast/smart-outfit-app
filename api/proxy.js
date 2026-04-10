// Vercel Edge Function - API 代理
// 解决阿里云百炼 API 的 CORS 问题

export default async function handler(request) {
    // 只允许 POST 请求
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const body = await request.json();
        const { provider, apiKey, messages, model, temperature, max_tokens } = body;

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

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// 处理 OPTIONS 预检请求
export const config = {
    runtime: 'edge'
};
