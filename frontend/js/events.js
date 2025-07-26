/**
 * events.js - 事件处理
 * 设置各种事件监听器
 */

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
    
    // 画布事件（只在非拖拽模式下启用）
    canvas.addEventListener('mousedown', (e) => {
        if (currentTool !== 'drag') {
            startDrawing(e);
        }
    });
    canvas.addEventListener('mousemove', (e) => {
        if (currentTool !== 'drag') {
            draw(e);
        }
    });
    canvas.addEventListener('mouseup', (e) => {
        if (currentTool !== 'drag') {
            stopDrawing(e);
        }
    });
    canvas.addEventListener('mouseout', (e) => {
        if (currentTool !== 'drag') {
            stopDrawing(e);
        }
    });
    
    // 画布移动事件（只在拖拽模式下启用）
    canvas.addEventListener('mousedown', (e) => {
        if (currentTool === 'drag') {
            handleCanvasMove(e);
        }
    });
    canvas.addEventListener('mousemove', (e) => {
        if (currentTool === 'drag') {
            handleCanvasMove(e);
        }
    });
    canvas.addEventListener('mouseup', (e) => {
        if (currentTool === 'drag') {
            handleCanvasMove(e);
        }
    });
    
    // 触摸事件（只在非拖拽模式下启用）
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (currentTool !== 'drag') {
            startDrawing(e);
        }
    });
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (currentTool !== 'drag') {
            draw(e);
        }
    });
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (currentTool !== 'drag') {
            stopDrawing(e);
        }
    });
    
    // 画布移动触摸事件（只在拖拽模式下启用）
    canvas.addEventListener('touchstart', (e) => {
        if (currentTool === 'drag') {
            handleCanvasMove(e);
        }
    });
    canvas.addEventListener('touchmove', (e) => {
        if (currentTool === 'drag') {
            handleCanvasMove(e);
        }
    });
    canvas.addEventListener('touchend', (e) => {
        if (currentTool === 'drag') {
            handleCanvasMove(e);
        }
    });
    
    // 工具切换
    const penToolButton = document.getElementById('pen-tool');
    const eraserToolButton = document.getElementById('eraser-tool');
    const dragCanvasButton = document.getElementById('drag-canvas');
    const pinModeButton = document.getElementById('pin-mode');
    
    penToolButton.addEventListener('click', () => setTool('pen'));
    eraserToolButton.addEventListener('click', () => setTool('eraser'));
    dragCanvasButton.addEventListener('click', () => setTool('drag'));
    pinModeButton.addEventListener('click', () => setTool('pin'));
    
    // 画笔大小调整
    const sizeSlider = document.getElementById('size-slider');
    sizeSlider.addEventListener('input', () => {
        setLineWidth(parseInt(sizeSlider.value));
    });
    
    // 戳破模式按钮
    // const pinModeButton = document.getElementById('pin-mode'); // This line is removed as per the new_code
    // pinModeButton.addEventListener('click', togglePinMode); // This line is removed as per the new_code
    
    // 初始化画布移动功能（只初始化事件处理，不添加重复的点击监听器）
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
        // D键 - 画布拖拽模式
        else if (e.key === 'd' || e.key === 'D') {
            setTool('drag');
        }
        // T键 - 戳破模式
        else if (e.key === 't' || e.key === 'T') {
            setTool('pin');
        }
        // R键 - 重置画布位置
        else if (e.key === 'r' || e.key === 'R') {
            resetCanvasPosition();
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
    
    // 设备方向变化（针对平板）
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            resizeCanvas();
        }, 100); // 延迟一点确保方向变化完成
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