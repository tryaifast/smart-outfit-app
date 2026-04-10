// 智能穿搭助手 - 完整应用逻辑
// 包含：用户系统、精确定位、后台管理、AI推荐

// ==================== 配置 ====================
const CONFIG = {
    // 管理员账号（硬编码，实际应该加密存储）
    ADMIN_USERNAME: 'admin',
    ADMIN_PASSWORD: 'admin123',
    
    // 默认API Key（管理员可修改）
    DEFAULT_API_KEY: '', // 需要管理员配置
    
    // API提供商配置
    API_PROVIDER: 'aliyun', // 'aliyun' 或 'kimi'
    ALIYUN_API_URL: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    KIMI_API_URL: 'https://api.moonshot.cn/v1/chat/completions',
    
    // 设备注册限制
    MAX_REGISTRATIONS_PER_DEVICE: 5,
    
    // 中国省市数据（简化版）
    PROVINCES: [
        { code: '110000', name: '北京市', cities: [
            { code: '110100', name: '北京市', districts: ['东城区','西城区','朝阳区','丰台区','石景山区','海淀区','门头沟区','房山区','通州区','顺义区','昌平区','大兴区','怀柔区','平谷区','密云区','延庆区'] }
        ]},
        { code: '310000', name: '上海市', cities: [
            { code: '310100', name: '上海市', districts: ['黄浦区','徐汇区','长宁区','静安区','普陀区','虹口区','杨浦区','闵行区','宝山区','嘉定区','浦东新区','金山区','松江区','青浦区','奉贤区','崇明区'] }
        ]},
        { code: '440000', name: '广东省', cities: [
            { code: '440100', name: '广州市', districts: ['荔湾区','越秀区','海珠区','天河区','白云区','黄埔区','番禺区','花都区','南沙区','从化区','增城区'] },
            { code: '440300', name: '深圳市', districts: ['罗湖区','福田区','南山区','宝安区','龙岗区','盐田区','龙华区','坪山区','光明区'] }
        ]},
        { code: '320000', name: '江苏省', cities: [
            { code: '320100', name: '南京市', districts: ['玄武区','秦淮区','建邺区','鼓楼区','浦口区','栖霞区','雨花台区','江宁区','六合区','溧水区','高淳区'] },
            { code: '320500', name: '苏州市', districts: ['虎丘区','吴中区','相城区','姑苏区','吴江区','常熟市','张家港市','昆山市','太仓市'] }
        ]},
        { code: '330000', name: '浙江省', cities: [
            { code: '330100', name: '杭州市', districts: ['上城区','拱墅区','西湖区','滨江区','萧山区','余杭区','富阳区','临安区','临平区','钱塘区'] },
            { code: '330200', name: '宁波市', districts: ['海曙区','江北区','北仑区','镇海区','鄞州区','奉化区','余姚市','慈溪市'] }
        ]}
    ]
};

// ==================== 存储管理 ====================
const Storage = {
    get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(`smart_outfit_${key}`);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(`smart_outfit_${key}`, JSON.stringify(value));
            return true;
        } catch (e) {
            return false;
        }
    },
    remove(key) {
        localStorage.removeItem(`smart_outfit_${key}`);
    }
};

// ==================== 全局状态 ====================
let currentUser = null;
let currentLocation = null;
let currentWeather = null;
let selectedOccasion = null;
let isAdmin = false;

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    // 检查登录状态
    const session = Storage.get('session');
    if (session && session.isLoggedIn) {
        currentUser = Storage.get(`user_${session.phone}`);
        showMainApp();
    } else {
        showAuthPage();
    }
    
    // 绑定事件
    bindAuthTabs();
    bindNavTabs();
    bindOccasionTags();
    initLocationSelector();
}

// ==================== 页面切换 ====================
function showAuthPage() {
    document.getElementById('authPage').style.display = 'block';
    document.getElementById('mainApp').classList.remove('show');
    document.getElementById('adminPage').classList.remove('show');
}

function showMainApp() {
    document.getElementById('authPage').style.display = 'none';
    document.getElementById('mainApp').classList.add('show');
    document.getElementById('adminPage').classList.remove('show');
    
    // 加载用户数据
    loadUserProfile();
    loadWardrobe();
    initLocation();
}

// ==================== 登录注册 ====================
function bindAuthTabs() {
    const tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const target = tab.dataset.tab;
            document.getElementById('loginForm').style.display = target === 'login' ? 'block' : 'none';
            document.getElementById('registerForm').style.display = target === 'register' ? 'block' : 'none';
        });
    });
}

function handleLogin() {
    const phone = document.getElementById('loginPhone').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    
    // 验证
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
        errorEl.textContent = '请输入正确的手机号';
        errorEl.classList.add('show');
        return;
    }
    if (!password) {
        errorEl.textContent = '请输入密码';
        errorEl.classList.add('show');
        return;
    }
    
    // 检查用户是否存在
    const user = Storage.get(`user_${phone}`);
    if (!user) {
        errorEl.textContent = '该手机号未注册';
        errorEl.classList.add('show');
        return;
    }
    
    // 验证密码（实际应该加密）
    if (user.password !== hashPassword(password)) {
        errorEl.textContent = '密码错误';
        errorEl.classList.add('show');
        return;
    }
    
    // 登录成功
    currentUser = user;
    Storage.set('session', { isLoggedIn: true, phone: phone });
    errorEl.classList.remove('show');
    showMainApp();
}

function handleRegister() {
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const errorEl = document.getElementById('regError');
    
    // 验证
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
        errorEl.textContent = '请输入正确的手机号';
        errorEl.classList.add('show');
        return;
    }
    if (password.length < 6) {
        errorEl.textContent = '密码至少6位';
        errorEl.classList.add('show');
        return;
    }
    if (password !== confirmPassword) {
        errorEl.textContent = '两次密码不一致';
        errorEl.classList.add('show');
        return;
    }
    
    // 检查手机号是否已注册
    if (Storage.get(`user_${phone}`)) {
        errorEl.textContent = '该手机号已注册';
        errorEl.classList.add('show');
        return;
    }
    
    // 检查设备注册次数
    const deviceId = getDeviceId();
    const deviceRegs = Storage.get(`device_regs_${deviceId}`) || 0;
    if (deviceRegs >= CONFIG.MAX_REGISTRATIONS_PER_DEVICE) {
        errorEl.textContent = '该设备注册次数已达上限（5次）';
        errorEl.classList.add('show');
        return;
    }
    
    // 创建用户
    const user = {
        phone: phone,
        password: hashPassword(password),
        nickname: '',
        avatar: '',
        gender: '',
        ageRange: '',
        income: '',
        occupation: '',
        stylePreference: '',
        location: null,
        wardrobe: [],
        createdAt: new Date().toISOString()
    };
    
    Storage.set(`user_${phone}`, user);
    Storage.set(`device_regs_${deviceId}`, deviceRegs + 1);
    
    // 自动登录
    currentUser = user;
    Storage.set('session', { isLoggedIn: true, phone: phone });
    errorEl.classList.remove('show');
    
    alert('注册成功！');
    showMainApp();
}

function logout() {
    Storage.remove('session');
    currentUser = null;
    showAuthPage();
}

function hashPassword(password) {
    // 简单哈希（实际应该用bcrypt等）
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(16);
}

function getDeviceId() {
    let deviceId = Storage.get('device_id');
    if (!deviceId) {
        deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
        Storage.set('device_id', deviceId);
    }
    return deviceId;
}

// ==================== 导航切换 ====================
function bindNavTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const target = tab.dataset.tab;
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById(target).classList.add('active');
        });
    });
}

// ==================== 定位功能 ====================
function initLocation() {
    // 尝试获取保存的位置
    const savedLocation = currentUser?.location;
    if (savedLocation) {
        currentLocation = savedLocation;
        updateLocationDisplay();
        fetchWeather();
    } else {
        // 默认位置
        currentLocation = { province: '广东省', city: '广州市', district: '天河区', street: '' };
        updateLocationDisplay();
        fetchWeather();
    }
}

function initLocationSelector() {
    // 初始化省份选择器
    const provinceSelect = document.getElementById('provinceSelect');
    CONFIG.PROVINCES.forEach(prov => {
        const option = document.createElement('option');
        option.value = prov.code;
        option.textContent = prov.name;
        provinceSelect.appendChild(option);
    });
}

function openLocationModal() {
    document.getElementById('locationModal').classList.add('show');
}

function closeLocationModal() {
    document.getElementById('locationModal').classList.remove('show');
}

function selectLocationType(type) {
    document.querySelectorAll('.location-type-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    if (type === 'auto') {
        document.getElementById('autoLocationSection').style.display = 'block';
        document.getElementById('manualLocationSection').style.display = 'none';
    } else {
        document.getElementById('autoLocationSection').style.display = 'none';
        document.getElementById('manualLocationSection').style.display = 'block';
    }
}

function getCurrentLocation() {
    const statusEl = document.getElementById('locationStatus');
    statusEl.textContent = '正在获取位置...';
    
    if (!navigator.geolocation) {
        statusEl.textContent = '您的浏览器不支持定位';
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            // 使用逆地理编码（简化版，实际应该调用地图API）
            statusEl.textContent = `已获取坐标：${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            
            // 模拟定位到最近的城市
            currentLocation = { 
                province: '广东省', 
                city: '广州市', 
                district: '天河区', 
                street: '当前位置',
                lat: latitude,
                lng: longitude
            };
            updateLocationDisplay();
            fetchWeather();
            closeLocationModal();
        },
        (error) => {
            statusEl.textContent = '定位失败：' + error.message;
        }
    );
}

function onProvinceChange() {
    const provinceCode = document.getElementById('provinceSelect').value;
    const citySelect = document.getElementById('citySelect');
    const districtSelect = document.getElementById('districtSelect');
    
    citySelect.innerHTML = '<option value="">选择城市</option>';
    districtSelect.innerHTML = '<option value="">选择区县</option>';
    
    if (!provinceCode) return;
    
    const province = CONFIG.PROVINCES.find(p => p.code === provinceCode);
    if (province) {
        province.cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city.code;
            option.textContent = city.name;
            citySelect.appendChild(option);
        });
    }
}

function onCityChange() {
    const provinceCode = document.getElementById('provinceSelect').value;
    const cityCode = document.getElementById('citySelect').value;
    const districtSelect = document.getElementById('districtSelect');
    
    districtSelect.innerHTML = '<option value="">选择区县</option>';
    
    if (!cityCode) return;
    
    const province = CONFIG.PROVINCES.find(p => p.code === provinceCode);
    const city = province?.cities.find(c => c.code === cityCode);
    
    if (city) {
        city.districts.forEach(district => {
            const option = document.createElement('option');
            option.value = district;
            option.textContent = district;
            districtSelect.appendChild(option);
        });
    }
}

function confirmLocation() {
    const type = document.querySelector('.location-type-btn.active').textContent.includes('自动') ? 'auto' : 'manual';
    
    if (type === 'manual') {
        const province = document.getElementById('provinceSelect');
        const city = document.getElementById('citySelect');
        const district = document.getElementById('districtSelect');
        const street = document.getElementById('streetInput');
        
        if (!province.value || !city.value) {
            alert('请选择省份和城市');
            return;
        }
        
        currentLocation = {
            province: province.options[province.selectedIndex].text,
            city: city.options[city.selectedIndex].text,
            district: district.value || '',
            street: street.value.trim()
        };
    }
    
    // 保存到用户数据
    if (currentUser) {
        currentUser.location = currentLocation;
        Storage.set(`user_${currentUser.phone}`, currentUser);
    }
    
    updateLocationDisplay();
    fetchWeather();
    closeLocationModal();
}

function updateLocationDisplay() {
    const locationText = currentLocation 
        ? `${currentLocation.city} ${currentLocation.district || ''} ${currentLocation.street || ''}`.trim()
        : '点击选择位置';
    document.getElementById('currentLocation').textContent = locationText;
}

// ==================== 天气功能 ====================
async function fetchWeather() {
    if (!currentLocation) return;
    
    try {
        // 使用Open-Meteo免费API（根据城市获取坐标）
        const cityCoords = {
            '北京市': { lat: 39.9, lng: 116.4 },
            '上海市': { lat: 31.2, lng: 121.5 },
            '广州市': { lat: 23.1, lng: 113.3 },
            '深圳市': { lat: 22.5, lng: 114.1 },
            '南京市': { lat: 32.0, lng: 118.8 },
            '苏州市': { lat: 31.3, lng: 120.6 },
            '杭州市': { lat: 30.3, lng: 120.2 },
            '宁波市': { lat: 29.9, lng: 121.5 }
        };
        
        const coords = cityCoords[currentLocation.city] || { lat: 23.1, lng: 113.3 };
        
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=Asia/Shanghai&forecast_days=1`
        );
        
        if (!response.ok) throw new Error('Weather API failed');
        
        const data = await response.json();
        currentWeather = {
            temp: Math.round(data.current.temperature_2m),
            desc: getWeatherDesc(data.current.weather_code),
            maxTemp: Math.round(data.daily.temperature_2m_max[0]),
            minTemp: Math.round(data.daily.temperature_2m_min[0])
        };
        
        document.getElementById('weatherTemp').textContent = currentWeather.temp + '°';
        document.getElementById('weatherDesc').textContent = currentWeather.desc;
        document.getElementById('weatherRange').textContent = `${currentWeather.minTemp}°-${currentWeather.maxTemp}°`;
    } catch (error) {
        console.error('Weather error:', error);
        // 使用默认天气
        currentWeather = { temp: 25, desc: '多云', maxTemp: 28, minTemp: 22 };
        document.getElementById('weatherTemp').textContent = '25°';
        document.getElementById('weatherDesc').textContent = '多云';
        document.getElementById('weatherRange').textContent = '22°-28°';
    }
}

function getWeatherDesc(code) {
    const map = { 0: '晴朗', 1: '主要晴朗', 2: '多云', 3: '阴天', 45: '雾', 51: '毛毛雨', 61: '小雨', 63: '中雨', 65: '大雨', 71: '小雪', 95: '雷雨' };
    return map[code] || '多云';
}

// ==================== 场合选择 ====================
function bindOccasionTags() {
    const tags = document.querySelectorAll('#occasionTags .tag');
    tags.forEach(tag => {
        tag.addEventListener('click', () => {
            tags.forEach(t => t.classList.remove('selected'));
            tag.classList.add('selected');
            selectedOccasion = tag.dataset.value;
        });
    });
}

// ==================== 个人资料 ====================
function loadUserProfile() {
    if (!currentUser) return;
    
    // 更新头部显示
    document.getElementById('profileName').textContent = currentUser.nickname || '未设置昵称';
    document.getElementById('profilePhone').textContent = currentUser.phone;
    
    // 更新头像
    if (currentUser.avatar) {
        document.getElementById('avatarImg').src = currentUser.avatar;
        document.getElementById('avatarImg').style.display = 'block';
        document.getElementById('avatarPlaceholder').style.display = 'none';
    }
    
    // 填充表单
    document.getElementById('editNickname').value = currentUser.nickname || '';
    document.getElementById('editGender').value = currentUser.gender || '';
    document.getElementById('editAgeRange').value = currentUser.ageRange || '';
    document.getElementById('editIncome').value = currentUser.income || '';
    document.getElementById('editOccupation').value = currentUser.occupation || '';
    document.getElementById('editStyle').value = currentUser.stylePreference || '';
}

function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const avatarData = e.target.result;
        document.getElementById('avatarImg').src = avatarData;
        document.getElementById('avatarImg').style.display = 'block';
        document.getElementById('avatarPlaceholder').style.display = 'none';
        
        // 临时保存，等点击保存按钮再存到用户数据
        currentUser.tempAvatar = avatarData;
    };
    reader.readAsDataURL(file);
}

function saveProfile() {
    if (!currentUser) return;
    
    currentUser.nickname = document.getElementById('editNickname').value;
    currentUser.gender = document.getElementById('editGender').value;
    currentUser.ageRange = document.getElementById('editAgeRange').value;
    currentUser.income = document.getElementById('editIncome').value;
    currentUser.occupation = document.getElementById('editOccupation').value;
    currentUser.stylePreference = document.getElementById('editStyle').value;
    
    if (currentUser.tempAvatar) {
        currentUser.avatar = currentUser.tempAvatar;
        delete currentUser.tempAvatar;
    }
    
    Storage.set(`user_${currentUser.phone}`, currentUser);
    
    // 更新显示
    document.getElementById('profileName').textContent = currentUser.nickname || '未设置昵称';
    
    alert('资料已保存！');
}

// ==================== 衣橱管理 ====================
function loadWardrobe() {
    if (!currentUser) return;
    
    const wardrobe = currentUser.wardrobe || [];
    const container = document.getElementById('wardrobeList');
    
    if (wardrobe.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center; grid-column: span 2;">衣橱是空的</p>';
        return;
    }
    
    container.innerHTML = wardrobe.map((item, index) => `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; position: relative;">
            <div style="font-size: 24px; margin-bottom: 5px;">${getCategoryIcon(item.category)}</div>
            <div style="font-size: 12px; color: #667eea;">${item.category}</div>
            <div style="font-size: 13px; margin-top: 5px;">${item.name}</div>
            <button onclick="deleteWardrobeItem(${index})" style="position: absolute; top: 5px; right: 5px; background: #ff6b6b; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 12px;">×</button>
        </div>
    `).join('');
}

function getCategoryIcon(category) {
    const icons = { '外套': '🧥', '上装': '👔', '下装': '👖', '鞋履': '👠', '配饰': '👜', '其他': '👗' };
    return icons[category] || '👗';
}

function guessCategory(name) {
    const categories = {
        '外套': ['外套', '西装', '夹克', '风衣', '大衣', '羽绒服'],
        '上装': ['衬衫', 'T恤', '毛衣', '卫衣', '针织衫', '背心'],
        '下装': ['裤子', '裙子', '短裤', '牛仔裤', '西裤', '阔腿裤'],
        '鞋履': ['鞋', '靴', '高跟鞋', '运动鞋', '乐福鞋'],
        '配饰': ['包', '围巾', '帽子', '首饰', '耳环', '项链']
    };
    for (const [cat, keywords] of Object.entries(categories)) {
        if (keywords.some(k => name.includes(k))) return cat;
    }
    return '其他';
}

function addToWardrobe() {
    const input = document.getElementById('newClothes').value.trim();
    if (!input) {
        alert('请输入衣物描述');
        return;
    }
    
    const lines = input.split('\n').map(l => l.trim()).filter(l => l);
    const items = lines.map(line => ({
        name: line.replace(/^[-\d.\s]+/, ''),
        category: guessCategory(line),
        addedAt: new Date().toISOString()
    })).filter(item => item.name);
    
    if (!currentUser.wardrobe) currentUser.wardrobe = [];
    currentUser.wardrobe.push(...items);
    
    Storage.set(`user_${currentUser.phone}`, currentUser);
    document.getElementById('newClothes').value = '';
    loadWardrobe();
    
    alert(`已添加 ${items.length} 件衣物！`);
}

function deleteWardrobeItem(index) {
    if (!confirm('确定删除这件衣物吗？')) return;
    currentUser.wardrobe.splice(index, 1);
    Storage.set(`user_${currentUser.phone}`, currentUser);
    loadWardrobe();
}

// ==================== AI推荐 ====================
async function getRecommendation() {
    if (!selectedOccasion) {
        alert('请先选择场合');
        return;
    }
    
    // 检查用户资料是否完整
    if (!currentUser.nickname || !currentUser.gender) {
        alert('请先完善个人资料（昵称和性别）');
        document.querySelector('[data-tab="profile"]').click();
        return;
    }
    
    // 获取管理员配置的API Key
    const apiKey = Storage.get('admin_api_key');
    console.log('API Key from storage:', apiKey ? apiKey.substring(0, 10) + '...' : 'null');
    
    if (!apiKey) {
        alert('系统配置错误：API Key未设置，请联系管理员');
        return;
    }
    
    // 清理API Key（去除首尾空格）
    const cleanApiKey = apiKey.trim();
    
    document.getElementById('loading').classList.add('show');
    document.getElementById('resultCard').classList.remove('show');
    
    try {
        const recommendation = await callAIAPI(cleanApiKey);
        displayRecommendation(recommendation);
    } catch (error) {
        console.error('Recommendation error:', error);
        alert('获取推荐失败：' + error.message);
    } finally {
        document.getElementById('loading').classList.remove('show');
    }
}

async function callAIAPI(apiKey) {
    const occasionMap = {
        'important_meeting': '重要会议', 'daily_work': '普通上班',
        'client_visit': '客户拜访', 'party': '派对聚会',
        'date': '约会', 'interview': '面试', 'casual': '休闲日常'
    };
    
    const prompt = buildPrompt({
        user: currentUser,
        weather: currentWeather,
        location: currentLocation,
        occasion: occasionMap[selectedOccasion],
        wardrobe: currentUser.wardrobe || []
    });
    
    // 获取API提供商设置（默认阿里云百炼）
    let provider = Storage.get('api_provider');
    if (!provider) {
        provider = 'aliyun'; // 强制默认阿里云
        Storage.set('api_provider', provider);
    }
    console.log('Using API provider:', provider);
    console.log('API Key prefix:', apiKey.substring(0, 10) + '...');
    
    if (provider === 'kimi') {
        return await callKimiAPI(apiKey, prompt);
    } else {
        return await callAliyunAPI(apiKey, prompt);
    }
}

async function callAliyunAPI(apiKey, prompt) {
    console.log('Calling Aliyun API via proxy...');
    console.log('API Key prefix:', apiKey.substring(0, 15) + '...');
    
    // 使用 Vercel Serverless Function 代理，避免 CORS 问题
    const proxyUrl = window.location.origin + '/api/proxy';
    
    try {
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                provider: 'aliyun',
                apiKey: apiKey,
                messages: [
                    { role: 'system', content: '你是专业时尚穿搭顾问，根据用户信息、天气、场合提供精准穿搭建议。' },
                    { role: 'user', content: prompt }
                ],
                model: 'qwen-max',
                temperature: 0.7,
                max_tokens: 2000
            })
        });
        
        console.log('Proxy response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Proxy error:', errorText);
            throw new Error('API请求失败: ' + errorText);
        }
        
        const data = await response.json();
        console.log('Proxy response:', data);
        
        if (data.error) {
            throw new Error(data.error.message || data.error);
        }
        
        return data.output?.choices?.[0]?.message?.content || data.output?.text || '推荐生成失败';
    } catch (error) {
        console.error('Fetch error:', error);
        if (error.message === 'Failed to fetch') {
            throw new Error('网络请求失败，请检查网络连接');
        }
        throw error;
    }
}

async function callKimiAPI(apiKey, prompt) {
    console.log('Calling Kimi API directly...');
    console.log('API Key prefix:', apiKey.substring(0, 15) + '...');
    
    // 直接调用 Kimi API（支持 CORS）
    const apiUrl = 'https://api.moonshot.cn/v1/chat/completions';
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'kimi-k2.5',
                messages: [
                    { role: 'system', content: '你是专业时尚穿搭顾问，根据用户信息、天气、场合提供精准穿搭建议。' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });
        
        console.log('Kimi API response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Kimi API error:', errorText);
            let errorMsg = 'API请求失败';
            try {
                const errorJson = JSON.parse(errorText);
                errorMsg = errorJson.error?.message || errorJson.message || errorText;
            } catch (e) {
                errorMsg = errorText || `HTTP ${response.status}`;
            }
            throw new Error(errorMsg);
        }
        
        const data = await response.json();
        console.log('Kimi API response:', data);
        
        if (data.error) {
            throw new Error(data.error.message || 'API调用失败');
        }
        
        return data.choices?.[0]?.message?.content || '推荐生成失败';
    } catch (error) {
        console.error('Fetch error:', error);
        if (error.message === 'Failed to fetch') {
            throw new Error('网络请求失败，请检查网络连接');
        }
        throw error;
    }
}

function buildPrompt(context) {
    const { user, weather, location, occasion, wardrobe } = context;
    
    const incomeMap = { '5k-10k': '5k-10k', '10k-20k': '10k-20k', '20k-30k': '20k-30k', '30k+': '30k+' };
    const styleMap = { 'minimalist': '简约', 'classic': '经典', 'trendy': '潮流', 'business': '商务', 'casual': '休闲' };
    
    const locationStr = `${location.city} ${location.district || ''} ${location.street || ''}`.trim();
    
    let wardrobeText = wardrobe.length > 0 
        ? '\n用户衣橱：\n' + wardrobe.map(item => `- ${item.category}：${item.name}`).join('\n')
        : '\n用户衣橱为空，提供通用建议。';
    
    return `为用户推荐穿搭：

【用户信息】
- 昵称：${user.nickname}
- 性别：${user.gender === 'female' ? '女' : '男'}
- 年龄段：${user.ageRange || '未指定'}
- 月收入：${incomeMap[user.income] || '未指定'}
- 职业：${user.occupation || '未指定'}
- 风格偏好：${styleMap[user.stylePreference] || '未指定'}

【位置天气】
- 位置：${locationStr}
- 温度：${weather.temp}°C（${weather.minTemp}°-${weather.maxTemp}°）
- 天气：${weather.desc}

【场合】${occasion}
${wardrobeText}

请输出：
1. 完整搭配（上装/下装/外套/鞋履/配饰）
2. 推荐理由（天气适配/场合匹配/风格契合）
3. 备选方案
4. 缺件建议（如有）`;
}

function displayRecommendation(text) {
    document.getElementById('outfitList').innerHTML = `<pre style="white-space: pre-wrap; font-family: inherit; line-height: 1.6;">${text}</pre>`;
    document.getElementById('resultCard').classList.add('show');
}

// ==================== 后台管理 ====================
function openAdminLogin() {
    document.getElementById('adminLoginModal').classList.add('show');
}

function closeAdminLogin() {
    document.getElementById('adminLoginModal').classList.remove('show');
    document.getElementById('adminLoginError').classList.remove('show');
}

function handleAdminLogin() {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    const errorEl = document.getElementById('adminLoginError');
    
    if (username !== CONFIG.ADMIN_USERNAME || password !== CONFIG.ADMIN_PASSWORD) {
        errorEl.textContent = '账号或密码错误';
        errorEl.classList.add('show');
        return;
    }
    
    isAdmin = true;
    closeAdminLogin();
    showAdminPage();
}

function showAdminPage() {
    document.getElementById('authPage').style.display = 'none';
    document.getElementById('mainApp').classList.remove('show');
    document.getElementById('adminPage').classList.add('show');
    
    loadAdminData();
}

function closeAdmin() {
    document.getElementById('adminPage').classList.remove('show');
    showAuthPage();
}

function loadAdminData() {
    // 统计用户数
    let userCount = 0;
    const userList = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('smart_outfit_user_')) {
            userCount++;
            const user = JSON.parse(localStorage.getItem(key));
            userList.push({
                phone: user.phone,
                nickname: user.nickname || '-',
                createdAt: new Date(user.createdAt).toLocaleDateString()
            });
        }
    }
    
    document.getElementById('adminUserCount').textContent = userCount;
    
    // 加载API Key
    const savedKey = Storage.get('admin_api_key');
    if (savedKey) {
        document.getElementById('adminApiKey').value = savedKey;
    }
    
    // 加载API提供商设置（强制默认阿里云百炼，清除旧设置）
    let savedProvider = Storage.get('api_provider');
    // 如果之前保存的是kimi，强制重置为aliyun
    if (savedProvider === 'kimi') {
        console.log('检测到旧版Kimi设置，强制重置为阿里云百炼');
        savedProvider = 'aliyun';
        Storage.set('api_provider', savedProvider);
    }
    if (!savedProvider) {
        savedProvider = 'aliyun';
        Storage.set('api_provider', savedProvider);
    }
    const providerSelect = document.getElementById('apiProvider');
    if (providerSelect) {
        providerSelect.value = savedProvider;
    }
    
    // 加载用户列表
    const listHtml = userList.map(u => `
        <div style="padding: 10px; border-bottom: 1px solid #e9ecef;">
            <div><strong>${u.nickname}</strong> (${u.phone})</div>
            <div style="font-size: 12px; color: #666;">注册时间：${u.createdAt}</div>
        </div>
    `).join('');
    document.getElementById('adminUserList').innerHTML = listHtml || '<p style="color: #999;">暂无用户</p>';
}

function saveAdminConfig() {
    const apiKey = document.getElementById('adminApiKey').value.trim();
    if (!apiKey) {
        alert('请输入API Key');
        return;
    }
    
    // 获取用户选择的API提供商
    const providerSelect = document.getElementById('apiProvider');
    const provider = providerSelect ? providerSelect.value : 'aliyun';
    
    Storage.set('admin_api_key', apiKey);
    Storage.set('api_provider', provider);
    
    alert(`配置已保存！使用: ${provider === 'aliyun' ? '阿里云百炼' : 'Kimi'}`);
}

function clearAdminConfig() {
    if (confirm('确定要清除所有配置吗？')) {
        Storage.remove('admin_api_key');
        Storage.remove('api_provider');
        document.getElementById('adminApiKey').value = '';
        const providerSelect = document.getElementById('apiProvider');
        if (providerSelect) {
            providerSelect.value = 'aliyun';
        }
        alert('配置已清除！');
    }
}