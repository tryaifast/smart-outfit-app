/**
 * @fileoverview 智能穿搭助手 - 主应用入口 (v15)
 * @module app
 * @description 应用主入口，协调各模块工作，处理用户交互
 * @author Smart Outfit Team
 * @version 15
 */

/**
 * 全局应用对象
 * @namespace App
 * @property {string} version - 应用版本号
 */

// 全局应用对象
const App = {
    version: '15',
    
    /**
     * 初始化应用
     */
    init() {
        console.log(`智能穿搭助手 v${this.version} 初始化中...`);
        
        // 初始化 UI 管理器
        ui.init();
        
        // 检查登录状态
        const user = userManager.init();
        if (user) {
            this.loadUserData();
            ui.showMainApp();
        } else {
            ui.showLoginPage();
        }
        
        // 绑定全局事件
        this.bindEvents();
        
        console.log('初始化完成');
    },

    /**
     * 加载用户数据
     */
    loadUserData() {
        const user = userManager.getCurrentUser();
        if (!user) return;

        // 加载衣橱
        wardrobeManager.load(user.phone);
        
        // 更新 UI
        ui.updateProfileDisplay(user);
        ui.renderWardrobe(wardrobeManager.getItems());
        
        // 更新天气
        this.updateWeather();
    },

    /**
     * 更新天气
     */
    async updateWeather() {
        const user = userManager.getCurrentUser();
        if (!user || !user.city) {
            ui.updateWeatherDisplay(null, null);
            return;
        }

        const result = await weatherManager.getWeather(user.city);
        if (result.success) {
            ui.updateWeatherDisplay(result.data, user.city);
        } else {
            ui.updateWeatherDisplay(null, user.city);
            Utils.toast(result.error, 'warning');
        }
    },

    /**
     * 绑定全局事件
     */
    bindEvents() {
        // 标签选择
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag')) {
                document.querySelectorAll('.tag').forEach(t => t.classList.remove('selected'));
                e.target.classList.add('selected');
            }
        });

        // 导航切换
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                ui.switchTab(tab.dataset.tab);
            });
        });

        // 登录/注册标签切换
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                if (tab.dataset.tab === 'login') {
                    ui.switchToLogin();
                } else {
                    ui.switchToRegister();
                }
            });
        });
    }
};

// ============ 用户认证 ============

async function handleLogin() {
    const phone = document.getElementById('loginPhone').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = event.target;
    
    ui.clearErrors();
    
    // 输入验证
    if (!phone) {
        ui.showLoginError('请输入手机号');
        document.getElementById('loginPhone').focus();
        return;
    }
    if (!password) {
        ui.showLoginError('请输入密码');
        document.getElementById('loginPassword').focus();
        return;
    }
    
    // 防止重复提交
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = '登录中...';
    
    try {
        const result = await userManager.login(phone, password);
        if (result.success) {
            App.loadUserData();
            ui.showMainApp();
            Utils.toast('登录成功', 'success');
        } else {
            ui.showLoginError(result.error);
            // 错误次数过多提示
            const errorCount = parseInt(sessionStorage.getItem('login_errors') || '0') + 1;
            sessionStorage.setItem('login_errors', errorCount);
            if (errorCount >= 3) {
                Utils.toast('已连续失败3次，请检查账号密码', 'warning');
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        ui.showLoginError('登录出错，请稍后重试');
    } finally {
        btn.disabled = false;
        btn.textContent = '登录';
    }
}

async function handleRegister() {
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirmPassword').value;
    const btn = event.target;
    
    ui.clearErrors();
    
    // 输入验证
    if (!phone) {
        ui.showRegError('请输入手机号');
        document.getElementById('regPhone').focus();
        return;
    }
    if (!password) {
        ui.showRegError('请设置密码');
        document.getElementById('regPassword').focus();
        return;
    }
    if (!confirm) {
        ui.showRegError('请确认密码');
        document.getElementById('regConfirmPassword').focus();
        return;
    }
    
    // 防止重复提交
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = '注册中...';
    
    try {
        const result = await userManager.register(phone, password, confirm);
        if (result.success) {
            ui.switchToLogin();
            Utils.toast('注册成功，请登录', 'success');
        } else {
            ui.showRegError(result.error);
        }
    } catch (error) {
        console.error('Register error:', error);
        ui.showRegError('注册出错，请稍后重试');
    } finally {
        btn.disabled = false;
        btn.textContent = '注册';
    }
}

function logout() {
    userManager.logout();
    ui.showLoginPage();
    Utils.toast('已退出登录');
}

// ============ 用户资料 ============

function saveProfile() {
    const btn = event.target;
    const nickname = document.getElementById('editNickname').value.trim();
    
    // 昵称长度验证
    if (nickname && nickname.length > 20) {
        Utils.toast('昵称不能超过20个字符', 'warning');
        return;
    }
    
    const profile = {
        nickname,
        gender: document.getElementById('editGender').value,
        ageRange: document.getElementById('editAgeRange').value,
        income: document.getElementById('editIncome').value,
        occupation: document.getElementById('editOccupation').value,
        style: document.getElementById('editStyle').value
    };
    
    // 防止重复提交
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = '保存中...';
    
    try {
        const result = userManager.updateProfile(profile);
        if (result.success) {
            ui.updateProfileDisplay(result.user);
            Utils.toast('资料已保存', 'success');
        } else {
            Utils.toast(result.error || '保存失败', 'error');
        }
    } catch (error) {
        console.error('Save profile error:', error);
        Utils.toast('保存资料失败', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '保存资料';
    }
}

function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 文件类型验证
    if (!file.type.startsWith('image/')) {
        Utils.toast('请选择图片文件', 'error');
        event.target.value = '';
        return;
    }
    
    // 文件大小验证
    if (file.size > 2 * 1024 * 1024) {
        Utils.toast('图片大小不能超过 2MB', 'error');
        event.target.value = '';
        return;
    }
    
    // 文件尺寸验证（可选）
    const img = new Image();
    img.onload = () => {
        if (img.width < 50 || img.height < 50) {
            Utils.toast('图片尺寸太小，建议 100x100 以上', 'warning');
        }
    };
    
    const reader = new FileReader();
    reader.onerror = () => {
        Utils.toast('读取图片失败', 'error');
        event.target.value = '';
    };
    reader.onload = (e) => {
        try {
            img.src = e.target.result;
            const result = userManager.updateProfile({ avatar: e.target.result });
            if (result.success) {
                ui.updateProfileDisplay(result.user);
                Utils.toast('头像已更新', 'success');
            } else {
                Utils.toast(result.error || '更新头像失败', 'error');
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
            Utils.toast('上传头像失败', 'error');
        } finally {
            event.target.value = '';
        }
    };
    reader.readAsDataURL(file);
}

// ============ 衣橱管理 ============

// 防抖处理添加衣物
const debouncedAddToWardrobe = Utils.debounce(function() {
    const text = document.getElementById('newClothes').value;
    const btn = document.getElementById('addClothesBtn');
    
    if (!text.trim()) {
        Utils.toast('请输入衣物描述', 'warning');
        return;
    }
    
    // 防止重复提交
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = '添加中...';
    
    try {
        const result = wardrobeManager.addItems(text);
        
        if (result.success) {
            document.getElementById('newClothes').value = '';
            ui.renderWardrobe(wardrobeManager.getItems());
            Utils.toast(`已添加 ${result.added} 件衣物，共 ${result.total} 件`, 'success');
            if (result.reachedLimit) {
                Utils.toast('衣橱已满（最多50件）', 'warning');
            }
        } else {
            Utils.toast(result.error, 'error');
        }
    } catch (error) {
        console.error('Add wardrobe error:', error);
        Utils.toast('添加衣物失败', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '添加衣物';
    }
}, 500);

function addToWardrobe() {
    return debouncedAddToWardrobe();
}

function removeFromWardrobe(id) {
    if (!id) return;
    
    try {
        if (wardrobeManager.removeItem(id)) {
            ui.renderWardrobe(wardrobeManager.getItems());
            Utils.toast('已删除');
        } else {
            Utils.toast('删除失败，请刷新重试', 'error');
        }
    } catch (error) {
        console.error('Remove wardrobe error:', error);
        Utils.toast('删除失败', 'error');
    }
}

// ============ 推荐 ============

// 防抖处理推荐请求（3秒内只能请求一次）
const debouncedGetRecommendation = Utils.debounce(async function() {
    const occasion = document.querySelector('.tag.selected')?.dataset.value;
    if (!occasion) {
        Utils.toast('请先选择场合', 'warning');
        return;
    }
    
    const user = userManager.getCurrentUser();
    if (!user) {
        Utils.toast('请先登录', 'warning');
        return;
    }
    
    const weather = weatherManager.getCurrentWeather();
    if (!weather) {
        Utils.toast('正在获取天气信息，请稍候...', 'info');
        // 尝试获取天气
        await App.updateWeather();
    }
    
    ui.showLoading();
    
    try {
        const result = await recommendationManager.getRecommendation({
            user,
            weather: weatherManager.getCurrentWeather(),
            occasion,
            wardrobe: wardrobeManager
        });
        
        if (result.success) {
            ui.showRecommendation(result.content, result.offline);
            if (result.offline) {
                Utils.toast('已使用离线推荐', 'warning');
            }
        } else {
            ui.hideLoading();
            ui.showRecommendation(result.error, true);
            Utils.toast(result.error, 'error');
        }
    } catch (error) {
        console.error('Recommendation error:', error);
        ui.hideLoading();
        ui.showRecommendation('获取推荐失败，请检查网络或稍后重试', true);
        Utils.toast('获取推荐失败', 'error');
    }
}, 3000);

async function getRecommendation() {
    return debouncedGetRecommendation();
}

// ============ 定位 ============

function openLocationModal() {
    ui.openLocationModal();
}

function closeLocationModal() {
    ui.closeLocationModal();
}

function selectLocationType(type) {
    document.querySelectorAll('.location-type-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    
    if (type === 'auto') {
        document.getElementById('autoLocationSection').style.display = 'block';
        document.getElementById('manualLocationSection').style.display = 'none';
    } else {
        document.getElementById('autoLocationSection').style.display = 'none';
        document.getElementById('manualLocationSection').style.display = 'block';
        ui.initLocationData();
    }
}

async function getCurrentLocation() {
    const statusEl = document.getElementById('locationStatus');
    const btn = event.target;
    
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = '定位中...';
    statusEl.textContent = '正在获取位置...';
    
    try {
        const location = await weatherManager.getGPSLocation();
        statusEl.textContent = `定位成功: ${location.lat.toFixed(2)}, ${location.lon.toFixed(2)}`;
        
        // 保存坐标
        const user = userManager.getCurrentUser();
        if (user) {
            user.location = `${location.lat.toFixed(4)},${location.lon.toFixed(4)}`;
            await userManager.updateProfile({});
            Utils.toast('位置已更新', 'success');
        }
    } catch (error) {
        console.error('Location error:', error);
        statusEl.textContent = `定位失败: ${error.message}`;
        Utils.toast(error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '📍 获取当前位置';
    }
}

function onProvinceChange() {
    const province = document.getElementById('provinceSelect').value;
    const citySelect = document.getElementById('citySelect');
    const districtSelect = document.getElementById('districtSelect');
    
    if (!province) {
        citySelect.innerHTML = '<option value="">选择城市</option>';
        districtSelect.innerHTML = '<option value="">选择区县</option>';
        return;
    }
    
    const data = weatherManager.getLocationData();
    const cities = data[province];
    
    if (Array.isArray(cities)) {
        // 直辖市
        citySelect.innerHTML = '<option value="">选择城市</option><option value="' + province + '">' + province + '</option>';
        districtSelect.innerHTML = '<option value="">选择区县</option>' + 
            cities.map(c => `<option value="${c}">${c}</option>`).join('');
    } else {
        // 省
        citySelect.innerHTML = '<option value="">选择城市</option>' + 
            Object.keys(cities).map(c => `<option value="${c}">${c}</option>`).join('');
        districtSelect.innerHTML = '<option value="">选择区县</option>';
    }
}

function onCityChange() {
    const province = document.getElementById('provinceSelect').value;
    const city = document.getElementById('citySelect').value;
    const districtSelect = document.getElementById('districtSelect');
    
    if (!city) {
        districtSelect.innerHTML = '<option value="">选择区县</option>';
        return;
    }
    
    const data = weatherManager.getLocationData();
    const districts = Array.isArray(data[province]) ? data[province] : data[province]?.[city];
    
    if (districts) {
        districtSelect.innerHTML = '<option value="">选择区县</option>' + 
            districts.map(d => `<option value="${d}">${d}</option>`).join('');
    }
}

async function confirmLocation() {
    const province = document.getElementById('provinceSelect').value;
    const city = document.getElementById('citySelect').value;
    const district = document.getElementById('districtSelect').value;
    const street = document.getElementById('streetInput').value;
    const btn = event.target;
    
    if (!province) {
        Utils.toast('请选择省份', 'warning');
        return;
    }
    if (!city) {
        Utils.toast('请选择城市', 'warning');
        return;
    }
    
    // 防止重复提交
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = '保存中...';
    
    try {
        const location = `${province}${city}${district || ''}${street || ''}`;
        const result = userManager.updateProfile({ 
            city: city === province ? city : city,
            location 
        });
        
        if (result.success) {
            ui.closeLocationModal();
            await App.updateWeather();
            Utils.toast('位置已更新', 'success');
        } else {
            Utils.toast(result.error || '保存失败', 'error');
        }
    } catch (error) {
        console.error('Confirm location error:', error);
        Utils.toast('保存位置失败', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '确定';
    }
}

// ============ 管理员 ============

function openAdminLogin() {
    ui.openAdminLogin();
}

function closeAdminLogin() {
    ui.closeAdminLogin();
}

function handleAdminLogin() {
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value;
    const btn = event.target;
    
    ui.clearErrors();
    
    // 输入验证
    if (!username) {
        ui.showAdminLoginError('请输入账号');
        return;
    }
    if (!password) {
        ui.showAdminLoginError('请输入密码');
        return;
    }
    
    // 防止重复提交
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = '登录中...';
    
    try {
        if (adminManager.verify(username, password)) {
            ui.closeAdminLogin();
            ui.showAdminPage();
            const config = adminManager.getConfig();
            ui.updateAdminDisplay({ userCount: userManager.getUserCount() }, config);
            Utils.toast('管理员登录成功', 'success');
        } else {
            ui.showAdminLoginError('账号或密码错误');
            // 记录错误次数
            const errorCount = parseInt(sessionStorage.getItem('admin_login_errors') || '0') + 1;
            sessionStorage.setItem('admin_login_errors', errorCount);
            if (errorCount >= 3) {
                Utils.toast('管理员登录失败次数过多', 'warning');
            }
        }
    } catch (error) {
        console.error('Admin login error:', error);
        ui.showAdminLoginError('登录出错，请稍后重试');
    } finally {
        btn.disabled = false;
        btn.textContent = '登录';
    }
}

function closeAdmin() {
    if (userManager.isLoggedIn()) {
        ui.showMainApp();
    } else {
        ui.showLoginPage();
    }
}

function saveAdminConfig() {
    const apiKey = document.getElementById('adminApiKey').value.trim();
    const provider = document.getElementById('apiProvider').value;
    const btn = event.target;
    
    // 验证
    if (!apiKey) {
        Utils.toast('请输入 API Key', 'warning');
        return;
    }
    
    // 验证 API Key 格式
    if (!apiKey.startsWith('sk-')) {
        Utils.toast('API Key 格式不正确，应以 sk- 开头', 'warning');
        return;
    }
    
    // 防止重复提交
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = '保存中...';
    
    try {
        const config = { provider, apiKey };
        adminManager.saveConfig(config);
        Utils.toast('配置已保存', 'success');
        
        // 验证配置是否生效
        const saved = adminManager.getConfig();
        if (saved.apiKey) {
            Utils.toast('API Key 已加密存储', 'success');
        }
    } catch (error) {
        console.error('Save config error:', error);
        Utils.toast('保存配置失败', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '保存配置';
    }
}

function clearAdminConfig() {
    adminManager.clearConfig();
    document.getElementById('adminApiKey').value = '';
    Utils.toast('配置已清除', 'success');
}

// ============ 启动应用 ============

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// 暴露全局函数供 HTML 调用
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.logout = logout;
window.saveProfile = saveProfile;
window.handleAvatarUpload = handleAvatarUpload;
window.addToWardrobe = addToWardrobe;
window.removeFromWardrobe = removeFromWardrobe;
window.getRecommendation = getRecommendation;
window.openLocationModal = openLocationModal;
window.closeLocationModal = closeLocationModal;
window.selectLocationType = selectLocationType;
window.getCurrentLocation = getCurrentLocation;
window.onProvinceChange = onProvinceChange;
window.onCityChange = onCityChange;
window.confirmLocation = confirmLocation;
window.openAdminLogin = openAdminLogin;
window.closeAdminLogin = closeAdminLogin;
window.handleAdminLogin = handleAdminLogin;
window.closeAdmin = closeAdmin;
window.saveAdminConfig = saveAdminConfig;
window.clearAdminConfig = clearAdminConfig;