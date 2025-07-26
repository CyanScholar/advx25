/**
 * canvas.js - 画布相关功能
 * 处理画布初始化和绘图功能
 */

// 全局变量
let canvas, ctx;
let isDrawing = false;
let lastX = 0, lastY = 0;
let lineWidth = DEFAULT_LINE_WIDTH;
let lineColor = DEFAULT_LINE_COLOR;
let currentPath = [];

// 画布移动相关变量
let isMovingCanvas = false;
let canvasOffsetX = 0;
let canvasOffsetY = 0;
let lastMouseX = 0;
let lastMouseY = 0;

/**
 * 初始化画布
 */
function initCanvas() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    
    // 设置画布大小为窗口大小
    resizeCanvas();
    
    // 设置默认绘图样式
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = lineColor;
    ctx.globalCompositeOperation = 'source-over'; // 设置默认绘制模式
    
    console.log('画布初始化完成');
    console.log('画笔颜色:', lineColor);
    
    // 测试坐标计算
    testCoordinates();
}

/**
 * 调整画布大小
 */
function resizeCanvas() {
    // 获取设备像素比
    const dpr = window.devicePixelRatio || 1;
    
    // 获取画布的CSS尺寸
    const rect = canvas.getBoundingClientRect();
    const cssWidth = rect.width;
    const cssHeight = rect.height;
    
    // 设置画布的实际尺寸（物理像素）
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    
    // 设置画布的CSS尺寸（逻辑像素）
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';
    
    // 缩放绘图上下文以匹配设备像素比
    ctx.scale(dpr, dpr);
    
    // 重新设置绘图样式，因为画布调整会重置上下文
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = lineColor;
    
    console.log('画布尺寸调整:', {
        dpr: dpr,
        cssWidth: cssWidth,
        cssHeight: cssHeight,
        actualWidth: canvas.width,
        actualHeight: canvas.height
    });
}

/**
 * 初始化画布移动功能
 */
function initCanvasMove() {
    // 只初始化拖拽事件处理，点击事件已在events.js中处理
    // 这里不需要添加额外的点击事件监听器
}

/**
 * 处理画布移动
 * @param {Event} e - 鼠标或触摸事件
 */
function handleCanvasMove(e) {
    if (currentTool !== 'drag') return;
    
    e.preventDefault();
    
    // 获取坐标（支持鼠标和触摸）
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    
    if (e.type === 'mousedown' || e.type === 'touchstart') {
        canvas.style.cursor = 'grabbing';
        lastMouseX = mouseX;
        lastMouseY = mouseY;
    } else if ((e.type === 'mousemove' && e.buttons === 1) || e.type === 'touchmove') {
        const deltaX = mouseX - lastMouseX;
        const deltaY = mouseY - lastMouseY;
        
        // 添加最小移动阈值，减少抖动
        if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) {
            // 限制拖拽范围，防止画布拖拽过远
            const maxOffset = Math.max(canvas.width, canvas.height) * 2;
            canvasOffsetX = Math.max(-maxOffset, Math.min(maxOffset, canvasOffsetX + deltaX));
            canvasOffsetY = Math.max(-maxOffset, Math.min(maxOffset, canvasOffsetY + deltaY));
            
            // 移动canvas元素
            canvas.style.transform = `translate(${canvasOffsetX}px, ${canvasOffsetY}px)`;
            
            // 移动bubble-container，确保气泡和连线跟随移动
            const bubbleContainer = document.getElementById('bubble-container');
            if (bubbleContainer) {
                bubbleContainer.style.transform = `translate(${canvasOffsetX}px, ${canvasOffsetY}px)`;
            }
            
            // 只在移动时输出一次调试信息
            if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
                console.log(`画布移动: offset=(${canvasOffsetX}, ${canvasOffsetY}), delta=(${deltaX}, ${deltaY})`);
                console.log('Canvas和Bubble-container已移动');
            }
        }
        
        lastMouseX = mouseX;
        lastMouseY = mouseY;
    } else if (e.type === 'mouseup' || e.type === 'touchend') {
        canvas.style.cursor = 'grab';
    }
}

/**
 * 重新绘制画布
 */
function redrawCanvas() {
    // 清除画布内容（只清除canvas绘制的内容，不影响DOM元素）
    ctx.clearRect(-canvasOffsetX, -canvasOffsetY, canvas.width, canvas.height);
    
    // 现在canvas已经移动，所有元素都会跟着移动，不需要单独更新
}

/**
 * 更新连线位置
 * @param {Object} connection - 连线对象
 */
function updateConnectionPosition(connection) {
    // 现在canvas已经移动，连线不需要单独移动
    // 保持原有位置即可
}

/**
 * 更新气泡位置
 * @param {Object} bubble - 气泡对象
 */
function updateBubblePosition(bubble) {
    // 现在canvas已经移动，气泡不需要单独移动
    // 保持原有位置即可
}

/**
 * 重置画布位置到中心
 */
function resetCanvasPosition() {
    canvasOffsetX = 0;
    canvasOffsetY = 0;
    
    // 重置canvas位置
    canvas.style.transform = 'translate(0px, 0px)';
    
    // 重置bubble-container位置
    const bubbleContainer = document.getElementById('bubble-container');
    if (bubbleContainer) {
        bubbleContainer.style.transform = 'translate(0px, 0px)';
    }
    
    // 清除画布内容
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    updateStatus('画布位置已重置', 'success');
}

/**
 * 获取画布上的实际坐标
 * @param {number} clientX - 客户端X坐标
 * @param {number} clientY - 客户端Y坐标
 * @returns {Object} 实际坐标
 */
function getCanvasCoordinates(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    // 坐标已经是相对于CSS尺寸的，不需要考虑设备像素比
    return {
        x: clientX - rect.left - canvasOffsetX,
        y: clientY - rect.top - canvasOffsetY
    };
}

/**
 * 调试坐标信息
 * @param {Event} e - 事件对象
 * @param {string} eventType - 事件类型
 */
function debugCoordinates(e, eventType) {
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    const coords = getCanvasCoordinates(clientX, clientY);
    
    console.log(`${eventType} 坐标调试:`, {
        clientX: clientX,
        clientY: clientY,
        rectLeft: rect.left,
        rectTop: rect.top,
        canvasOffsetX: canvasOffsetX,
        canvasOffsetY: canvasOffsetY,
        finalX: coords.x,
        finalY: coords.y,
        dpr: window.devicePixelRatio || 1
    });
}

/**
 * 开始绘制
 * @param {Event} e - 鼠标或触摸事件
 */
function startDrawing(e) {
    // 如果在拖拽模式下，不进行绘制
    if (currentTool === 'drag') return;
    
    // 调试坐标信息
    debugCoordinates(e, 'startDrawing');
    
    isDrawing = true;
    
    // 获取坐标（支持鼠标和触摸）
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    const coords = getCanvasCoordinates(clientX, clientY);
    lastX = coords.x;
    lastY = coords.y;
    
    // 开始新路径
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    
    // 重置当前路径
    currentPath = [{x: lastX, y: lastY}];
}

/**
 * 绘制
 * @param {Event} e - 鼠标或触摸事件
 */
function draw(e) {
    // 如果在拖拽模式下，不进行绘制
    if (currentTool === 'drag') return;
    
    if (!isDrawing) return;
    
    e.preventDefault();
    
    // 获取坐标（支持鼠标和触摸）
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    const coords = getCanvasCoordinates(clientX, clientY);
    const x = coords.x;
    const y = coords.y;
    
    // 添加到当前路径
    currentPath.push({x, y});

    if (currentTool === 'pen') {
        drawLine(x, y);
        // 实时检查连线
        checkConnectionInProgress();
    } else if (currentTool === 'eraser') {
        erase(x, y);
    }
    
    lastX = x;
    lastY = y;
}

/**
 * 绘制线条
 * @param {number} x - x坐标
 * @param {number} y - y坐标
 */
function drawLine(x, y) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = lineColor;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

/**
 * 橡皮擦功能
 * @param {number} x - x坐标
 * @param {number} y - y坐标
 */
function erase(x, y) {
    // 保存当前绘制模式
    const originalCompositeOperation = ctx.globalCompositeOperation;
    
    // 设置为擦除模式
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = ERASER_WIDTH;
    ctx.strokeStyle = 'rgba(0,0,0,1)'; // 任何颜色都可以，会被擦除
    
    // 绘制擦除路径
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // 恢复原始绘制模式
    ctx.globalCompositeOperation = originalCompositeOperation;
}

/**
 * 停止绘图
 */
function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    
    console.log('停止绘图，当前路径点数:', currentPath.length, '当前工具:', currentTool);
    
    // 处理完成的路径
    if (currentPath.length > 0 && currentTool === 'pen') {
        // 检查是否为圆圈
        if (isCirclePath(currentPath)) {
            console.log('检测到圆圈');
            // 显示圆圈检测提示
            showCircleHint();
            
            // 获取圆圈边界
            const bounds = getCircleBounds(currentPath);
            
            // 捕获圆圈区域并发送到OCR
            const pathCopy = [...currentPath]; // 创建路径的副本
            console.log('发送到OCR，路径点数:', pathCopy.length);
            captureCircleArea(bounds).then(imageBlob => {
                sendToOCR(imageBlob, bounds, pathCopy);
            });
            
            // 不立即重置路径，让OCR处理完成后再清除
            return;
        } else {
            console.log('不是圆圈');
        }
        
        // 检查是否为连线（独立于圆圈检测）
        console.log('开始检查连线...');
        if (isConnectionLine(currentPath)) {
            console.log('检测到连线，清除手写连线');
            // 清除手写连线
            clearConnectionLine(currentPath);
        }
        
        // 重置路径（只有在不是圆圈的情况下才重置）
        currentPath = [];
    }
}

/**
 * 实时检查连线（在绘制过程中调用）
 */
function checkConnectionInProgress() {
    if (currentPath.length > 10 && currentTool === 'pen') {
        // 每10个点检查一次连线
        if (currentPath.length % 10 === 0) {
            console.log('实时检查连线，当前点数:', currentPath.length);
            if (isConnectionLine(currentPath)) {
                console.log('实时检测到连线！');
                // 立即清除手写连线
                clearConnectionLine(currentPath);
                // 重置路径
                currentPath = [];
                return true;
            }
        }
    }
    return false;
}

/**
 * 清空画布
 */
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * 测试坐标计算
 */
function testCoordinates() {
    console.log('=== 坐标测试 ===');
    console.log('设备像素比:', window.devicePixelRatio || 1);
    console.log('画布CSS尺寸:', canvas.style.width, 'x', canvas.style.height);
    console.log('画布实际尺寸:', canvas.width, 'x', canvas.height);
    console.log('画布边界:', canvas.getBoundingClientRect());
    console.log('窗口尺寸:', window.innerWidth, 'x', window.innerHeight);
    console.log('视口尺寸:', window.visualViewport?.width, 'x', window.visualViewport?.height);
}

/**
 * 测试坐标修复
 */
function testCoordinateFix() {
    console.log('=== 坐标修复测试 ===');
    console.log('设备像素比:', window.devicePixelRatio || 1);
    console.log('画布偏移:', { x: canvasOffsetX, y: canvasOffsetY });
    console.log('画布尺寸:', { width: canvas.width, height: canvas.height });
    console.log('画布CSS尺寸:', { width: canvas.style.width, height: canvas.style.height });
    console.log('画布边界:', canvas.getBoundingClientRect());
    
    // 测试坐标转换
    const testBounds = { minX: 100, minY: 100, maxX: 200, maxY: 200 };
    const dpr = window.devicePixelRatio || 1;
    const actualMinX = (testBounds.minX + canvasOffsetX) * dpr;
    const actualMinY = (testBounds.minY + canvasOffsetY) * dpr;
    
    console.log('测试边界:', testBounds);
    console.log('实际像素坐标:', { x: actualMinX, y: actualMinY });
}