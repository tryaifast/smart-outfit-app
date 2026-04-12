/**
 * 智能穿搭助手 - 入口文件 (v12)
 * 加载模块化 JS 文件
 */

// 按顺序加载模块
const modules = [
    'js/config.js?v=12',
    'js/utils.js?v=12',
    'js/storage.js?v=12',
    'js/api.js?v=12',
    'js/user.js?v=12',
    'js/weather.js?v=12',
    'js/wardrobe.js?v=12',
    'js/ui.js?v=12',
    'js/app.js?v=12'
];

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// 顺序加载所有模块
(async function() {
    try {
        for (const module of modules) {
            await loadScript(module);
        }
        console.log('所有模块加载完成');
    } catch (error) {
        console.error('模块加载失败:', error);
        alert('应用加载失败，请刷新页面重试');
    }
})();
