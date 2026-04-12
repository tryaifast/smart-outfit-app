/**
 * @fileoverview API 模块 - 封装所有外部 API 调用，带缓存和性能优化
 * @module api
 * @description 提供请求缓存、自动重试、请求去重、超时控制等功能
 * @author Smart Outfit Team
 * @version 2.0
 */

/**
 * API 管理类
 * @class API
 * @description 封装外部 API 调用，提供高性能缓存和错误恢复
 * @property {number} timeout - 请求超时时间（默认10秒）
 * @property {number} retryCount - 失败重试次数（默认2次）
 * @property {number} retryDelay - 重试延迟（默认1秒）
 * @property {Map} requestCache - 请求结果缓存
 * @property {Map} pendingRequests - 正在进行的请求（防止重复）
 */

class API {
    constructor() {
        this.timeout = 10000; // 10秒超时
        this.retryCount = 2; // 重试次数
        this.retryDelay = 1000; // 重试延迟（毫秒）
        this.requestCache = new Map(); // 请求缓存
        this.pendingRequests = new Map(); // 正在进行的请求（防止重复）
    }
    
    /**
     * 生成缓存键
     */
    _cacheKey(url, options) {
        return `${url}_${JSON.stringify(options.body || '')}`;
    }
    
    /**
     * 带缓存的请求
     */
    async fetchWithCache(url, options = {}, cacheDuration = 0) {
        const key = this._cacheKey(url, options);
        
        // 检查缓存
        if (cacheDuration > 0 && this.requestCache.has(key)) {
            const cached = this.requestCache.get(key);
            if (Date.now() - cached.time < cacheDuration) {
                console.log('使用缓存数据:', url);
                return cached.data;
            }
            this.requestCache.delete(key);
        }
        
        // 检查是否有相同请求正在进行
        if (this.pendingRequests.has(key)) {
            console.log('等待相同请求:', url);
            return await this.pendingRequests.get(key);
        }
        
        // 创建新请求
        const promise = this._fetchWithRetry(url, options);
        this.pendingRequests.set(key, promise);
        
        try {
            const result = await promise;
            
            // 缓存结果
            if (cacheDuration > 0) {
                this.requestCache.set(key, { data: result, time: Date.now() });
            }
            
            return result;
        } finally {
            this.pendingRequests.delete(key);
        }
    }
    
    /**
     * 带重试的请求
     */
    async _fetchWithRetry(url, options, attempt = 0) {
        try {
            return await this.fetchWithTimeout(url, options);
        } catch (error) {
            if (attempt < this.retryCount && this._shouldRetry(error)) {
                console.log(`请求失败，${this.retryDelay}ms后重试 (${attempt + 1}/${this.retryCount})`);
                await this._delay(this.retryDelay * (attempt + 1));
                return this._fetchWithRetry(url, options, attempt + 1);
            }
            throw error;
        }
    }
    
    /**
     * 判断是否值得重试
     */
    _shouldRetry(error) {
        // 网络错误、超时、5xx 服务器错误值得重试
        return error.message?.includes('超时') || 
               error.message?.includes('network') ||
               error.name === 'TypeError' ||
               (error.status && error.status >= 500);
    }
    
    /**
     * 延迟函数
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * 清理过期缓存
     */
    clearExpiredCache(maxAge = 3600000) { // 默认1小时
        const now = Date.now();
        let count = 0;
        this.requestCache.forEach((cached, key) => {
            if (now - cached.time > maxAge) {
                this.requestCache.delete(key);
                count++;
            }
        });
        if (count > 0) {
            console.log(`清理了 ${count} 个过期 API 缓存`);
        }
    }

    /**
     * 带超时的 fetch
     * @param {string} url - 请求地址
     * @param {object} options - fetch 选项
     * @returns {Promise<Response>}
     */
    async fetchWithTimeout(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('请求超时，请检查网络');
            }
            throw error;
        }
    }

    /**
     * 获取天气数据（带缓存和重试）
     * @param {number} lat - 纬度
     * @param {number} lon - 经度
     * @returns {Promise<object>}
     */
    async getWeather(lat, lon) {
        // 坐标精度降低到0.1度，减少缓存碎片
        const cacheLat = lat.toFixed(1);
        const cacheLon = lon.toFixed(1);
        const cacheKey = `weather_${cacheLat}_${cacheLon}`;
        
        // 使用 API 缓存（30分钟）
        const cached = storage.get(cacheKey);
        if (cached && Date.now() - cached._timestamp < 1800000) {
            console.log('使用缓存天气数据');
            return cached;
        }

        try {
            const url = `${CONFIG.api.weather.endpoint}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`;
            const response = await this.fetchWithCache(url, {}, 0); // 不使用 fetch 缓存
            
            if (!response.ok) {
                throw new Error(`天气服务错误: ${response.status}`);
            }
            
            const data = await response.json();
            data._timestamp = Date.now(); // 添加时间戳
            storage.set(cacheKey, data); // 缓存到 storage
            return data;
        } catch (error) {
            console.error('Weather API error:', error);
            // 返回缓存数据（即使过期）
            if (cached) {
                console.log('使用过期缓存天气数据');
                return cached;
            }
            throw new Error('获取天气失败，请检查网络连接');
        }
    }
    
    /**
     * 获取天气预报（7天）
     * @param {number} lat - 纬度
     * @param {number} lon - 经度
     * @returns {Promise<object>}
     */
    async getWeatherForecast(lat, lon) {
        const cacheLat = lat.toFixed(1);
        const cacheLon = lon.toFixed(1);
        const cacheKey = `forecast_${cacheLat}_${cacheLon}`;
        
        // 使用 API 缓存（1小时）
        const cached = storage.get(cacheKey);
        if (cached && Date.now() - cached._timestamp < 3600000) {
            console.log('使用缓存预报数据');
            return cached;
        }

        try {
            const url = `${CONFIG.api.weather.endpoint}?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&timezone=auto&forecast_days=7`;
            const response = await this.fetchWithCache(url, {}, 0);
            
            if (!response.ok) {
                throw new Error(`天气服务错误: ${response.status}`);
            }
            
            const data = await response.json();
            data._timestamp = Date.now();
            storage.set(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Forecast API error:', error);
            if (cached) {
                console.log('使用过期缓存预报数据');
                return cached;
            }
            throw new Error('获取天气预报失败');
        }
    }

    /**
     * 调用 AI 推荐 API
     * @param {string} prompt - 提示词
     * @returns {Promise<string>}
     */
    async getAIRecommendation(prompt) {
        const apiKey = storage.getDecryptedApiKey();
        if (!apiKey) {
            throw new Error('请先配置 API Key');
        }

        const isAliyun = apiKey.startsWith('sk-sp-');
        const headers = isAliyun 
            ? { 
                'Content-Type': 'application/json',
                'X-DashScope-API-Key': apiKey 
              }
            : { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}` 
              };

        const body = {
            model: CONFIG.api.aliyun.model,
            input: {
                messages: [
                    { role: 'system', content: '你是专业穿搭顾问，根据用户画像、天气、场合和衣橱给出专业穿搭建议。' },
                    { role: 'user', content: prompt }
                ]
            },
            parameters: {
                temperature: 0.8,
                max_tokens: 2000,
                result_format: 'message'
            }
        };

        try {
            const response = await this.fetchWithTimeout(CONFIG.api.aliyun.endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
                mode: 'cors'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (response.status === 401) {
                    throw new Error('API Key 无效，请检查配置');
                }
                throw new Error(errorData.message || `API 错误: ${response.status}`);
            }

            const data = await response.json();
            const content = data.output?.message?.content || data.output?.text;
            
            if (!content) {
                throw new Error('AI 返回数据格式异常');
            }

            return content;
        } catch (error) {
            console.error('AI API error:', error);
            if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
                throw new Error('API 调用失败，请安装 CORS Unblock 扩展或检查网络');
            }
            throw error;
        }
    }

    /**
     * 离线推荐（降级方案）
     * @param {object} params - 推荐参数
     * @returns {string}
     */
    getOfflineRecommendation(params) {
        const { weather, occasion, wardrobe } = params;
        const temp = parseInt(weather.temp) || 20;
        
        // 基于温度和场合的离线规则
        const rules = {
            important_meeting: {
                name: '重要会议',
                base: '正式商务装',
                items: temp > 25 
                    ? ['轻薄西装外套', '透气衬衫', '西裤', '皮鞋']
                    : ['西装外套', '长袖衬衫', '西裤', '皮鞋', '领带']
            },
            daily_work: {
                name: '普通上班',
                base: '商务休闲',
                items: temp > 25
                    ? ['POLO衫', '休闲裤', '休闲鞋']
                    : ['针织衫', '休闲裤', '休闲鞋', '薄外套']
            },
            client_visit: {
                name: '客户拜访',
                base: '得体商务装',
                items: temp > 25
                    ? ['商务衬衫', '西裤', '皮鞋']
                    : ['西装外套', '衬衫', '西裤', '皮鞋']
            },
            party: {
                name: '派对聚会',
                base: '时尚休闲',
                items: temp > 25
                    ? ['时尚T恤', '牛仔裤', '休闲鞋', '配饰']
                    : ['夹克', '卫衣', '牛仔裤', '休闲鞋']
            },
            date: {
                name: '约会',
                base: '精致休闲',
                items: temp > 25
                    ? ['精致衬衫', '休闲裤', '休闲皮鞋']
                    : ['毛衣', '休闲裤', '外套', '休闲皮鞋']
            },
            interview: {
                name: '面试',
                base: '正式职业装',
                items: temp > 25
                    ? ['正装衬衫', '西裤', '皮鞋']
                    : ['西装套装', '衬衫', '皮鞋', '领带']
            },
            casual: {
                name: '休闲日常',
                base: '舒适休闲',
                items: temp > 25
                    ? ['T恤', '短裤/休闲裤', '运动鞋']
                    : ['卫衣', '牛仔裤', '运动鞋', '外套']
            }
        };

        const rule = rules[occasion] || rules.casual;
        const wardrobeItems = wardrobe.length > 0 
            ? `\n\n您的衣橱: ${wardrobe.slice(0, 5).join(', ')}...`
            : '';

        return `## 离线推荐: ${rule.name}

**风格定位**: ${rule.base}

**推荐搭配**:
${rule.items.map((item, i) => `${i + 1}. ${item}`).join('\n')}

**搭配建议**:
- 当前气温 ${temp}°C，${temp > 25 ? '注意选择透气面料' : '建议准备外套应对温差'}
- 根据${rule.name}场合，${rule.base}风格最为合适
- 建议从衣橱中选择相近风格的单品搭配

**温馨提示**: 这是离线推荐，配置 API Key 后可获得 AI 智能推荐。${wardrobeItems}`;
    }
}

// 创建全局实例
const api = new API();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API, api };
}
