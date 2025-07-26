/**
 * circleDetection.js - 圆圈检测功能
 * 处理手绘圆圈的检测和相关功能
 */

/**
 * 检测路径是否为圆圈
 * @param {Array} path - 路径点数组
 * @returns {boolean} 是否为圆圈
 */
function isCirclePath(path) {
    // 如果点数太少，不可能是圆
    if (path.length < MIN_CIRCLE_POINTS) {
        return false;
    }
    
    // 计算路径的边界框
    const bounds = getCircleBounds(path);
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    
    // 检查长宽比，圆的长宽比应接近1
    const aspectRatio = Math.max(width, height) / Math.min(width, height);
    if (aspectRatio > 1.5) {
        return false;
    }
    
    // 计算中心点
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    
    // 计算半径
    const radius = Math.max(width, height) / 2;
    
    // 检查点到中心的距离是否接近半径
    let validPointCount = 0;
    for (const point of path) {
        const distToCenter = distance(point.x, point.y, centerX, centerY);
        const radiusRatio = distToCenter / radius;
        
        // 如果点到中心的距离在半径的合理范围内，则认为是圆上的点
        if (radiusRatio > 0.7 && radiusRatio < 1.3) {
            validPointCount++;
        }
    }
    
    // 计算有效点占总点数的比例
    const validRatio = validPointCount / path.length;
    
    // 如果有效点比例超过阈值，则认为是圆
    return validRatio > (1 - CIRCLE_DETECTION_THRESHOLD);
}

/**
 * 获取路径的边界框
 * @param {Array} path - 路径点数组
 * @returns {Object} 边界框对象
 */
function getCircleBounds(path) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    for (const point of path) {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
    }
    
    return { minX, minY, maxX, maxY };
}

/**
 * 捕获圆圈区域
 * @param {Object} bounds - 圆圈边界
 * @returns {Promise<Blob>} 图像Blob对象
 */
function captureCircleArea(bounds) {
    return new Promise((resolve) => {
        // 创建临时画布
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        // 设置临时画布大小为圆圈区域大小
        const width = bounds.maxX - bounds.minX;
        const height = bounds.maxY - bounds.minY;
        tempCanvas.width = width;
        tempCanvas.height = height;
        
        // 将主画布的圆圈区域复制到临时画布
        tempCtx.drawImage(
            canvas,
            bounds.minX, bounds.minY, width, height,
            0, 0, width, height
        );
        
        // 将临时画布转换为Blob
        tempCanvas.toBlob(blob => {
            resolve(blob);
        }, 'image/png');
    });
}

/**
 * 显示圆圈检测提示
 */
function showCircleHint() {
    const circleHint = document.getElementById('circle-hint');
    circleHint.style.opacity = '1';
    circleHint.classList.add('circle-hint-animation');
    
    // 动画结束后隐藏提示
    setTimeout(() => {
        hideCircleHint();
    }, 1500);
}

/**
 * 隐藏圆圈检测提示
 */
function hideCircleHint() {
    const circleHint = document.getElementById('circle-hint');
    circleHint.style.opacity = '0';
    circleHint.classList.remove('circle-hint-animation');
}

/**
 * 根据模式清除圆圈区域
 * @param {Object} bounds - 圆圈边界
 * @param {string} mode - 清除模式
 * @param {Array} path - 圆圈路径
 */
function clearCircleAreaByMode(bounds, mode, path) {
    if (mode === 'content') {
        // 清除圈内内容，保留圈边框
        clearTextInBounds(bounds);
    } else if (mode === 'border') {
        // 清除圈边框，保留圈内内容
        clearCircleBorder(bounds, path);
    }
}

/**
 * 清除圆圈边框
 * @param {Object} bounds - 圆圈边界
 * @param {Array} path - 圆圈路径
 */
function clearCircleBorder(bounds, path) {
    // 计算中心点和半径
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const radius = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) / 2;
    
    // 设置橡皮擦宽度（增加宽度以确保完全擦除）
    const eraserWidth = (lineWidth || DEFAULT_LINE_WIDTH) * 5; // 增加擦除宽度
    console.log('设置擦除线宽:', eraserWidth);
    ctx.lineWidth = eraserWidth;
    ctx.strokeStyle = 'white';
    
    // 如果有路径，沿着路径擦除
    if (path && path.length > 0) {
        console.log('使用路径擦除圆圈边框，路径点数:', path.length);
        ctx.beginPath();
        for (let i = 0; i < path.length; i++) {
            const point = path[i];
            if (i === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }
        ctx.stroke();
        console.log('圆圈边框擦除完成');
    } else {
        // 如果没有路径，使用圆形擦除
        console.log('没有路径，使用圆形擦除');
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        console.log('圆形擦除完成');
    }
    
    // 恢复绘图设置
    ctx.lineWidth = lineWidth || DEFAULT_LINE_WIDTH;
    ctx.strokeStyle = lineColor || DEFAULT_LINE_COLOR;
}

/**
 * 清除边界内的内容（包括文字和绘图）
 * @param {Object} bounds - 边界对象
 */
function clearTextInBounds(bounds) {
    console.log('清除圆圈内容');
    // 获取边界内的图像数据
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const imageData = ctx.getImageData(bounds.minX, bounds.minY, width, height);
    const data = imageData.data;
    
    // 计算中心点和半径
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 * 0.95; // 增大半径，确保清除所有内容
    
    // 遍历像素，清除圆内的非边框像素
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // 计算到中心的距离
            const distToCenter = distance(x, y, centerX, centerY);
            
            // 如果在圆内，则清除像素
            if (distToCenter < radius) {
                const index = (y * width + x) * 4;
                data[index] = 255;     // R
                data[index + 1] = 255; // G
                data[index + 2] = 255; // B
                data[index + 3] = 255; // A
            }
        }
    }
    
    // 将修改后的图像数据放回画布
    ctx.putImageData(imageData, bounds.minX, bounds.minY);
}