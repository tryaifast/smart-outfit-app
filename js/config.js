/**
 * @fileoverview 配置模块 - 集中管理应用配置常量
 * @module config
 * @description 包含版本信息、API 配置、天气代码映射、城市坐标等全局常量
 * @author Smart Outfit Team
 * @version 15
 */

/**
 * 全局配置对象
 * @namespace CONFIG
 * @property {string} version - 应用版本号
 * @property {string} storagePrefix - LocalStorage 键名前缀
 * @property {number} maxWardrobeItems - 衣橱最大衣物数量
 * @property {number} maxUsersPerDevice - 单设备最大注册用户数
 * @property {Object} adminAccount - 管理员账号配置
 * @property {Object} api - API 端点配置
 * @property {Object} weatherCodes - WMO 天气代码映射表
 */

const CONFIG = {
    version: '15',
    storagePrefix: 'smart_outfit_',
    maxWardrobeItems: 50,
    maxUsersPerDevice: 5,
    adminAccount: {
        username: 'admin',
        password: 'admin123'
    },
    // API 配置
    api: {
        // Cloudflare Worker 代理端点（解决 CORS 问题）
        proxy: {
            endpoint: 'https://smart-outfit-proxy.475268601.workers.dev/chat',
            // 可选：备用 Worker 端点
            backupEndpoint: null
        },
        // 默认 AI 提供商
        defaultProvider: 'aliyun',  // 'aliyun' | 'kimi' | 'openai'
        // 直接调用（需要 CORS Unblock 扩展，不推荐）
        aliyun: {
            endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
            model: 'qwen-max',
            enabled: false  // 浏览器直接调用会被 CORS 拦截
        },
        weather: {
            endpoint: 'https://api.open-meteo.com/v1/forecast'
        }
    },
    // 天气代码映射
    weatherCodes: {
        0: '晴',
        1: '多云', 2: '多云',
        3: '阴',
        45: '雾', 48: '雾',
        51: '小雨', 53: '中雨', 55: '大雨',
        61: '小雨', 63: '中雨', 65: '大雨',
        71: '小雪', 73: '中雪', 75: '大雪',
        95: '雷雨', 96: '雷雨', 99: '雷雨'
    }
};

// 城市坐标数据（扩展版）
const CITY_COORDS = {
    // 直辖市
    '北京': [39.9, 116.4],
    '上海': [31.2, 121.5],
    '天津': [39.1, 117.2],
    '重庆': [29.6, 106.6],
    // 广东
    '广州': [23.1, 113.3],
    '深圳': [22.5, 114.1],
    '佛山': [23.0, 113.1],
    '东莞': [22.9, 113.7],
    // 江苏
    '南京': [32.1, 118.8],
    '苏州': [31.3, 120.6],
    '无锡': [31.5, 120.3],
    '常州': [31.8, 119.9],
    // 浙江
    '杭州': [30.3, 120.2],
    '宁波': [29.9, 121.5],
    '温州': [28.0, 120.7],
    // 四川
    '成都': [30.6, 104.1],
    '绵阳': [31.5, 104.7],
    // 湖北
    '武汉': [30.6, 114.3],
    '宜昌': [30.7, 111.3],
    // 陕西
    '西安': [34.3, 108.9],
    '咸阳': [34.3, 108.7],
    // 湖南
    '长沙': [28.2, 112.9],
    '株洲': [27.8, 113.1],
    // 河南
    '郑州': [34.8, 113.6],
    '洛阳': [34.6, 112.4],
    // 山东
    '济南': [36.7, 117.0],
    '青岛': [36.1, 120.4],
    // 福建
    '福州': [26.1, 119.3],
    '厦门': [24.5, 118.1],
    // 其他省会
    '合肥': [31.9, 117.3],
    '南昌': [28.7, 115.9],
    '昆明': [25.0, 102.7],
    '贵阳': [26.6, 106.7],
    '南宁': [22.8, 108.3],
    '海口': [20.0, 110.3],
    '石家庄': [38.0, 114.5],
    '太原': [37.9, 112.5],
    '沈阳': [41.8, 123.4],
    '长春': [43.9, 125.3],
    '哈尔滨': [45.8, 126.5],
    '兰州': [36.1, 103.8],
    '西宁': [36.6, 101.8],
    '银川': [38.5, 106.3],
    '乌鲁木齐': [43.8, 87.6],
    '拉萨': [29.7, 91.1],
    '呼和浩特': [40.8, 111.7]
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, CITY_COORDS };
}
