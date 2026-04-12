/**
 * @fileoverview 工具函数模块 - 提供通用工具函数
 * @module utils
 * @description 包含 ID 生成、Toast 提示、HTML 转义、防抖、SHA-256 等工具函数
 * @author Smart Outfit Team
 * @version 1.0
 */

/**
 * 工具函数命名空间
 * @namespace Utils
 */
const Utils = {

const Utils = {
    /**
     * 生成唯一 ID
     * @returns {string} 唯一标识符
     */
    id() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
    },

    /**
     * 显示 Toast 提示
     * @param {string} message - 提示内容
     * @param {string} type - 类型: info/success/error/warning
     * @param {number} duration - 显示时长(ms)
     */
    toast(message, type = 'info', duration = 3000) {
        const el = document.createElement('div');
        el.className = `toast toast-${type}`;
        el.textContent = message;
        
        // 样式
        el.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 8px;
            color: white;
            font-size: 14px;
            z-index: 10000;
            animation: slideDown 0.3s ease;
            background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : type === 'warning' ? '#f39c12' : '#667eea'};
        `;
        
        document.body.appendChild(el);
        
        setTimeout(() => {
            el.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => el.remove(), 300);
        }, duration);
    },

    /**
     * 防抖函数
     * @param {Function} fn - 要执行的函数
     * @param {number} delay - 延迟时间(ms)
     * @returns {Function}
     */
    debounce(fn, delay = 300) {
        let timer = null;
        return function(...args) {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    },

    /**
     * 节流函数
     * @param {Function} fn - 要执行的函数
     * @param {number} interval - 间隔时间(ms)
     * @returns {Function}
     */
    throttle(fn, interval = 300) {
        let lastTime = 0;
        return function(...args) {
            const now = Date.now();
            if (now - lastTime >= interval) {
                lastTime = now;
                fn.apply(this, args);
            }
        };
    },

    /**
     * XSS 过滤
     * @param {string} str - 输入字符串
     * @returns {string} 过滤后的字符串
     */
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * SHA-256 哈希
     * @param {string} str - 输入字符串
     * @returns {Promise<string>} 哈希值
     */
    async sha256(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    /**
     * 加密存储（简单 XOR 加密）
     * @param {string} str - 要加密的字符串
     * @param {string} key - 密钥
     * @returns {string} 加密后的字符串
     */
    encrypt(str, key = 'smart-outfit-key') {
        let result = '';
        for (let i = 0; i < str.length; i++) {
            result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return btoa(result);
    },

    /**
     * 解密
     * @param {string} str - 要解密的字符串
     * @param {string} key - 密钥
     * @returns {string} 解密后的字符串
     */
    decrypt(str, key = 'smart-outfit-key') {
        try {
            const decoded = atob(str);
            let result = '';
            for (let i = 0; i < decoded.length; i++) {
                result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            return result;
        } catch (e) {
            return '';
        }
    },

    /**
     * 格式化日期
     * @param {Date} date - 日期对象
     * @returns {string} 格式化字符串
     */
    formatDate(date = new Date()) {
        return date.toISOString().split('T')[0];
    },

    /**
     * 验证手机号
     * @param {string} phone - 手机号
     * @returns {boolean}
     */
    isValidPhone(phone) {
        return /^1[3-9]\d{9}$/.test(phone);
    },

    /**
     * 深拷贝
     * @param {any} obj - 要拷贝的对象
     * @returns {any}
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
};

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translate(-50%, -100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
    @keyframes slideUp {
        from { transform: translate(-50%, 0); opacity: 1; }
        to { transform: translate(-50%, -100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
