/**
 * events.js - 事件处理
 * 设置各种事件监听器
 */

// 戳破模式标志
let isPinMode = false;

/**
 * 设置事件监听器
 */
function setupEventListeners() {
    // 注释掉重复的上下文菜单隐藏逻辑，由bubbles.js统一处理
    // document.addEventListener('click', (e) => {
    //     const contextMenu = document.getElementById('bubble-context-menu');
    //     if (contextMenu.classList.contains('visible') && !contextMenu.contains(e.target)) {
    //         hideContextMenu();
    //     }
    // });
    
    // 画布事件
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // 画布移动事件
    canvas.addEventListener('mousedown', handleCanvasMove);
    canvas.addEventListener('mousemove', handleCanvasMove);
    canvas.addEventListener('mouseup', handleCanvasMove);
    
    // 触摸事件
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startDrawing(e);
    });
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        draw(e);
    });
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        stopDrawing();
    });
    
    // 工具切换
    const penToolButton = document.getElementById('pen-tool');
    const eraserToolButton = document.getElementById('eraser-tool');
    
    penToolButton.addEventListener('click', () => setTool('pen'));
    eraserToolButton.addEventListener('click', () => setTool('eraser'));
    
    // 画笔大小调整
    const sizeSlider = document.getElementById('size-slider');
    sizeSlider.addEventListener('input', () => {
        setLineWidth(parseInt(sizeSlider.value));
    });
    
    // 戳破模式按钮
    const pinModeButton = document.getElementById('pin-mode');
    pinModeButton.addEventListener('click', togglePinMode);
    
    // 初始化画布移动功能
    initCanvasMove();
    
    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
        // P键 - 画笔工具
        if (e.key === 'p' || e.key === 'P') {
            setTool('pen');
        }
        // E键 - 橡皮擦工具
        else if (e.key === 'e' || e.key === 'E') {
            setTool('eraser');
        }
        // C键 - 清空画布
        else if (e.key === 'c' || e.key === 'C') {
            clearCanvas();
            updateStatus('画布已清空', 'success');
        }

    });
    
    // 窗口大小变化
    window.addEventListener('resize', () => {
        resizeCanvas();
    });
    
    // 侧边栏事件
    const showSidebarBtn = document.getElementById('show-sidebar-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    
    showSidebarBtn.addEventListener('click', showSidebar);
    closeSidebarBtn.addEventListener('click', hideSidebar);
    
    // 侧边栏现在只能通过关闭按钮收起，不再支持点击外部关闭
    
    // AI助手事件
    const aiIcon = document.getElementById('ai-icon');
    const aiGuidance = document.getElementById('ai-guidance');
    const aiChat = document.getElementById('ai-chat');
    const aiInput = document.getElementById('ai-input');
    const aiSendBtn = document.getElementById('ai-send-btn');
    
    // AI图标点击事件 - 切换聊天界面
    aiIcon.addEventListener('click', toggleAIChat);
    
    // 发送消息事件
    aiSendBtn.addEventListener('click', sendMessage);
    aiInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}