/**
 * @fileoverview 衣橱模块 - 处理衣物管理和推荐逻辑
 * @module wardrobe
 * @description 提供衣物增删改查、智能分类、推荐匹配等功能
 * @author Smart Outfit Team
 * @version 1.0
 */

/**
 * 衣橱管理类
 * @class WardrobeManager
 * @description 处理衣物管理和推荐匹配
 * @property {array} items - 当前用户的衣物列表
 */

class WardrobeManager {
    constructor() {
        this.items = [];
    }

    /**
     * 加载用户的衣橱
     * @param {string} phone - 用户手机号
     */
    load(phone) {
        const user = storage.getUsers()[phone];
        this.items = user?.wardrobe || [];
    }

    /**
     * 获取所有衣物
     * @returns {array}
     */
    getItems() {
        return this.items;
    }

    /**
     * 获取衣物数量
     * @returns {number}
     */
    getCount() {
        return this.items.length;
    }

    /**
     * 添加衣物
     * @param {string} text - 衣物描述文本（支持多行）
     * @returns {object} { success: boolean, added: number, error?: string }
     */
    addItems(text) {
        if (!text.trim()) {
            return { success: false, error: '请输入衣物描述' };
        }

        const lines = text.split(/\n/).filter(line => line.trim());
        let added = 0;
        const maxItems = CONFIG.maxWardrobeItems;

        for (const line of lines) {
            if (this.items.length >= maxItems) {
                break;
            }

            this.items.push({
                id: Utils.id(),
                name: Utils.escapeHtml(line.trim()),
                category: this._detectCategory(line.trim()),
                addedAt: new Date().toISOString()
            });
            added++;
        }

        // 保存
        if (added > 0 && userManager.currentUser) {
            userManager.currentUser.wardrobe = this.items;
            storage.saveUser(userManager.currentUser.phone, userManager.currentUser);
            storage.setCurrentUser(userManager.currentUser);
        }

        return { 
            success: true, 
            added,
            total: this.items.length,
            reachedLimit: this.items.length >= maxItems
        };
    }

    /**
     * 删除衣物
     * @param {string} id - 衣物 ID
     * @returns {boolean}
     */
    removeItem(id) {
        const index = this.items.findIndex(item => item.id === id);
        if (index === -1) return false;

        this.items.splice(index, 1);
        
        if (userManager.currentUser) {
            userManager.currentUser.wardrobe = this.items;
            storage.saveUser(userManager.currentUser.phone, userManager.currentUser);
            storage.setCurrentUser(userManager.currentUser);
        }

        return true;
    }

    /**
     * 自动识别衣物类别
     * @param {string} name - 衣物名称
     * @returns {string}
     */
    _detectCategory(name) {
        const categories = {
            '外套': ['外套', '夹克', '风衣', '大衣', '羽绒服', '棉服', '皮衣', '西装', '开衫'],
            '上衣': ['T恤', '衬衫', '卫衣', '毛衣', '针织衫', '打底衫', '背心', '吊带', 'POLO'],
            '裤子': ['裤', '牛仔裤', '西裤', '休闲裤', '运动裤', '短裤', '裙'],
            '鞋子': ['鞋', '靴', '运动鞋', '皮鞋', '帆布鞋', '凉鞋', '拖鞋'],
            '配饰': ['帽', '围巾', '手套', '包', '腰带', '领带', '项链', '耳环', '手表']
        };

        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(kw => name.includes(kw))) {
                return category;
            }
        }

        return '其他';
    }

    /**
     * 按类别分组
     * @returns {object}
     */
    getByCategory() {
        const groups = {};
        for (const item of this.items) {
            if (!groups[item.category]) {
                groups[item.category] = [];
            }
            groups[item.category].push(item);
        }
        return groups;
    }

    /**
     * 获取推荐用的衣橱文本
     * @returns {string}
     */
    getRecommendationText() {
        if (this.items.length === 0) {
            return '暂无衣物';
        }
        return this.items.map(i => i.name).join(', ');
    }

    /**
     * 搜索衣物
     * @param {string} keyword 
     * @returns {array}
     */
    search(keyword) {
        if (!keyword) return this.items;
        return this.items.filter(item => 
            item.name.toLowerCase().includes(keyword.toLowerCase())
        );
    }
}

// 推荐模块
class RecommendationManager {
    constructor() {
        this.occasions = {
            important_meeting: { name: '重要会议', style: 'formal' },
            daily_work: { name: '普通上班', style: 'business_casual' },
            client_visit: { name: '客户拜访', style: 'business' },
            party: { name: '派对聚会', style: 'casual_trendy' },
            date: { name: '约会', style: 'smart_casual' },
            interview: { name: '面试', style: 'formal' },
            casual: { name: '休闲日常', style: 'casual' }
        };
    }

    /**
     * 获取场合列表
     * @returns {object}
     */
    getOccasions() {
        return this.occasions;
    }

    /**
     * 构建推荐提示词
     * @param {object} params 
     * @returns {string}
     */
    buildPrompt(params) {
        const { user, weather, occasion, wardrobe } = params;
        
        const userProfile = [
            user.nickname || '用户',
            user.gender === 'male' ? '男性' : user.gender === 'female' ? '女性' : '性别未知',
            user.ageRange || '年龄未知',
            user.occupation || '职业未知',
            user.income ? `月收入${user.income}` : '收入未知',
            user.style ? `偏好${user.style}风格` : '风格偏好未知'
        ].join(', ');

        const weatherText = weather 
            ? `${weather.desc}, ${weather.temp}°C, 风速${weather.windSpeed}km/h`
            : '天气信息未知';

        const occasionName = this.occasions[occasion]?.name || '日常';
        const wardrobeText = wardrobe.getRecommendationText();

        return `请为以下用户推荐穿搭方案：

【用户画像】
${userProfile}

【天气情况】
${weatherText}

【场合】
${occasionName}

【现有衣橱】
${wardrobeText}

请推荐3套穿搭方案，每套包含：
1. 风格定位（如：商务正式、休闲舒适等）
2. 具体搭配（上衣+下装+鞋子+配饰）
3. 推荐理由（结合天气、场合、用户画像）
4. 从用户衣橱中选择可搭配的单品建议

输出格式清晰，使用emoji增加可读性。`;
    }

    /**
     * 获取推荐
     * @param {object} params 
     * @returns {Promise<object>}
     */
    async getRecommendation(params) {
        const { occasion } = params;
        
        if (!occasion) {
            return { success: false, error: '请先选择场合' };
        }

        const prompt = this.buildPrompt(params);

        try {
            const content = await api.getAIRecommendation(prompt);
            return { success: true, content };
        } catch (error) {
            // 降级到离线推荐
            console.log('AI API failed, using offline recommendation:', error.message);
            const offlineContent = api.getOfflineRecommendation({
                weather: params.weather,
                occasion,
                wardrobe: params.wardrobe.getItems().map(i => i.name)
            });
            return { success: true, content: offlineContent, offline: true };
        }
    }
}

// 创建全局实例
const wardrobeManager = new WardrobeManager();
const recommendationManager = new RecommendationManager();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WardrobeManager, RecommendationManager, wardrobeManager, recommendationManager };
}
