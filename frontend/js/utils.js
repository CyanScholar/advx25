/**
 * utils.js - 工具函数
 * 包含各种通用工具函数
 */

/**
 * 获取鼠标或触摸事件的坐标
 * @param {Event} event - 鼠标或触摸事件
 * @param {HTMLElement} element - 相对元素
 * @returns {Object} 包含x和y坐标的对象
 */
function getCoords(event, element) {
    const rect = element.getBoundingClientRect();
    let clientX, clientY;

    // 处理触摸事件
    if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }

    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

/**
 * 计算两点之间的距离
 * @param {number} x1 - 第一个点的x坐标
 * @param {number} y1 - 第一个点的y坐标
 * @param {number} x2 - 第二个点的x坐标
 * @param {number} y2 - 第二个点的y坐标
 * @returns {number} 两点之间的距离
 */
function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * 生成随机ID
 * @returns {string} 随机ID
 */
function generateId() {
    return 'id-' + Math.random().toString(36).substr(2, 9);
}

/**
 * 生成随机颜色
 * @returns {string} 随机颜色类名
 */
function getRandomColor() {
    return BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
}

/**
 * 生成随机大小
 * @returns {number} 随机大小
 */
function getRandomSize() {
    return Math.floor(Math.random() * (MAX_BUBBLE_SIZE - MIN_BUBBLE_SIZE + 1)) + MIN_BUBBLE_SIZE;
}

/**
 * 防抖函数
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖处理后的函数
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

/**
 * 节流函数
 * @param {Function} func - 要执行的函数
 * @param {number} limit - 限制时间（毫秒）
 * @returns {Function} 节流处理后的函数
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}