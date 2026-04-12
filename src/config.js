/**
 * 智能穿搭助手 - 全局配置模块
 * v2.0 - 重构版本
 * 
 * 安全改进：
 * - 移除硬编码管理员密码，改为环境变量或首次运行时设置
 * - 增加密码强度要求配置
 */

const CONFIG = {
    version: '2.0',
    storagePrefix: 'smart_outfit_v2_',
    
    // 业务限制
    maxWardrobeItems: 50,
    maxUsersPerDevice: 5,
    
    // 安全配置
    security: {
        // 管理员密码不再硬编码！
        // 首次运行时需要设置，或通过环境变量 ADMIN_PASSWORD 配置
        adminPasswordEnvKey: 'ADMIN_PASSWORD',
        
        // 密码强度要求
        minPasswordLength: 8,
        requirePasswordComplexity: true,  // 要求包含数字和字母
        
        // Session 超时（毫秒）
        sessionTimeout: 7 * 24 * 60 * 60 * 1000, // 7天
    },
    
    // 默认城市坐标（用于天气 API）
    cityCoords: {
        '北京': [39.9, 116.4],
        '上海': [31.2, 121.5],
        '广州': [23.1, 113.3],
        '深圳': [22.5, 114.1],
        '杭州': [30.3, 120.2],
        '南京': [32.1, 118.8],
        '成都': [30.6, 104.1],
        '武汉': [30.6, 114.3],
        '西安': [34.3, 108.9],
        '重庆': [29.6, 106.6],
        '天津': [39.1, 117.2],
        '苏州': [31.3, 120.6],
        '郑州': [34.7, 113.6],
        '长沙': [28.2, 112.9],
        '青岛': [36.1, 120.4],
        '大连': [38.9, 121.6],
        '厦门': [24.5, 118.1],
        '沈阳': [41.8, 123.4],
        '哈尔滨': [45.8, 126.5],
        '昆明': [25.0, 102.7],
    },
    
    // API 配置
    api: {
        defaultProvider: 'aliyun',
        providers: {
            aliyun: {
                name: '阿里云百炼',
                baseUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
                model: 'qwen-max',
                headerFormat: 'X-DashScope-API-Key',
            },
            kimi: {
                name: 'Kimi (Moonshot)',
                baseUrl: 'https://api.moonshot.cn/v1/chat/completions',
                model: 'moonshot-v1-8k',
                headerFormat: 'Authorization',
            },
        },
    },
    
    // 穿搭场合配置
    occasions: [
        { value: 'important_meeting', label: '重要会议', icon: '💼' },
        { value: 'daily_work', label: '普通上班', icon: '🏢' },
        { value: 'client_visit', label: '客户拜访', icon: '🤝' },
        { value: 'party', label: '派对聚会', icon: '🎉' },
        { value: 'date', label: '约会', icon: '💕' },
        { value: 'interview', label: '面试', icon: '📋' },
        { value: 'casual', label: '休闲日常', icon: '☀️' },
        { value: 'travel', label: '旅行出游', icon: '✈️' },
        { value: 'sport', label: '运动健身', icon: '🏃' },
    ],
    
    // 用户资料选项
    profileOptions: {
        genders: [
            { value: 'male', label: '男' },
            { value: 'female', label: '女' },
            { value: 'other', label: '其他' },
        ],
        ageRanges: [
            { value: '18-25', label: '18-25岁' },
            { value: '26-35', label: '26-35岁' },
            { value: '36-45', label: '36-45岁' },
            { value: '46-55', label: '46-55岁' },
            { value: '56+', label: '56岁以上' },
        ],
        incomes: [
            { value: '0-5k', label: '5k以下' },
            { value: '5k-10k', label: '5k-10k' },
            { value: '10k-20k', label: '10k-20k' },
            { value: '20k-30k', label: '20k-30k' },
            { value: '30k-50k', label: '30k-50k' },
            { value: '50k+', label: '50k以上' },
        ],
        styles: [
            { value: 'minimalist', label: '简约极简' },
            { value: 'classic', label: '经典优雅' },
            { value: 'trendy', label: '时尚潮流' },
            { value: 'business', label: '商务干练' },
            { value: 'casual', label: '休闲舒适' },
            { value: 'sporty', label: '运动活力' },
            { value: 'artsy', label: '文艺复古' },
        ],
    },
};

// 导出配置（ES Module 格式）
export default CONFIG;