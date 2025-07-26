/**
 * app.js - 应用入口
 * 初始化应用并启动
 */

/**
 * 初始化应用
 */
function init() {
    console.log('BubbleMind 初始化中...');
    console.log('功能说明：');
    console.log('1. 画圈自动识别文字并创建气泡');
    console.log('2. 在气泡之间画线创建连接');
    console.log('3. 双击气泡可以爆炸删除');
    console.log('4. 使用侧边栏管理solution');
    console.log('5. agent给出精简的建议和引导');
    console.log('6. agent多轮对话，给出初步的解决方案');
    
    // 初始化画布
    initCanvas();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 检查后端连接
    checkBackendConnection();
    
    // 更新状态
    updateStatus('准备就绪！', 'success');
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', init);

// 全局错误处理
window.addEventListener('error', (e) => {
    console.error('应用错误:', e.error);
});