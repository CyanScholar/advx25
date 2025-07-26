/**
 * bubbles.js - 气泡相关功能
 * 处理气泡的创建、渲染、拖拽和删除
 */

// 气泡相关全局变量
let bubbles = [];
let selectedBubble = null;
let isDragging = false;
let dragOffsetX = 0, dragOffsetY = 0;

// 长按相关变量
let longPressTimer = null;
let isLongPress = false;
let dragStartX = 0, dragStartY = 0; // 添加拖拽开始位置记录

// 触控笔检测和阈值配置
const FINGER_LONG_PRESS_DELAY = 300; // 手指长按时间（毫秒）
const STYLUS_LONG_PRESS_DELAY = 150; // 触控笔长按时间（毫秒）
const FINGER_MOVE_THRESHOLD = 5; // 手指移动阈值（像素）
const STYLUS_MOVE_THRESHOLD = 15; // 触控笔移动阈值（像素）

/**
 * 检测是否为触控笔
 * @param {Event} e - 事件对象
 * @returns {boolean} 是否为触控笔
 */
function isStylus(e) {
    // 检查pointerType
    if (e.pointerType === 'pen') {
        return true;
    }
    
    // 检查pressure值（触控笔通常有更高的pressure）
    if (e.pressure !== undefined && e.pressure > 0.5) {
        return true;
    }
    
    // 检查是否有触控笔特有的属性
    if (e.pressure !== undefined && e.tiltX !== undefined && e.tiltY !== undefined) {
        return true;
    }
    
    return false;
}

/**
 * 获取长按延迟时间
 * @param {Event} e - 事件对象
 * @returns {number} 长按延迟时间（毫秒）
 */
function getLongPressDelay(e) {
    return isStylus(e) ? STYLUS_LONG_PRESS_DELAY : FINGER_LONG_PRESS_DELAY;
}

/**
 * 获取移动阈值
 * @param {Event} e - 事件对象
 * @returns {number} 移动阈值（像素）
 */
function getMoveThreshold(e) {
    return isStylus(e) ? STYLUS_MOVE_THRESHOLD : FINGER_MOVE_THRESHOLD;
}

/**
 * 计算两点间距离
 * @param {number} x1 - 第一个点的x坐标
 * @param {number} y1 - 第一个点的y坐标
 * @param {number} x2 - 第二个点的x坐标
 * @param {number} y2 - 第二个点的y坐标
 * @returns {number} 两点间距离
 */
function getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * 创建新气泡
 * @param {number} x - 气泡x坐标
 * @param {number} y - 气泡y坐标
 * @param {string} text - 气泡文本
 * @param {number} size - 气泡大小
 * @param {string} color - 气泡颜色类名
 * @param {number} backendId - 后端id（可选）
 * @param {string} type - 气泡类型（'thought' 或 'solution'，可选）
 * @param {string} topicName - 主题名（可选）
 * @returns {Object} 气泡对象
 */
function createBubble(x, y, text, size = null, color = 'bubble-blue', backendId = null, type = 'thought', topicName = '') {
    if (!size) {
        size = getRandomSize();
    }
    // 创建气泡对象，增加后端id、类型、主题
    const bubble = {
        id: generateId(), // 前端唯一id
        backendId: backendId, // 后端id
        x: x,
        y: y,
        text: text,
        size: size,
        color: color,
        type: type,
        topicName: topicName
    };
    bubbles.push(bubble);
    renderBubble(bubble);
    updateStatus('气泡已创建！', 'success');
    if (bubbles.length === 1) {
        setTimeout(() => provideSmartGuidance('first_bubble'), 1000);
    } else if (bubbles.length === 3) {
        setTimeout(() => provideSmartGuidance('multiple_bubbles'), 1000);
    }
    return bubble;
}

/**
 * 渲染气泡到DOM
 * @param {Object} bubble - 气泡对象
 */
function renderBubble(bubble) {
    const bubbleContainer = document.getElementById('bubble-container');
    
    // 创建气泡元素
    const bubbleElement = document.createElement('div');
    bubbleElement.id = bubble.id;
    bubbleElement.className = `bubble ${bubble.color} pop-animation`;
    bubbleElement.style.width = `${bubble.size}px`;
    bubbleElement.style.height = `${bubble.size}px`;
    bubbleElement.style.left = `${bubble.x - bubble.size / 2}px`;
    bubbleElement.style.top = `${bubble.y - bubble.size / 2}px`;
    
    // 创建文本元素
    const textElement = document.createElement('div');
    textElement.className = 'bubble-text';
    textElement.textContent = bubble.text;
    bubbleElement.appendChild(textElement);
    
    // 添加到容器
    bubbleContainer.appendChild(bubbleElement);
    
    // 添加事件监听器
    bubbleElement.addEventListener('mousedown', (e) => handleBubbleMouseDown(e, bubble));
    bubbleElement.addEventListener('touchstart', (e) => handleBubbleMouseDown(e, bubble));
    bubbleElement.addEventListener('pointerdown', (e) => handleBubbleMouseDown(e, bubble)); // 添加触控笔事件支持
    bubbleElement.addEventListener('touchend', (e) => {
        // 触摸结束时清除长按定时器
        clearTimeout(longPressTimer);
        if (!isLongPress) {
            // 如果不是长按，则隐藏上下文菜单
            hideContextMenu();
        }
    });
    bubbleElement.addEventListener('pointerup', (e) => {
        // 指针抬起时清除长按定时器
        clearTimeout(longPressTimer);
        if (!isLongPress) {
            // 如果不是长按，则隐藏上下文菜单
            hideContextMenu();
        }
    });
    bubbleElement.addEventListener('touchmove', (e) => {
        // 触摸移动时清除长按定时器
        clearTimeout(longPressTimer);
    });
    bubbleElement.addEventListener('pointermove', (e) => {
        // 指针移动时清除长按定时器
        clearTimeout(longPressTimer);
    });
    
    // 双击事件用于气泡爆炸
    bubbleElement.addEventListener('dblclick', () => popBubble(bubble));
    
    // 添加右键菜单测试（可选）
    bubbleElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e, bubble);
    });
}

/**
 * 处理气泡鼠标按下事件
 * @param {Event} e - 事件对象
 * @param {Object} bubble - 气泡对象
 */
function handleBubbleMouseDown(e, bubble) {
    e.preventDefault();
    
    // 检查上下文菜单是否已显示
    const contextMenu = document.getElementById('bubble-context-menu');
    const isMenuVisible = contextMenu.classList.contains('visible');
    
    // 如果菜单已显示，先隐藏菜单
    if (isMenuVisible) {
        hideContextMenu();
        return;
    }
    
    // 选择气泡
    selectBubble(bubble);
    
    if (isPinMode) {
        // 戳破模式 - 点击气泡时爆炸
        popBubble(bubble);
        return;
    }
    
    // 重置长按状态
    isLongPress = false;
    clearTimeout(longPressTimer);
    
    // 记录拖拽开始位置
    if (e.touches && e.touches.length > 0) {
        dragStartX = e.touches[0].clientX;
        dragStartY = e.touches[0].clientY;
    } else if (e.pointerType === 'pen') {
        // 触控笔事件
        dragStartX = e.clientX;
        dragStartY = e.clientY;
    } else {
        dragStartX = e.clientX;
        dragStartY = e.clientY;
    }
    
    // 设置长按定时器
    const longPressDelay = getLongPressDelay(e);
    const deviceType = isStylus(e) ? '触控笔' : '手指';
    console.log(`气泡按下 - 设备类型: ${deviceType}, 长按延迟: ${longPressDelay}ms`);
    console.log(`事件详情:`, {
        type: e.type,
        pointerType: e.pointerType,
        pressure: e.pressure,
        isStylus: isStylus(e),
        clientX: e.clientX,
        clientY: e.clientY
    });
    
    longPressTimer = setTimeout(() => {
        isLongPress = true;
        console.log(`长按触发 - 设备类型: ${deviceType}`);
        showContextMenu(e, bubble);
    }, longPressDelay);
    
    // 准备拖拽
    prepareBubbleDrag(e, bubble);
}

/**
 * 准备气泡拖拽
 * @param {Event} e - 事件对象
 * @param {Object} bubble - 气泡对象
 */
function prepareBubbleDrag(e, bubble) {
    // 计算鼠标相对于气泡的偏移
    const bubbleElement = document.getElementById(bubble.id);
    const rect = bubbleElement.getBoundingClientRect();
    
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else if (e.pointerType === 'pen') {
        // 触控笔事件
        clientX = e.clientX;
        clientY = e.clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    // 记录拖拽开始位置（用于移动阈值检测）
    dragStartX = clientX;
    dragStartY = clientY;
    
    // 计算鼠标相对于气泡中心的偏移
    dragOffsetX = clientX - rect.left - rect.width / 2;
    dragOffsetY = clientY - rect.top - rect.height / 2;
    
    // 添加鼠标抬起事件监听器
    document.addEventListener('mouseup', handleMouseUp, { once: true });
    document.addEventListener('touchend', handleMouseUp, { once: true });
    document.addEventListener('pointerup', handleMouseUp, { once: true }); // 添加触控笔支持
    
    // 添加鼠标移动事件监听器（用于检测拖拽开始）
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleMouseMove);
    document.addEventListener('pointermove', handleMouseMove); // 添加触控笔支持
}

/**
 * 处理鼠标抬起事件
 */
function handleMouseUp() {
    clearTimeout(longPressTimer);
    
    // 移除移动事件监听器
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('touchmove', handleMouseMove);
    document.removeEventListener('pointermove', handleMouseMove); // 添加触控笔支持
    
    // 如果正在拖拽，停止拖拽
    if (isDragging) {
        stopBubbleDrag();
    }
}

/**
 * 处理鼠标移动事件（检测拖拽开始）
 */
function handleMouseMove(e) {
    if (isLongPress) {
        // 如果是长按状态，不启动拖拽
        return;
    }
    
    // 获取当前坐标
    let currentX, currentY;
    if (e.touches && e.touches.length > 0) {
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;
    } else if (e.pointerType === 'pen') {
        // 触控笔事件
        currentX = e.clientX;
        currentY = e.clientY;
    } else {
        currentX = e.clientX;
        currentY = e.clientY;
    }
    
    // 计算移动距离
    const moveDistance = getDistance(dragStartX, dragStartY, currentX, currentY);
    const moveThreshold = getMoveThreshold(e);
    
    // 如果移动距离超过阈值，开始拖拽
    if (moveDistance > moveThreshold) {
        // 清除长按定时器
        clearTimeout(longPressTimer);
        
        // 开始拖拽
        if (!isDragging) {
            isDragging = true;
            console.log(`开始拖拽 - 设备类型: ${isStylus(e) ? '触控笔' : '手指'}, 移动距离: ${moveDistance.toFixed(1)}px, 阈值: ${moveThreshold}px`);
            
            // 移除检测移动的监听器，添加拖拽移动监听器
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('touchmove', handleMouseMove);
            document.removeEventListener('pointermove', handleMouseMove); // 添加触控笔支持
            document.addEventListener('mousemove', moveBubble);
            document.addEventListener('touchmove', moveBubble);
            document.addEventListener('pointermove', moveBubble); // 添加触控笔支持
            document.addEventListener('mouseup', stopBubbleDrag);
            document.addEventListener('touchend', stopBubbleDrag);
            document.addEventListener('pointerup', stopBubbleDrag); // 添加触控笔支持
        }
    }
}

/**
 * 移动气泡
 * @param {Event} e - 事件对象
 */
function moveBubble(e) {
    if (!isDragging || !selectedBubble || isLongPress) return;
    
    // 清除长按定时器，因为用户正在拖动
    clearTimeout(longPressTimer);
    
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else if (e.pointerType === 'pen') {
        // 触控笔事件
        clientX = e.clientX;
        clientY = e.clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    // 更新气泡位置
    selectedBubble.x = clientX - dragOffsetX;
    selectedBubble.y = clientY - dragOffsetY;
    
    // 更新DOM元素位置
    const bubbleElement = document.getElementById(selectedBubble.id);
    bubbleElement.style.left = `${selectedBubble.x - selectedBubble.size / 2}px`;
    bubbleElement.style.top = `${selectedBubble.y - selectedBubble.size / 2}px`;
    
    // 更新连线位置
    updateConnectionPositions();
    
    // 如果上下文菜单正在显示，更新其位置
    const contextMenu = document.getElementById('bubble-context-menu');
    if (contextMenu.classList.contains('visible')) {
        const bubbleId = contextMenu.getAttribute('data-bubble-id');
        if (bubbleId === bubble.id) {
            const bubbleElement = document.getElementById(bubbleId);
            const bubbleRect = bubbleElement.getBoundingClientRect();
            contextMenu.style.left = `${bubble.x}px`;
            contextMenu.style.top = `${bubbleRect.top - 30}px`;
        }
    }
}

/**
 * 停止气泡拖拽
 */
function stopBubbleDrag() {
    isDragging = false;
    
    // 清除长按定时器
    clearTimeout(longPressTimer);
    
    // 移除全局事件监听器
    document.removeEventListener('mousemove', moveBubble);
    document.removeEventListener('touchmove', moveBubble);
    document.removeEventListener('pointermove', moveBubble); // 添加触控笔支持
    document.removeEventListener('mouseup', stopBubbleDrag);
    document.removeEventListener('touchend', stopBubbleDrag);
    document.removeEventListener('pointerup', stopBubbleDrag); // 添加触控笔支持
    
    // 只有在非长按情况下才隐藏上下文菜单
    if (!isLongPress) {
        hideContextMenu();
    }
}

/**
 * 气泡爆炸效果（删除气泡）
 * @param {Object} bubble - 气泡对象
 */
function popBubble(bubble) {
    // 立即显示删除效果，提升用户体验
    createPopParticles(bubble);
    removeBubble(bubble);
    
    // 判断类型，决定调用哪个后端接口
    if (!bubble.backendId) {
        // 没有后端id，直接前端删除
        updateStatus('气泡已爆炸！', 'success');
        return;
    }
    
    // 准备请求数据，同时传递id和content
    const requestData = {
        id: bubble.backendId,
        content: bubble.text
    };
    
    console.log('发送删除请求:', {
        bubble: { text: bubble.text, type: bubble.type, backendId: bubble.backendId },
        requestData: requestData
    });
    
    if (bubble.type === 'solution') {
        // 归档solution
        updateStatus('正在归档结论...', 'processing');
        fetch(`${BACKEND_URL}/archive`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        })
        .then(res => res.json())
        .then(data => {
            if (data.code === 0 || data.msg === "solution节点已归档") {
                updateStatus('结论已归档！', 'success');
                
                // 处理后端返回的删除信息
                if (data.data && data.data.deleted && data.data.deleted.length > 0) {
                    console.log('后端删除了以下节点:', data.data.deleted);
                    
                    // 删除对应的前端气泡
                    for (const deletedNode of data.data.deleted) {
                        // 查找对应的前端气泡
                        const frontendBubble = bubbles.find(b => 
                            b.backendId === deletedNode.id || b.text === deletedNode.content
                        );
                        
                        if (frontendBubble) {
                            console.log('删除前端气泡:', frontendBubble.text);
                            // 从DOM中移除气泡元素
                            const bubbleElement = document.getElementById(frontendBubble.id);
                            if (bubbleElement) {
                                bubbleElement.classList.add('fade-out-animation');
                                setTimeout(() => {
                                    if (bubbleElement.parentNode) {
                                        bubbleElement.parentNode.removeChild(bubbleElement);
                                    }
                                }, 50);
                            }
                            
                            // 从气泡数组中移除
                            bubbles = bubbles.filter(b => b.id !== frontendBubble.id);
                            
                            // 移除与该气泡相关的所有连线
                            const relatedConnections = connections.filter(
                                conn => conn.startBubble.id === frontendBubble.id || conn.endBubble.id === frontendBubble.id
                            );
                            
                            for (const conn of relatedConnections) {
                                removeConnection(conn);
                            }
                            
                            // 如果被选中的气泡被移除，清除选择
                            if (selectedBubble && selectedBubble.id === frontendBubble.id) {
                                selectedBubble = null;
                            }
                        }
                    }
                }
            } else {
                updateStatus('归档失败: ' + data.msg, 'error');
            }
        })
        .catch(err => {
            updateStatus('归档失败: ' + err.message, 'error');
        });
    } else {
        // 删除thought
        updateStatus('正在删除气泡...', 'processing');
        fetch(`${BACKEND_URL}/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        })
        .then(res => res.json())
        .then(data => {
            if (data.code === 0) {
                updateStatus('气泡已爆炸！', 'success');
                
                // 处理后端返回的删除信息
                if (data.data && data.data.deleted && data.data.deleted.length > 0) {
                    console.log('后端删除了以下节点:', data.data.deleted);
                    
                    // 删除对应的前端气泡
                    for (const deletedNode of data.data.deleted) {
                        // 查找对应的前端气泡
                        const frontendBubble = bubbles.find(b => 
                            b.backendId === deletedNode.id || b.text === deletedNode.content
                        );
                        
                        if (frontendBubble) {
                            console.log('删除前端气泡:', frontendBubble.text);
                            // 从DOM中移除气泡元素
                            const bubbleElement = document.getElementById(frontendBubble.id);
                            if (bubbleElement) {
                                bubbleElement.classList.add('fade-out-animation');
                                setTimeout(() => {
                                    if (bubbleElement.parentNode) {
                                        bubbleElement.parentNode.removeChild(bubbleElement);
                                    }
                                }, 50);
                            }
                            
                            // 从气泡数组中移除
                            bubbles = bubbles.filter(b => b.id !== frontendBubble.id);
                            
                            // 移除与该气泡相关的所有连线
                            const relatedConnections = connections.filter(
                                conn => conn.startBubble.id === frontendBubble.id || conn.endBubble.id === frontendBubble.id
                            );
                            
                            for (const conn of relatedConnections) {
                                removeConnection(conn);
                            }
                            
                            // 如果被选中的气泡被移除，清除选择
                            if (selectedBubble && selectedBubble.id === frontendBubble.id) {
                                selectedBubble = null;
                            }
                        }
                    }
                }
            } else {
                updateStatus('删除失败: ' + data.msg, 'error');
            }
        })
        .catch(err => {
            updateStatus('删除失败: ' + err.message, 'error');
        });
    }
}

/**
 * 移除气泡
 * @param {Object} bubble - 气泡对象
 */
function removeBubble(bubble) {
    // 从DOM中移除气泡元素
    const bubbleElement = document.getElementById(bubble.id);
    if (bubbleElement) {
        bubbleElement.classList.add('fade-out-animation');
        // 减少动画延迟，50ms
        setTimeout(() => {
            if (bubbleElement.parentNode) {
                bubbleElement.parentNode.removeChild(bubbleElement);
            }
        }, 50);
    }
    
    // 立即从气泡数组中移除，不等待动画
    bubbles = bubbles.filter(b => b.id !== bubble.id);
    
    // 移除与该气泡相关的所有连线
    const relatedConnections = connections.filter(
        conn => conn.startBubble.id === bubble.id || conn.endBubble.id === bubble.id
    );
    
    for (const conn of relatedConnections) {
        removeConnection(conn);
    }
    
    // 如果被选中的气泡被移除，清除选择
    if (selectedBubble && selectedBubble.id === bubble.id) {
        selectedBubble = null;
    }
}

/**
 * 选择气泡
 * @param {Object} bubble - 气泡对象
 */
function selectBubble(bubble) {
    // 清除之前选择的气泡
    if (selectedBubble) {
        const prevElement = document.getElementById(selectedBubble.id);
        if (prevElement) {
            prevElement.classList.remove('selected');
        }
    }
    
    // 设置新选择的气泡
    selectedBubble = bubble;
    
    // 高亮显示选中的气泡
    const bubbleElement = document.getElementById(bubble.id);
    if (bubbleElement) {
        bubbleElement.classList.add('selected');
    }
    
    // 更新气泡列表中的选择状态
    
    // 提供智能引导
    setTimeout(() => provideSmartGuidance('bubble_selected'), 500);
}

/**
 * 清除所有气泡
 */
function clearAllBubbles() {
    // 清除所有连线
    clearAllConnections();
    
    // 清除所有粒子
    const bubbleContainer = document.getElementById('bubble-container');
    const particles = document.querySelectorAll('.particle');
    particles.forEach(particle => {
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
    });
    
    // 清除所有气泡元素
    const bubbleElements = document.querySelectorAll('.bubble');
    bubbleElements.forEach(element => {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
    });
    
    // 重置气泡数组和选择状态
    bubbles = [];
    selectedBubble = null;
    
    updateStatus('所有气泡已清除！', 'success');
    
    // 提供智能引导
    setTimeout(() => provideSmartGuidance('cleared_all'), 1000);
}

/**
 * 查找指定点附近的气泡
 * @param {number} x - x坐标
 * @param {number} y - y坐标
 * @returns {Object|null} 气泡对象或null
 */
function findBubbleAtPoint(x, y) {
    console.log('查找气泡，坐标:', x, y, '气泡总数:', bubbles.length);
    
    for (const bubble of bubbles) {
        const distance = Math.sqrt(Math.pow(bubble.x - x, 2) + Math.pow(bubble.y - y, 2));
        const tolerance = bubble.size / 2 + 10; // 增加10px的容差
        
        console.log('检查气泡:', bubble.id, '距离:', distance, '容差:', tolerance);
        
        if (distance <= tolerance) {
            console.log('找到气泡:', bubble.id);
            return bubble;
        }
    }
    
    console.log('未找到气泡');
    return null;
}

/**
 * 显示气泡上下文菜单
 * @param {Event} e - 事件对象
 * @param {Object} bubble - 气泡对象
 */
function showContextMenu(e, bubble) {
    // 获取气泡元素和位置
    const bubbleElement = document.getElementById(bubble.id);
    const bubbleRect = bubbleElement.getBoundingClientRect();
    
    // 计算菜单位置 - 显示在气泡正上方
    const menuX = bubble.x;
    const menuY = bubbleRect.top - 30; // 气泡上方30px处
    
    // 添加菜单项点击事件（必须在显示之前设置）
    setupContextMenuEvents(bubble);
    
    // 获取更新后的上下文菜单元素
    const contextMenu = document.getElementById('bubble-context-menu');
    
    // 设置菜单位置
    contextMenu.style.left = `${menuX}px`;
    contextMenu.style.top = `${menuY}px`;
    
    // 显示菜单
    contextMenu.classList.add('visible');
    
    // 设置当前选中的气泡
    contextMenu.setAttribute('data-bubble-id', bubble.id);
    
    // 阻止外部的事件冒泡
    e.stopPropagation();
    
    // 添加点击其他区域隐藏菜单的事件
    setTimeout(() => {
        document.addEventListener('click', hideContextMenuOnClickOutside);
    }, 10);
    
    console.log('显示气泡右键菜单'); // 调试日志
}

/**
 * 隐藏气泡上下文菜单
 */
function hideContextMenu() {
    const contextMenu = document.getElementById('bubble-context-menu');
    contextMenu.classList.remove('visible');
    
    document.removeEventListener('click', hideContextMenuOnClickOutside);
}

/**
 * 点击菜单外部区域时隐藏菜单
 * @param {Event} e - 事件对象
 */
function hideContextMenuOnClickOutside(e) {
    const contextMenu = document.getElementById('bubble-context-menu');
    
    // 检查点击的是否为菜单项或菜单本身
    if (!contextMenu.contains(e.target)) {
        // 检查点击的是否为当前选中的气泡
        const bubbleId = contextMenu.getAttribute('data-bubble-id');
        const bubbleElement = document.getElementById(bubbleId);
        
        // 如果点击的不是气泡本身，则隐藏菜单
        if (!bubbleElement || !bubbleElement.contains(e.target)) {
            hideContextMenu();
        }
    }
}

/**
 * 设置上下文菜单事件
 * @param {Object} bubble - 气泡对象
 */
function setupContextMenuEvents(bubble) {
    const contextMenu = document.getElementById('bubble-context-menu');
    
    // 移除之前的事件监听器
    const newContextMenu = contextMenu.cloneNode(true);
    contextMenu.parentNode.replaceChild(newContextMenu, contextMenu);
    
    // 使用事件委托，为整个菜单添加点击事件
    newContextMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('菜单项被点击:', e.target.className); // 调试日志
        
        const target = e.target.closest('.context-menu-item');
        if (!target) return;
        
        // 根据点击的菜单项执行相应操作
        if (target.classList.contains('conclusion')) {
            console.log('设置气泡类型为结论');
            setBubbleType(bubble, 'conclusion');
        } else if (target.classList.contains('theme')) {
            console.log('设置气泡类型为主题');
            setBubbleType(bubble, 'theme');
        } else if (target.classList.contains('delete')) {
            console.log('删除气泡');
            popBubble(bubble);
        }
        
        hideContextMenu();
    });
    
    // 为菜单本身添加mousedown监听，阻止事件穿透
    newContextMenu.onmousedown = function(event) {
        event.stopPropagation();
    };
}

/**
 * 设置气泡类型
 * @param {Object} bubble - 气泡对象
 * @param {string} type - 气泡类型（conclusion, theme）
 */
function setBubbleType(bubble, type) {
    // 设置气泡类型属性，但保持原有颜色不变
    bubble.type = type;
    
    // 更新DOM元素的data-type属性
    const bubbleElement = document.getElementById(bubble.id);
    if (bubbleElement) {
        bubbleElement.dataset.type = type;
    }
    
    // 立即刷新侧边栏（如果是主题或结论）
    if (type === 'conclusion' || type === 'theme') {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('visible')) {
            // 立即刷新思绪笔记
            fetchAndRenderTopics();
            
            // 如果是结论，立即添加到本地显示
            if (type === 'conclusion') {
                addSolutionToSidebar(bubble);
            }
        }
    }
    
    // 如果有后端id，同步到后端
    if (bubble.backendId) {
        let backendType = 'thought';
        if (type === 'conclusion') {
            backendType = 'solution';
        } else if (type === 'theme') {
            backendType = 'topic';
        }
        
        // 调用后端update接口
        fetch(`${BACKEND_URL}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: bubble.backendId,
                type: backendType,
                content: bubble.text
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.id) {
                // 更新气泡的后端id
                bubble.backendId = data.id;
                console.log('节点类型已更新:', data.msg);
            }
        })
        .catch(err => {
            console.error('更新节点类型失败:', err);
        });
    }
    
    // 根据类型显示相应的状态信息
    switch (type) {
        case 'conclusion':
            updateStatus('已设置为结论气泡', 'success');
            break;
        case 'theme':
            updateStatus('已设置为主题气泡', 'success');
            break;
        default:
            updateStatus('已设置气泡属性', 'success');
            break;
    }
    
    // 提供智能引导
    setTimeout(() => provideSmartGuidance('bubble_type_set', { type }), 500);
}

/**
 * 测试触控笔检测功能
 * 在控制台输出当前设备的触控笔检测信息
 */
function testStylusDetection() {
    console.log('=== 触控笔检测测试 ===');
    console.log('设备像素比:', window.devicePixelRatio || 1);
    console.log('触摸支持:', 'ontouchstart' in window);
    console.log('Pointer Events支持:', 'onpointerdown' in window);
    
    // 测试事件对象
    const testEvent = {
        pointerType: 'pen',
        pressure: 0.8,
        tiltX: 10,
        tiltY: 5,
        touches: null
    };
    
    console.log('测试触控笔事件:', {
        pointerType: testEvent.pointerType,
        pressure: testEvent.pressure,
        tiltX: testEvent.tiltX,
        tiltY: testEvent.tiltY,
        isStylus: isStylus(testEvent),
        longPressDelay: getLongPressDelay(testEvent),
        moveThreshold: getMoveThreshold(testEvent)
    });
    
    // 测试手指事件
    const testFingerEvent = {
        pointerType: 'touch',
        pressure: 0.3,
        touches: null
    };
    
    console.log('测试手指事件:', {
        pointerType: testFingerEvent.pointerType,
        pressure: testFingerEvent.pressure,
        isStylus: isStylus(testFingerEvent),
        longPressDelay: getLongPressDelay(testFingerEvent),
        moveThreshold: getMoveThreshold(testFingerEvent)
    });
}

// 页面加载完成后自动运行测试
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(testStylusDetection, 1000);
});