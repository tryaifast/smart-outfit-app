// 智能穿搭助手 - 主应用逻辑
// 使用LocalStorage进行本地数据存储

// ==================== 数据存储管理 ====================
const Storage = {
    get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(`smart_outfit_${key}`);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    },
    
    set(key, value) {
        try {
            localStorage.setItem(`smart_outfit_${key}`, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },
    
    remove(key) {
        localStorage.removeItem(`smart_outfit_${key}`);
    }
};

// ==================== 全局状态 ====================
let currentUser = null;
let currentWardrobe = [];
let currentWeather = null;
let selectedOccasion = null;

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // 加载用户资料
    currentUser = Storage.get('profile', {});
    currentWardrobe = Storage.get('wardrobe', []);
    
    // 恢复表单数据
    restoreProfileForm();
    
    // 渲染衣橱
    renderWardrobe();
    
    // 获取天气
    fetchWeather();
    
    // 绑定标签点击
    bindTagEvents();
    
    // 绑定导航切换
    bindNavEvents();
    
    // 检查API配置
    checkApiConfig();
}

// ==================== 导航切换 ====================
function bindNavEvents() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // 更新导航状态
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // 切换内容
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// ==================== 场合标签 ====================
function bindTagEvents() {
    const tags = document.querySelectorAll('#occasionTags .tag');
    tags.forEach(tag => {
        tag.addEventListener('click', () => {
            tags.forEach(t => t.classList.remove('selected'));
            tag.classList.add('selected');
            selectedOccasion = tag.dataset.value;
        });
    });
}

// ==================== 天气获取 ====================
async function fetchWeather() {
    const city = currentUser.city || '广州';
    
    try {
        // 使用Open-Meteo免费API
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=23.13&longitude=113.26&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=Asia/Shanghai&forecast_days=1`
        );
        
        if (!response.ok) throw new Error('Weather API failed');
        
        const data = await response.json();
        currentWeather = {
            temp: Math.round(data.current.temperature_2m),
            city: city,
            desc: getWeatherDesc(data.current.weather_code),
            maxTemp: Math.round(data.daily.temperature_2m_max[0]),
            minTemp: Math.round(data.daily.temperature_2m_min[0])
        };
        
        updateWeatherUI();
    } catch (error) {
        console.error('Weather fetch error:', error);
        // 使用默认天气
        currentWeather = {
            temp: 25,
            city: city,
            desc: '多云',
            maxTemp: 28,
            minTemp: 22
        };
        updateWeatherUI();
    }
}

function getWeatherDesc(code) {
    const weatherMap = {
        0: '晴朗', 1: '主要晴朗', 2: '多云', 3: '阴天',
        45: '雾', 48: '雾凇',
        51: '毛毛雨', 53: '中雨', 55: '大雨',
        61: '小雨', 63: '中雨', 65: '大雨',
        71: '小雪', 73: '中雪', 75: '大雪',
        95: '雷雨'
    };
    return weatherMap[code] || '多云';
}

function updateWeatherUI() {
    if (!currentWeather) return;
    
    const weatherInfo = document.getElementById('weatherInfo');
    weatherInfo.innerHTML = `
        <div class="temp">${currentWeather.temp}°</div>
        <div class="details">
            <div class="city">${currentWeather.city}</div>
            <div class="desc">${currentWeather.desc} · ${currentWeather.minTemp}°-${currentWeather.maxTemp}°</div>
        </div>
    `;
}

// ==================== 个人资料管理 ====================
function restoreProfileForm() {
    if (!currentUser) return;
    
    const fields = ['nickname', 'gender', 'ageRange', 'income', 'occupation', 'stylePreference', 'city'];
    fields.forEach(field => {
        const el = document.getElementById(field);
        if (el && currentUser[field]) {
            el.value = currentUser[field];
        }
    });
}

function saveProfile() {
    const profile = {
        nickname: document.getElementById('nickname').value,
        gender: document.getElementById('gender').value,
        ageRange: document.getElementById('ageRange').value,
        income: document.getElementById('income').value,
        occupation: document.getElementById('occupation').value,
        stylePreference: document.getElementById('stylePreference').value,
        city: document.getElementById('city').value
    };
    
    // 验证必填项
    if (!profile.nickname || !profile.gender || !profile.city) {
        alert('请填写完整的基本信息（昵称、性别、城市）');
        return;
    }
    
    Storage.set('profile', profile);
    currentUser = profile;
    
    alert('个人资料已保存！');
    
    // 刷新天气（如果城市变了）
    fetchWeather();
}

// ==================== 衣橱管理 ====================
function addToWardrobe() {
    const input = document.getElementById('newClothes').value.trim();
    if (!input) {
        alert('请输入衣物描述');
        return;
    }
    
    // 解析多行输入
    const lines = input.split('\n')
        .map(line => line.trim())
        .filter(line => line);
    
    const items = [];
    lines.forEach(line => {
        // 去除开头的 - 或数字标记
        const cleanLine = line.replace(/^[-\d.\s]+/, '').trim();
        if (cleanLine) {
            items.push(cleanLine);
        }
    });
    
    if (items.length === 0) {
        items.push(input);
    }
    
    items.forEach(item => {
        const clothesItem = {
            id: Date.now() + Math.random(),
            name: item,
            category: guessCategory(item),
            addedAt: new Date().toISOString()
        };
        currentWardrobe.push(clothesItem);
    });
    
    Storage.set('wardrobe', currentWardrobe);
    document.getElementById('newClothes').value = '';
    renderWardrobe();
    
    alert(`已添加 ${items.length} 件衣物到衣橱！`);
}

function guessCategory(name) {
    const categories = {
        '外套': ['外套', '西装', '夹克', '风衣', '大衣', '羽绒服'],
        '上装': ['衬衫', 'T恤', '毛衣', '卫衣', '针织衫', 'blouse', '背心'],
        '下装': ['裤子', '裙子', '短裤', '牛仔裤', '西裤', '阔腿裤', '半裙'],
        '鞋履': ['鞋', '靴', '高跟鞋', '运动鞋', '乐福鞋', '凉鞋'],
        '配饰': ['包', '围巾', '帽子', '首饰', '耳环', '项链', '丝巾', '腰带', '手表']
    };
    
    for (const [cat, keywords] of Object.entries(categories)) {
        if (keywords.some(k => name.includes(k))) {
            return cat;
        }
    }
    return '其他';
}

function getCategoryIcon(category) {
    const icons = {
        '外套': '🧥',
        '上装': '👔',
        '下装': '👖',
        '鞋履': '👠',
        '配饰': '👜',
        '其他': '👗'
    };
    return icons[category] || '👗';
}

function renderWardrobe() {
    const container = document.getElementById('wardrobeList');
    if (currentWardrobe.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center; grid-column: span 2;">衣橱是空的，先添加一些衣物吧！</p>';
        return;
    }
    
    container.innerHTML = currentWardrobe.map(item => `
        <div class="wardrobe-item" data-id="${item.id}">
            <div style="font-size: 24px; margin-bottom: 5px;">${getCategoryIcon(item.category)}</div>
            <div style="font-size: 12px; color: #667eea; margin-bottom: 5px;">${item.category}</div>
            <div style="font-size: 13px; color: #333; line-height: 1.3;">${item.name}</div>
            <button onclick="deleteWardrobeItem(${item.id})" style="margin-top: 8px; padding: 4px 10px; background: #ff6b6b; color: white; border: none; border-radius: 5px; font-size: 11px; cursor: pointer;">删除</button>
        </div>
    `).join('');
}

function deleteWardrobeItem(id) {
    if (!confirm('确定要删除这件衣物吗？')) return;
    currentWardrobe = currentWardrobe.filter(item => item.id !== id);
    Storage.set('wardrobe', currentWardrobe);
    renderWardrobe();
}

// ==================== 设置管理 ====================
function checkApiConfig() {
    const apiKey = Storage.get('apiKey', '');
    const apiConfigDiv = document.getElementById('apiConfig');
    
    if (!apiKey) {
        apiConfigDiv.style.display = 'block';
        document.getElementById('recommendBtn').disabled = true;
    } else {
        apiConfigDiv.style.display = 'none';
        document.getElementById('recommendBtn').disabled = false;
    }
    
    // 恢复设置表单
    document.getElementById('apiKey').value = apiKey;
}

function saveSettings() {
    const apiKey = document.getElementById('apiKey').value.trim();
    if (!apiKey) {
        alert('请输入API Key');
        return;
    }
    
    Storage.set('apiKey', apiKey);
    alert('设置已保存！');
    checkApiConfig();
}

// ==================== 智能推荐核心 ====================
async function getRecommendation() {
    // 检查必要信息
    if (!selectedOccasion) {
        alert('请先选择今天的场合');
        return;
    }
    
    if (!currentUser || !currentUser.nickname) {
        alert('请先完善个人资料');
        document.querySelector('[data-tab="profile"]').click();
        return;
    }
    
    const apiKey = Storage.get('apiKey', '');
    if (!apiKey) {
        alert('请先配置API Key');
        return;
    }
    
    // 显示加载
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('resultCard').classList.remove('show');
    
    try {
        const recommendation = await callKimiAPI(apiKey);
        displayRecommendation(recommendation);
    } catch (error) {
        console.error('Recommendation error:', error);
        alert('获取推荐失败：' + error.message);
    } finally {
        document.getElementById('loading').classList.add('hidden');
    }
}

async function callKimiAPI(apiKey) {
    const occasionMap = {
        'important_meeting': '重要会议',
        'daily_work': '普通上班',
        'client_visit': '客户拜访',
        'party': '派对聚会',
        'date': '约会',
        'interview': '面试',
        'casual': '休闲日常'
    };
    
    const extraNotes = document.getElementById('extraNotes').value.trim();
    
    const prompt = buildPrompt({
        user: currentUser,
        weather: currentWeather,
        occasion: occasionMap[selectedOccasion],
        wardrobe: currentWardrobe,
        extraNotes: extraNotes
    });
    
    // 调用Kimi API (使用OpenAI兼容格式)
    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'kimi-k2.5',
            messages: [
                { role: 'system', content: '你是一个专业的时尚穿搭顾问，擅长根据用户的个人特征、天气情况和场合需求，提供精准、实用的穿搭建议。' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 2000
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API请求失败');
    }
    
    const data = await response.json();
    return parseRecommendation(data.choices[0].message.content);
}

function buildPrompt(context) {
    const { user, weather, occasion, wardrobe, extraNotes } = context;
    
    const incomeMap = {
        '5k-10k': '5000-10000元',
        '10k-20k': '10000-20000元',
        '20k-30k': '20000-30000元',
        '30k+': '30000元以上'
    };
    
    const styleMap = {
        'minimalist': '简约极简',
        'classic': '经典优雅',
        'trendy': '时尚潮流',
        'business': '商务干练',
        'casual': '休闲舒适'
    };
    
    let wardrobeText = '';
    if (wardrobe.length > 0) {
        wardrobeText = '\n\n用户现有衣橱：\n' + wardrobe.map(item => `- ${item.category}：${item.name}`).join('\n');
    } else {
        wardrobeText = '\n\n用户衣橱为空，请提供通用搭配建议。';
    }
    
    return `请为以下用户推荐今天的穿搭：

【用户信息】
- 昵称：${user.nickname}
- 性别：${user.gender === 'female' ? '女' : '男'}
- 年龄段：${user.ageRange || '未指定'}
- 月收入：${incomeMap[user.income] || '未指定'}
- 职业：${user.occupation || '未指定'}
- 风格偏好：${styleMap[user.stylePreference] || '未指定'}

【天气情况】
- 城市：${weather.city}
- 当前温度：${weather.temp}°C
- 天气：${weather.desc}
- 温度范围：${weather.minTemp}°C - ${weather.maxTemp}°C

【今天场合】
${occasion}

${extraNotes ? '【特殊要求】\n' + extraNotes : ''}
${wardrobeText}

请按以下格式输出：

## 推荐搭配
1. 【上装】具体衣物描述
2. 【下装】具体衣物描述
3. 【外套】具体衣物描述（如需要）
4. 【鞋履】具体鞋款描述
5. 【配饰】配饰建议

## 推荐理由
- 天气适配：说明为什么适合今天天气
- 场合匹配：说明为什么适合这个场合
- 风格契合：说明如何符合用户个人风格
- 预算考量：说明是否符合用户消费水平

## 备选方案
提供1-2套备选搭配

## 缺件建议
如果衣橱缺少关键单品，给出购买建议`;
}

function parseRecommendation(text) {
    // 简单解析，实际可以做得更复杂
    return {
        raw: text,
        outfit: extractSection(text, '推荐搭配'),
        reasoning: extractSection(text, '推荐理由'),
        alternatives: extractSection(text, '备选方案'),
        shopping: extractSection(text, '缺件建议')
    };
}

function extractSection(text, sectionName) {
    const regex = new RegExp(`## ${sectionName}([\\s\\S]*?)(?=##|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
}

function displayRecommendation(rec) {
    const outfitList = document.getElementById('outfitList');
    const reasoningText = document.getElementById('reasoningText');
    
    // 解析搭配项
    const outfitItems = parseOutfitItems(rec.outfit);
    
    outfitList.innerHTML = outfitItems.map(item => `
        <div class="outfit-item">
            <div class="icon">${item.icon}</div>
            <div class="info">
                <h4>${item.category}</h4>
                <p>${item.description}</p>
            </div>
        </div>
    `).join('');
    
    // 显示推荐理由
    reasoningText.innerHTML = formatReasoning(rec.reasoning);
    
    // 显示备选和购物建议（如果有）
    if (rec.alternatives) {
        reasoningText.innerHTML += '<h4 style="margin-top: 15px; color: #667eea;">🔄 备选方案</h4><p>' + rec.alternatives + '</p>';
    }
    if (rec.shopping) {
        reasoningText.innerHTML += '<h4 style="margin-top: 15px; color: #667eea;">🛒 缺件建议</h4><p>' + rec.shopping + '</p>';
    }
    
    document.getElementById('resultCard').classList.add('show');
}

function parseOutfitItems(outfitText) {
    const items = [];
    const lines = outfitText.split('\n').filter(line => line.trim());
    
    const categoryMap = {
        '上装': { icon: '👔', category: '上装' },
        '下装': { icon: '👖', category: '下装' },
        '外套': { icon: '🧥', category: '外套' },
        '鞋履': { icon: '👠', category: '鞋履' },
        '配饰': { icon: '👜', category: '配饰' },
        '内搭': { icon: '👕', category: '内搭' }
    };
    
    lines.forEach(line => {
        for (const [key, value] of Object.entries(categoryMap)) {
            if (line.includes(key) || line.includes(value.category)) {
                const desc = line.replace(/^\d+\.\s*/, '').replace(/[【】]/g, '').trim();
                items.push({
                    icon: value.icon,
                    category: value.category,
                    description: desc
                });
                break;
            }
        }
    });
    
    return items.length > 0 ? items : [{ icon: '👔', category: '推荐搭配', description: outfitText }];
}

function formatReasoning(reasoningText) {
    if (!reasoningText) return '<p>暂无推荐理由</p>';
    
    // 将文本转换为HTML
    return reasoningText
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
            if (line.startsWith('-')) {
                return '<p style="margin-bottom: 8px;">• ' + line.substring(1).trim() + '</p>';
            }
            return '<p style="margin-bottom: 8px;">' + line + '</p>';
        })
        .join('');
}

// ==================== 工具函数 ====================
function formatDate(date) {
    return new Date(date).toLocaleDateString('zh-CN');
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}