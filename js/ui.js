/**
 * @fileoverview UI 渲染模块 - 处理 DOM 操作和界面渲染
 * @module ui
 * @description 提供页面切换、表单渲染、衣橱渲染、天气显示、性能优化等功能
 * @author Smart Outfit Team
 * @version 2.0
 */

/**
 * UI 管理类
 * @class UIManager
 * @description 处理所有 DOM 操作和界面渲染，提供性能优化
 * @property {string} currentTab - 当前标签页
 * @property {object} elements - 缓存的 DOM 元素
 * @property {Map} renderCache - 渲染结果缓存
 * @property {number} wardrobeVisibleCount - 衣橱分批渲染数量
 * @property {number} wardrobeRenderDelay - 渲染延迟（ms）
 */

class UIManager {
    constructor() {
        this.currentTab = 'recommend';
        this.elements = {};
        this.renderCache = new Map(); // 渲染缓存
        this.wardrobeVisibleCount = 20; // 可见项数
        this.wardrobeRenderDelay = 16; // 渲染延迟（ms，约1帧）
    }

    /**
     * 初始化，缓存 DOM 元素
     */
    init() {
        // 缓存常用元素
        this.elements = {
            authPage: document.getElementById('authPage'),
            mainApp: document.getElementById('mainApp'),
            adminPage: document.getElementById('adminPage'),
            loginForm: document.getElementById('loginForm'),
            registerForm: document.getElementById('registerForm'),
            loginError: document.getElementById('loginError'),
            regError: document.getElementById('regError'),
            loading: document.getElementById('loading'),
            resultCard: document.getElementById('resultCard'),
            outfitList: document.getElementById('outfitList'),
            wardrobeList: document.getElementById('wardrobeList'),
            locationModal: document.getElementById('locationModal'),
            adminLoginModal: document.getElementById('adminLoginModal'),
            adminLoginError: document.getElementById('adminLoginError')
        };
    }

    // ============ 页面切换 ============

    showLoginPage() {
        this.elements.authPage.style.display = 'flex';
        this.elements.mainApp.style.display = 'none';
        this.elements.adminPage.style.display = 'none';
    }

    showMainApp() {
        this.elements.authPage.style.display = 'none';
        this.elements.mainApp.style.display = 'block';
        this.elements.adminPage.style.display = 'none';
    }

    showAdminPage() {
        this.elements.authPage.style.display = 'none';
        this.elements.mainApp.style.display = 'none';
        this.elements.adminPage.style.display = 'block';
    }

    switchToLogin() {
        this.elements.loginForm.style.display = 'block';
        this.elements.registerForm.style.display = 'none';
        this.clearErrors();
    }

    switchToRegister() {
        this.elements.loginForm.style.display = 'none';
        this.elements.registerForm.style.display = 'block';
        this.clearErrors();
    }

    // ============ 错误提示 ============

    showLoginError(message) {
        this.elements.loginError.textContent = message;
        this.elements.loginError.style.display = 'block';
    }

    showRegError(message) {
        this.elements.regError.textContent = message;
        this.elements.regError.style.display = 'block';
    }

    showAdminLoginError(message) {
        this.elements.adminLoginError.textContent = message;
        this.elements.adminLoginError.style.display = 'block';
    }

    clearErrors() {
        this.elements.loginError.textContent = '';
        this.elements.loginError.style.display = 'none';
        this.elements.regError.textContent = '';
        this.elements.regError.style.display = 'none';
        this.elements.adminLoginError.textContent = '';
        this.elements.adminLoginError.style.display = 'none';
    }

    // ============ 加载状态 ============

    showLoading() {
        this.elements.loading.style.display = 'block';
        this.elements.resultCard.style.display = 'none';
    }

    hideLoading() {
        this.elements.loading.style.display = 'none';
    }

    // ============ 推荐结果 ============

    showRecommendation(content, isOffline = false) {
        this.hideLoading();
        
        // XSS 过滤并渲染
        const safeContent = Utils.escapeHtml(content)
            .replace(/\n/g, '<br>')
            .replace(/#{1,6}\s/g, match => `<strong>${match.trim()}</strong> `);
        
        const offlineBadge = isOffline 
            ? '<div style="background:#f39c12;color:white;padding:8px 12px;border-radius:5px;margin-bottom:15px;font-size:12px;">⚠️ 离线推荐 - 配置 API Key 可获得更智能的 AI 推荐</div>'
            : '';
        
        this.elements.outfitList.innerHTML = offlineBadge + safeContent;
        this.elements.resultCard.style.display = 'block';
    }

    hideRecommendation() {
        this.elements.resultCard.style.display = 'none';
    }

    // ============ 衣橱渲染（性能优化） ============

    renderWardrobe(items) {
        const list = this.elements.wardrobeList;
        
        if (!items || items.length === 0) {
            list.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#999;padding:40px;">衣橱是空的，快去添加吧 👗</div>';
            return;
        }

        // 使用 requestAnimationFrame 优化渲染
        requestAnimationFrame(() => {
            // 分批渲染，避免大数据量卡顿
            if (items.length > this.wardrobeVisibleCount) {
                this._renderWardrobeBatch(list, items, 0);
            } else {
                list.innerHTML = this._generateWardrobeHTML(items);
            }
        });
    }
    
    /**
     * 分批渲染衣橱
     */
    _renderWardrobeBatch(container, items, startIndex) {
        const endIndex = Math.min(startIndex + this.wardrobeVisibleCount, items.length);
        const batch = items.slice(0, endIndex);
        
        container.innerHTML = this._generateWardrobeHTML(batch);
        
        // 如果有更多，显示"加载更多"提示
        if (endIndex < items.length) {
            const remaining = items.length - endIndex;
            const loadMore = document.createElement('div');
            loadMore.style.cssText = 'grid-column:1/-1;text-align:center;color:#999;padding:20px;';
            loadMore.textContent = `还有 ${remaining} 件衣物`;
            container.appendChild(loadMore);
        }
    }
    
    /**
     * 生成衣橱 HTML（带缓存）
     */
    _generateWardrobeHTML(items) {
        // 使用缓存
        const cacheKey = items.map(i => i.id).join(',');
        if (this.renderCache.has(cacheKey)) {
            return this.renderCache.get(cacheKey);
        }
        
        // 按类别分组
        const groups = {};
        items.forEach(item => {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category].push(item);
        });

        // 渲染分组
        let html = '';
        const categoryOrder = ['外套', '上衣', '裤子', '鞋子', '配饰', '其他'];
        
        categoryOrder.forEach(category => {
            if (groups[category]) {
                html += `<div style="grid-column:1/-1;font-weight:600;color:#667eea;margin:10px 0 5px;">${category}</div>`;
                html += groups[category].map(item => `
                    <div style="background:#f8f9fa;padding:12px;border-radius:10px;display:flex;justify-content:space-between;align-items:center;transition:all 0.2s;" onmouseover="this.style.background='#e9ecef'" onmouseout="this.style.background='#f8f9fa'">
                        <span style="font-size:14px;">${Utils.escapeHtml(item.name)}</span>
                        <button onclick="window.removeFromWardrobe('${item.id}')" style="background:#dc3545;color:white;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;font-size:12px;transition:all 0.2s;" onmouseover="this.style.background='#c82333'" onmouseout="this.style.background='#dc3545'">删除</button>
                    </div>
                `).join('');
            }
        });
        
        // 限制缓存大小
        if (this.renderCache.size > 50) {
            const firstKey = this.renderCache.keys().next().value;
            this.renderCache.delete(firstKey);
        }
        this.renderCache.set(cacheKey, html);

        return html;
    }

    // ============ 天气渲染 ============

    updateWeatherDisplay(weather, location) {
        document.getElementById('currentLocation').textContent = location || '点击设置位置';
        
        if (weather) {
            document.getElementById('weatherTemp').textContent = `${weather.temp}°`;
            document.getElementById('weatherDesc').textContent = weather.desc;
            document.getElementById('weatherRange').textContent = `风速 ${weather.windSpeed}km/h`;
        } else {
            document.getElementById('weatherTemp').textContent = '--°';
            document.getElementById('weatherDesc').textContent = '--';
            document.getElementById('weatherRange').textContent = '--';
        }
    }

    // ============ 用户资料渲染 ============

    updateProfileDisplay(user) {
        if (!user) return;

        document.getElementById('profileName').textContent = user.nickname || '未设置昵称';
        document.getElementById('profilePhone').textContent = user.phone;
        
        // 头像
        if (user.avatar) {
            document.getElementById('avatarImg').src = user.avatar;
            document.getElementById('avatarImg').style.display = 'block';
            document.getElementById('avatarPlaceholder').style.display = 'none';
        } else {
            document.getElementById('avatarImg').style.display = 'none';
            document.getElementById('avatarPlaceholder').style.display = 'block';
        }

        // 表单
        document.getElementById('editNickname').value = user.nickname || '';
        document.getElementById('editGender').value = user.gender || '';
        document.getElementById('editAgeRange').value = user.ageRange || '';
        document.getElementById('editIncome').value = user.income || '';
        document.getElementById('editOccupation').value = user.occupation || '';
        document.getElementById('editStyle').value = user.style || '';
    }

    // ============ 定位弹窗 ============

    openLocationModal() {
        this.elements.locationModal.style.display = 'flex';
    }

    closeLocationModal() {
        this.elements.locationModal.style.display = 'none';
    }

    // ============ 管理员弹窗 ============

    openAdminLogin() {
        this.elements.adminLoginModal.style.display = 'flex';
        this.clearErrors();
    }

    closeAdminLogin() {
        this.elements.adminLoginModal.style.display = 'none';
        this.clearErrors();
    }

    // ============ 标签页切换 ============

    switchTab(tabName) {
        // 更新导航
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // 更新内容
        document.querySelectorAll('.section').forEach(section => {
            section.classList.toggle('active', section.id === tabName);
        });

        this.currentTab = tabName;
    }

    // ============ 管理员页面 ============

    updateAdminDisplay(stats, config) {
        document.getElementById('adminUserCount').textContent = stats.userCount;
        
        if (config) {
            document.getElementById('apiProvider').value = config.provider || 'aliyun';
            document.getElementById('adminApiKey').value = config.apiKey || '';
        }
    }

    // ============ 初始化位置数据 ============

    initLocationData() {
        const provinces = Object.keys(weatherManager.getLocationData());
        const select = document.getElementById('provinceSelect');
        select.innerHTML = '<option value="">选择省份</option>' + 
            provinces.map(p => `<option value="${p}">${p}</option>`).join('');
    }
}

// 创建全局实例
const ui = new UIManager();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIManager, ui };
}

