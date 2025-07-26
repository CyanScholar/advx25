/**
 * canvas.js - 画布相关功能
 * 处理画布初始化和绘图功能
 */

// 全局变量
let canvas, ctx;
let isDrawing = false;
let lastX = 0, lastY = 0;
let currentTool = 'pen';
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
}

/**
 * 调整画布大小
 */
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // 重新设置绘图样式，因为画布调整会重置上下文
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = lineColor;
}

/**
 * 初始化画布移动功能
 */
function initCanvasMove() {
    const moveCanvasBtn = document.getElementById('move-canvas');
    if (moveCanvasBtn) {
        moveCanvasBtn.addEventListener('click', toggleCanvasMove);
    }
}

/**
 * 切换画布移动模式
 */
function toggleCanvasMove() {
    isMovingCanvas = !isMovingCanvas;
    const moveCanvasBtn = document.getElementById('move-canvas');
    
    if (isMovingCanvas) {
        moveCanvasBtn.classList.add('active');
        canvas.style.cursor = 'grab';
        updateStatus('画布移动模式已启用', 'success');
    } else {
        moveCanvasBtn.classList.remove('active');
        canvas.style.cursor = 'default';
        updateStatus('画布移动模式已关闭', 'success');
    }
}

/**
 * 处理画布移动
 * @param {Event} e - 鼠标事件
 */
function handleCanvasMove(e) {
    if (!isMovingCanvas) return;
    
    e.preventDefault();
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    if (e.type === 'mousedown') {
        canvas.style.cursor = 'grabbing';
        lastMouseX = mouseX;
        lastMouseY = mouseY;
    } else if (e.type === 'mousemove' && e.buttons === 1) {
        const deltaX = mouseX - lastMouseX;
        const deltaY = mouseY - lastMouseY;
        
        canvasOffsetX += deltaX;
        canvasOffsetY += deltaY;
        
        // 更新画布变换
        ctx.save();
        ctx.translate(canvasOffsetX, canvasOffsetY);
        
        // 重新绘制所有元素
        redrawCanvas();
        
        lastMouseX = mouseX;
        lastMouseY = mouseY;
    } else if (e.type === 'mouseup') {
        canvas.style.cursor = 'grab';
    }
}

/**
 * 重新绘制画布
 */
function redrawCanvas() {
    // 清除画布
    ctx.clearRect(-canvasOffsetX, -canvasOffsetY, canvas.width, canvas.height);
    
    // 重新绘制所有连线
    connections.forEach(connection => {
        renderConnection(connection);
    });
    
    // 重新绘制所有气泡
    bubbles.forEach(bubble => {
        renderBubble(bubble);
    });
}

/**
 * 获取画布上的实际坐标
 * @param {number} clientX - 客户端X坐标
 * @param {number} clientY - 客户端Y坐标
 * @returns {Object} 实际坐标
 */
function getCanvasCoordinates(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: clientX - rect.left - canvasOffsetX,
        y: clientY - rect.top - canvasOffsetY
    };
}

/**
 * 开始绘图
 * @param {Event} e - 鼠标或触摸事件
 */
function startDrawing(e) {
    isDrawing = true;
    const coords = getCoords(e, canvas);
    lastX = coords.x;
    lastY = coords.y;
    
    // 记录路径起点
    currentPath = [{ x: lastX, y: lastY }];
    
    // 开始新路径
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
}

/**
 * 绘制线条
 * @param {Event} e - 鼠标或触摸事件
 */
function draw(e) {
    if (!isDrawing) return;
    
    const coords = getCoords(e, canvas);
    const currentX = coords.x;
    const currentY = coords.y;
    
    // 根据当前工具绘制
    if (currentTool === 'pen') {
        drawLine(currentX, currentY);
    } else if (currentTool === 'eraser') {
        erase(currentX, currentY);
    }
    
    // 记录路径点
    currentPath.push({ x: currentX, y: currentY });
    
    // 更新最后位置
    lastX = currentX;
    lastY = currentY;
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
    ctx.lineWidth = ERASER_WIDTH;
    ctx.strokeStyle = 'white';
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
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
 * 清空画布
 */
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}