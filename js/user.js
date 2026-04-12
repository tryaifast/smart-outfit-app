/**
 * @fileoverview 用户模块 - 处理用户认证、注册、资料管理
 * @module user
 * @description 提供登录失败锁定、会话超时、密码强度检查、设备注册限制等安全功能
 * @author Smart Outfit Team
 * @version 2.0
 */

/**
 * 用户管理类
 * @class UserManager
 * @description 处理用户认证和资料管理，提供多层安全防护
 * @property {object} currentUser - 当前登录用户
 * @property {Map} loginAttempts - 登录失败记录
 * @property {number} maxLoginAttempts - 最大登录尝试次数（默认5次）
 * @property {number} lockoutDuration - 账号锁定时间（默认15分钟）
 * @property {number} sessionTimeout - 会话超时时间（默认24小时）
 */

class UserManager {
    constructor() {
        this.currentUser = null;
        this.loginAttempts = new Map(); // 登录尝试记录
        this.maxLoginAttempts = 5; // 最大登录尝试次数
        this.lockoutDuration = 15 * 60 * 1000; // 锁定时间 15 分钟
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 会话超时 24 小时
    }

    /**
     * 初始化
     * @returns {object|null} 当前用户
     */
    init() {
        this.currentUser = storage.getCurrentUser();
        return this.currentUser;
    }

    /**
     * 获取当前用户
     * @returns {object|null}
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * 检查是否已登录
     * @returns {boolean}
     */
    isLoggedIn() {
        return !!this.currentUser;
    }

    /**
     * 验证手机号
     * @param {string} phone 
     * @returns {boolean}
     */
    validatePhone(phone) {
        return Utils.isValidPhone(phone);
    }

    /**
     * 检查手机号是否已注册
     * @param {string} phone 
     * @returns {boolean}
     */
    isPhoneRegistered(phone) {
        const users = storage.getUsers();
        return !!users[phone];
    }

    /**
     * 检查设备注册次数
     * @returns {boolean}
     */
    canDeviceRegister() {
        return storage.getDeviceRegistrationCount() < CONFIG.maxUsersPerDevice;
    }

    /**
     * 检查账号是否被锁定
     */
    isAccountLocked(phone) {
        const attempts = this.loginAttempts.get(phone);
        if (!attempts) return false;
        
        if (attempts.count >= this.maxLoginAttempts) {
            if (Date.now() - attempts.lastAttempt < this.lockoutDuration) {
                const remaining = Math.ceil((this.lockoutDuration - (Date.now() - attempts.lastAttempt)) / 60000);
                return { locked: true, remainingMinutes: remaining };
            }
            // 锁定时间已过，重置
            this.loginAttempts.delete(phone);
        }
        return { locked: false };
    }
    
    /**
     * 记录登录失败
     */
    recordLoginFailure(phone) {
        const attempts = this.loginAttempts.get(phone) || { count: 0, lastAttempt: 0 };
        attempts.count++;
        attempts.lastAttempt = Date.now();
        this.loginAttempts.set(phone, attempts);
    }
    
    /**
     * 清除登录失败记录
     */
    clearLoginAttempts(phone) {
        this.loginAttempts.delete(phone);
    }
    
    /**
     * 检查会话是否过期
     */
    isSessionExpired(user) {
        if (!user || !user.lastLogin) return true;
        return Date.now() - user.lastLogin > this.sessionTimeout;
    }

    /**
     * 登录（带安全加固）
     * @param {string} phone 
     * @param {string} password 
     * @returns {object} { success: boolean, user?: object, error?: string }
     */
    async login(phone, password) {
        if (!phone || !password) {
            return { success: false, error: '请填写手机号和密码' };
        }

        if (!this.validatePhone(phone)) {
            return { success: false, error: '手机号格式不正确' };
        }
        
        // 检查账号是否被锁定
        const lockStatus = this.isAccountLocked(phone);
        if (lockStatus.locked) {
            return { success: false, error: `账号已锁定，请 ${lockStatus.remainingMinutes} 分钟后重试` };
        }

        const users = storage.getUsers();
        const user = users[phone];

        if (!user) {
            return { success: false, error: '用户不存在' };
        }

        // SHA-256 验证密码
        const hashedPassword = await Utils.sha256(password);
        if (user.passwordHash !== hashedPassword) {
            // 记录登录失败
            this.recordLoginFailure(phone);
            const attempts = this.loginAttempts.get(phone);
            const remaining = this.maxLoginAttempts - attempts.count;
            return { success: false, error: `密码错误，还剩 ${remaining} 次机会` };
        }
        
        // 检查会话是否过期
        if (this.isSessionExpired(user)) {
            return { success: false, error: '会话已过期，请重新登录' };
        }

        // 登录成功，清除失败记录
        this.clearLoginAttempts(phone);
        
        // 更新最后登录时间
        user.lastLogin = Date.now();
        
        this.currentUser = user;
        storage.setCurrentUser(user);
        
        return { success: true, user };
    }

    /**
     * 注册
     * @param {string} phone 
     * @param {string} password 
     * @param {string} confirmPassword 
     * @returns {object}
     */
    async register(phone, password, confirmPassword) {
        if (!phone || !password || !confirmPassword) {
            return { success: false, error: '请填写所有信息' };
        }

        if (!this.validatePhone(phone)) {
            return { success: false, error: '手机号格式不正确' };
        }

        if (password !== confirmPassword) {
            return { success: false, error: '两次密码不一致' };
        }

        // 密码强度检查
        const strength = this.checkPasswordStrength(password);
        if (strength.score < 2) {
            return { success: false, error: `密码强度不足: ${strength.message}` };
        }

        if (!this.canDeviceRegister()) {
            return { success: false, error: '该设备注册次数已达上限(5次)' };
        }

        if (this.isPhoneRegistered(phone)) {
            return { success: false, error: '该手机号已注册' };
        }

        // 创建新用户
        const hashedPassword = await Utils.sha256(password);
        const newUser = {
            phone,
            passwordHash: hashedPassword,
            nickname: '',
            gender: '',
            ageRange: '',
            income: '',
            occupation: '',
            style: '',
            city: '',
            location: '',
            wardrobe: [],
            avatar: '',
            createdAt: new Date().toISOString()
        };

        storage.saveUser(phone, newUser);
        storage.recordDeviceRegistration(phone);

        return { success: true };
    }

    /**
     * 更新用户资料
     * @param {object} profile 
     * @returns {object}
     */
    updateProfile(profile) {
        if (!this.currentUser) {
            return { success: false, error: '未登录' };
        }

        const allowedFields = ['nickname', 'gender', 'ageRange', 'income', 'occupation', 'style', 'city', 'location', 'avatar'];
        
        allowedFields.forEach(field => {
            if (profile[field] !== undefined) {
                this.currentUser[field] = Utils.escapeHtml(profile[field]);
            }
        });

        storage.saveUser(this.currentUser.phone, this.currentUser);
        storage.setCurrentUser(this.currentUser);

        return { success: true, user: this.currentUser };
    }

    /**
     * 退出登录
     */
    logout() {
        this.currentUser = null;
        storage.clearCurrentUser();
    }

    /**
     * 获取所有用户（管理员用）
     * @returns {object}
     */
    getAllUsers() {
        return storage.getUsers();
    }

    /**
     * 获取用户数量
     * @returns {number}
     */
    getUserCount() {
        return Object.keys(storage.getUsers()).length;
    }
    
    /**
     * 检查密码强度
     * @param {string} password
     * @returns {object} { score: 0-4, message: string }
     */
    checkPasswordStrength(password) {
        let score = 0;
        const checks = [];
        
        // 长度检查
        if (password.length >= 8) {
            score++;
        } else {
            checks.push('至少8位');
        }
        
        // 包含数字
        if (/\d/.test(password)) {
            score++;
        } else {
            checks.push('包含数字');
        }
        
        // 包含小写字母
        if (/[a-z]/.test(password)) {
            score++;
        } else {
            checks.push('包含小写字母');
        }
        
        // 包含大写字母或特殊字符
        if (/[A-Z]/.test(password) || /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            score++;
        } else {
            checks.push('包含大写字母或特殊字符');
        }
        
        const messages = [
            '极弱（极易被破解）',
            '弱（建议加强）',
            '中等（基本安全）',
            '强（推荐）',
            '极强（非常安全）'
        ];
        
        return {
            score,
            message: score < 2 ? `需要: ${checks.join(', ')}` : messages[score],
            checks
        };
    }
    
    /**
     * 强制登出（会话过期）
     */
    forceLogout() {
        this.currentUser = null;
        storage.clearCurrentUser();
    }
}

// 管理员模块
class AdminManager {
    /**
     * 验证管理员登录
     * @param {string} username 
     * @param {string} password 
     * @returns {boolean}
     */
    verify(username, password) {
        return username === CONFIG.adminAccount.username && 
               password === CONFIG.adminAccount.password;
    }

    /**
     * 保存配置
     * @param {object} config 
     */
    saveConfig(config) {
        storage.setAdminConfig(config);
    }

    /**
     * 获取配置
     * @returns {object}
     */
    getConfig() {
        const config = storage.getAdminConfig();
        // 解密 API Key 用于显示
        if (config.apiKeyEncrypted) {
            config.apiKey = storage.getDecryptedApiKey();
        }
        return config;
    }

    /**
     * 清除配置
     */
    clearConfig() {
        storage.remove('admin_config');
    }
}

// 创建全局实例
const userManager = new UserManager();
const adminManager = new AdminManager();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UserManager, AdminManager, userManager, adminManager };
}
