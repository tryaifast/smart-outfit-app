/**
 * Cloudflare Worker - AI API 代理
 * 支持 Kimi / 阿里云百炼 / OpenAI
 * 
 * 部署说明:
 * 1. 登录 https://dash.cloudflare.com
 * 2. 创建 Worker
 * 3. 粘贴此代码
 * 4. 设置环境变量: KIMI_API_KEY, ALIYUN_API_KEY, OPENAI_API_KEY
 */

// CORS 头配置
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

export default {
    async fetch(request, env) {
        // 处理 OPTIONS 预检请求
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // 只接受 POST 请求
        if (request.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: corsHeaders
            });
        }

        try {
            const body = await request.json();
            const { provider = 'kimi', messages, temperature = 0.7, max_tokens = 2000 } = body;

            if (!messages || !Array.isArray(messages)) {
                return new Response(JSON.stringify({ error: 'Missing messages' }), {
                    status: 400,
                    headers: corsHeaders
                });
            }

            let response;

            switch (provider) {
                case 'kimi':
                    response = await callKimi(messages, temperature, max_tokens, env.KIMI_API_KEY);
                    break;
                case 'aliyun':
                    response = await callAliyun(messages, temperature, max_tokens, env.ALIYUN_API_KEY);
                    break;
                case 'openai':
                    response = await callOpenAI(messages, temperature, max_tokens, env.OPENAI_API_KEY);
                    break;
                default:
                    return new Response(JSON.stringify({ error: 'Unknown provider' }), {
                        status: 400,
                        headers: corsHeaders
                    });
            }

            return new Response(JSON.stringify(response), {
                headers: corsHeaders
            });

        } catch (error) {
            console.error('Proxy error:', error);
            return new Response(JSON.stringify({ 
                error: 'Internal server error',
                message: error.message 
            }), {
                status: 500,
                headers: corsHeaders
            });
        }
    }
};

// Kimi API 调用
async function callKimi(messages, temperature, max_tokens, apiKey) {
    if (!apiKey) {
        throw new Error('KIMI_API_KEY not configured');
    }

    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'kimi-k2.5',
            messages,
            temperature,
            max_tokens
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Kimi API error: ${response.status} - ${error}`);
    }

    return await response.json();
}

// 阿里云百炼 API 调用
async function callAliyun(messages, temperature, max_tokens, apiKey) {
    if (!apiKey) {
        throw new Error('ALIYUN_API_KEY not configured');
    }

    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'qwen-max',
            input: {
                messages
            },
            parameters: {
                temperature,
                max_tokens,
                result_format: 'message'
            }
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Aliyun API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    // 转换为标准格式
    return {
        choices: [{
            message: {
                role: 'assistant',
                content: data.output?.text || data.output?.choices?.[0]?.message?.content || ''
            }
        }]
    };
}

// OpenAI API 调用
async function callOpenAI(messages, temperature, max_tokens, apiKey) {
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages,
            temperature,
            max_tokens
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    return await response.json();
}
