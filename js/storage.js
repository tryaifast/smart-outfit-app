/**
 * @fileoverview 存储模块 - 封装 localStorage 操作，提供数据持久化和缓存
 * @module storage
 * @description 提供内存缓存、批量写入、数据加密、过期清理等功能
 * @author Smart Outfit Team
 * @version 2.0
 */

/**
 * 存储管理类
 * @class Storage
 * @description 封装 LocalStorage 操作，提供高性能缓存和加密存储
 * @property {string} prefix - 键名前缀
 * @property {Map} cache - 内存缓存
 * @property {number} cacheTTL - 缓存过期时间（默认5分钟）
 * @property {Map} writeQueue - 批量写入队列
 */

class Storage {
    constructor(prefix = 'smart_outfit_') {
        this.prefix = prefix;
        // 内存缓存
        this.cache = new Map();
        // 缓存过期时间（毫秒）
        this.cacheTTL = 5 * 60 * 1000; // 5分钟
        // 批量写入队列
        this.writeQueue = new Map();
        this.writeTimer = null;
    }

    /**
     * 获取存储的键名
     * @param {string} key - 原始键名
     * @returns {string} 完整键名
     */
    _key(key) {
        return this.prefix + key;
    }

    /**
     * 获取数据（带缓存）
     * @param {string} key - 键名
     * @param {boolean} useCache - 是否使用缓存
     * @returns {any} 解析后的数据
     */
    get(key, useCache = true) {
        const fullKey = this._key(key);
        
        // 先查内存缓存
        if (useCache && this.cache.has(fullKey)) {
            const cached = this.cache.get(fullKey);
            if (Date.now() - cached.time < this.cacheTTL) {
                return cached.data;
            }
            // 缓存过期，删除
            this.cache.delete(fullKey);
        }
        
        try {
            const data = localStorage.getItem(fullKey);
            const parsed = data ? JSON.parse(data) : null;
            
            // 写入缓存
            if (useCache && parsed !== null) {
                this.cache.set(fullKey, { data: parsed, time: Date.now() });
            }
            
            return parsed;
        } catch (e) {
            console.error('Storage get error:', e);
            return null;
        }
    }
    
    /**
     * 批量获取数据
     * @param {string[]} keys - 键名数组
     * @returns {object} 键值对对象
     */
    getBatch(keys) {
        const result = {};
        keys.forEach(key => {
            result[key] = this.get(key);
        });
        return result;
    }

    /**
     * 设置数据（带缓存和批量写入）
     * @param {string} key - 键名
     * @param {any} value - 值
     * @param {boolean} immediate - 是否立即写入
     */
    set(key, value, immediate = false) {
        const fullKey = this._key(key);
        
        // 更新内存缓存
        this.cache.set(fullKey, { data: value, time: Date.now() });
        
        if (immediate) {
            this._writeToStorage(fullKey, value);
        } else {
            // 加入批量写入队列
            this.writeQueue.set(fullKey, value);
            this._scheduleBatchWrite();
        }
    }
    
    /**
     * 批量设置数据
     * @param {object} data - 键值对对象
     */
    setBatch(data) {
        Object.entries(data).forEach(([key, value]) => {
            this.set(key, value);
        });
    }
    
    /**
     * 立即写入存储
     */
    flush() {
        if (this.writeTimer) {
            clearTimeout(this.writeTimer);
            this.writeTimer = null;
        }
        this._executeBatchWrite();
    }
    
    /**
     * 调度批量写入
     */
    _scheduleBatchWrite() {
        if (this.writeTimer) return;
        
        this.writeTimer = setTimeout(() => {
            this._executeBatchWrite();
        }, 100); // 100ms 延迟批量写入
    }
    
    /**
     * 执行批量写入
     */
    _executeBatchWrite() {
        this.writeTimer = null;
        
        if (this.writeQueue.size === 0) return;
        
        const entries = Array.from(this.writeQueue.entries());
        this.writeQueue.clear();
        
        entries.forEach(([key, value]) => {
            this._writeToStorage(key, value);
        });
    }
    
    /**
     * 写入到 localStorage
     */
    _writeToStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Storage set error:', e);
            if (e.name === 'QuotaExceededError') {
                this._handleQuotaExceeded();
            }
        }
    }
    
    /**
     * 处理存储空间不足
     */
    _handleQuotaExceeded() {
        // 清理过期缓存
        const now = Date.now();
        let freed = 0;
        
        this.cache.forEach((cached, key) => {
            if (now - cached.time > this.cacheTTL) {
                this.cache.delete(key);
                freed++;
            }
        });
        
        if (freed > 0) {
            console.log(`清理了 ${freed} 个过期缓存项`);
            Utils.toast('存储空间不足，已自动清理过期数据', 'warning');
        } else {
            Utils.toast('存储空间不足，请手动清理数据', 'error');
        }
    }

    /**
     * 删除数据
     * @param {string} key - 键名
     */
    remove(key) {
        localStorage.removeItem(this._key(key));
    }

    /**
     * 清空所有数据
     */
    clear() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
            }
        });
        this.cache.clear();
    }
    
    /**
     * 清除当前用户（用于强制登出）
     */
    clearCurrentUser() {
        this.remove('current_user');
    }
    
    /**
     * 数据加密存储（敏感数据）
     * @param {string} key - 键名
     * @param {any} value - 值
     */
    setEncrypted(key, value) {
        try {
            const json = JSON.stringify(value);
            // 简单的 XOR 加密（非安全级别，仅防直接读取）
            const encrypted = this._xorEncrypt(json, this._getDeviceKey());
            localStorage.setItem(this._key(key), encrypted);
        } catch (e) {
            console.error('Encryption error:', e);
        }
    }
    
    /**
     * 解密读取
     * @param {string} key - 键名
     * @returns {any}
     */
    getEncrypted(key) {
        try {
            const encrypted = localStorage.getItem(this._key(key));
            if (!encrypted) return null;
            const json = this._xorEncrypt(encrypted, this._getDeviceKey());
            return JSON.parse(json);
        } catch (e) {
            console.error('Decryption error:', e);
            return null;
        }
    }
    
    /**
     * XOR 加密/解密
     */
    _xorEncrypt(text, key) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    }
    
    /**
     * 获取设备唯一密钥
     */
    _getDeviceKey() {
        // 使用浏览器指纹生成密钥
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width,
            screen.height,
            new Date().getTimezoneOffset()
        ].join('|');
        
        // 简单的哈希
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        return 'key_' + Math.abs(hash).toString(36);
    }

    /**
     * 获取所有键
     * @returns {string[]}
     */
    keys() {
        return Object.keys(localStorage)
            .filter(key => key.startsWith(this.prefix))
            .map(key => key.slice(this.prefix.length));
    }

    // ============ 业务数据快捷方法 ============

    /**
     * 获取当前用户
     * @returns {object|null}
     */
    getCurrentUser() {
        return this.get('current_user');
    }

    /**
     * 设置当前用户
     * @param {object} user - 用户对象
     */
    setCurrentUser(user) {
        this.set('current_user', user);
    }

    /**
     * 清除当前用户
     */
    clearCurrentUser() {
        this.remove('current_user');
    }

    /**
     * 获取所有用户
     * @returns {object}
     */
    getUsers() {
        return this.get('users') || {};
    }

    /**
     * 保存用户
     * @param {string} phone - 手机号
     * @param {object} user - 用户数据
     */
    saveUser(phone, user) {
        const users = this.getUsers();
        users[phone] = user;
        this.set('users', users);
    }

    /**
     * 获取设备 ID
     * @returns {string}
     */
    getDeviceId() {
        let id = this.get('device_id');
        if (!id) {
            id = Utils.id();
            this.set('device_id', id);
        }
        return id;
    }

    /**
     * 获取设备注册记录
     * @returns {object}
     */
    getDeviceRegistrations() {
        return this.get('device_registrations') || {};
    }

    /**
     * 记录设备注册
     * @param {string} phone - 手机号
     */
    recordDeviceRegistration(phone) {
        const regs = this.getDeviceRegistrations();
        regs[phone] = {
            deviceId: this.getDeviceId(),
            registeredAt: new Date().toISOString()
        };
        this.set('device_registrations', regs);
    }

    /**
     * 获取设备注册数量
     * @returns {number}
     */
    getDeviceRegistrationCount() {
        const deviceId = this.getDeviceId();
        const regs = this.getDeviceRegistrations();
        return Object.values(regs).filter(r => r.deviceId === deviceId).length;
    }

    /**
     * 获取管理员配置
     * @returns {object}
     */
    getAdminConfig() {
        return this.get('admin_config') || {};
    }

    /**
     * 保存管理员配置
     * @param {object} config - 配置对象
     */
    setAdminConfig(config) {
        // API Key 加密存储
        if (config.apiKey) {
            config.apiKeyEncrypted = Utils.encrypt(config.apiKey);
            delete config.apiKey;
        }
        this.set('admin_config', config);
    }

    /**
     * 获取解密的 API Key
     * @returns {string|null}
     */
    getDecryptedApiKey() {
        const config = this.getAdminConfig();
        if (config.apiKeyEncrypted) {
            return Utils.decrypt(config.apiKeyEncrypted);
        }
        return null;
    }

    /**
     * 获取缓存数据
     * @param {string} key - 缓存键
     * @param {number} maxAge - 最大有效期(ms)
     * @returns {any|null}
     */
    getCache(key, maxAge = 3600000) {
        const cache = this.get(`cache_${key}`);
        if (!cache) return null;
        
        if (Date.now() - cache.timestamp > maxAge) {
            this.remove(`cache_${key}`);
            return null;
        }
        return cache.data;
    }

    /**
     * 设置缓存
     * @param {string} key - 缓存键
     * @param {any} data - 缓存数据
     */
    setCache(key, data) {
        this.set(`cache_${key}`, {
            data,
            timestamp: Date.now()
        });
    }
}

// 创建全局实例
const storage = new Storage();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Storage, storage };
}
