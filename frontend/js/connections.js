/**
 * connections.js - 连线相关功能
 * 处理气泡之间的连线创建、渲染和删除
 */

// 连线相关全局变量
let connections = [];

/**
 * 检测路径是否为连线
 * @param {Array} path - 路径点数组
 * @returns {boolean} 是否为连线
 */
function isConnectionLine(path) {
    console.log('检查连线检测，路径点数:', path.length);
    
    // 如果点数太少，不可能是连线
    if (path.length < 10) {
        console.log('点数太少，不是连线');
        return false;
    }
    
    // 获取起点和终点
    const startPoint = path[0];
    const endPoint = path[path.length - 1];
    
    // 计算起点和终点之间的距离
    const lineLength = distance(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
    console.log('连线长度:', lineLength, '最小长度要求:', CONNECTION_MIN_LENGTH);
    
    // 如果距离太短，不认为是连线
    if (lineLength < CONNECTION_MIN_LENGTH) {
        console.log('连线长度太短，不是连线');
        return false;
    }
    
    // 查找起点和终点附近的气泡
    const startBubble = findBubbleAtPoint(startPoint.x, startPoint.y);
    const endBubble = findBubbleAtPoint(endPoint.x, endPoint.y);
    
    console.log('起点气泡:', startBubble);
    console.log('终点气泡:', endBubble);
    console.log('当前气泡总数:', bubbles.length);
    
    // 如果起点和终点都有气泡，且不是同一个气泡，则认为是连线
    if (startBubble && endBubble && startBubble.id !== endBubble.id) {
        console.log('检测到连线！创建连接');
        // 创建连接
        createConnection(startBubble, endBubble);
        return true;
    }
    
    console.log('不是连线');
    return false;
}

/**
 * 创建气泡之间的连接
 * @param {Object} startBubble - 起始气泡
 * @param {Object} endBubble - 结束气泡
 * @returns {Object|null} 连接对象或null
 */
function createConnection(startBubble, endBubble) {
    // 检查是否已存在相同的连接
    const existingConnection = connections.find(conn => 
        (conn.startBubble.id === startBubble.id && conn.endBubble.id === endBubble.id) ||
        (conn.startBubble.id === endBubble.id && conn.endBubble.id === startBubble.id)
    );
    if (existingConnection) {
        updateStatus('连接已存在！', 'error');
        return null;
    }
    // 检查后端id和类型
    if (!startBubble.backendId || !endBubble.backendId) {
        updateStatus('请先识别并保存气泡', 'error');
        return null;
    }
    // 请求后端建立连接
    fetch(`${BACKEND_URL}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            node_id: startBubble.backendId,
            connect_ids: [endBubble.backendId],
            node_type: startBubble.type || 'thought'
        })
    })
    .then(res => res.json())
    .then(data => {
        // 后端成功后再渲染连线
        const connection = {
            id: generateId(),
            startBubble: startBubble,
            endBubble: endBubble
        };
        connections.push(connection);
        renderConnection(connection);
        updateStatus('连接已创建！', 'success');
        // 删除侧边栏更新，因为现在只显示solutions
        setTimeout(() => provideSmartGuidance('connection_created'), 1000);
    })
    .catch(err => {
        updateStatus('连接失败: ' + err.message, 'error');
    });
    return null;
}

/**
 * 渲染连接到DOM
 * @param {Object} connection - 连接对象
 */
function renderConnection(connection) {
    const bubbleContainer = document.getElementById('bubble-container');
    
    // 创建连接元素
    const connectionElement = document.createElement('div');
    connectionElement.id = connection.id;
    connectionElement.className = 'connection';
    
    // 创建SVG元素
    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgElement.setAttribute('width', '100%');
    svgElement.setAttribute('height', '100%');
    
    // 创建路径元素
    const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    connectionElement.appendChild(svgElement);
    svgElement.appendChild(pathElement);
    
    // 计算连接点位置
    const startX = connection.startBubble.x;
    const startY = connection.startBubble.y;
    const endX = connection.endBubble.x;
    const endY = connection.endBubble.y;
    
    // 计算控制点（贝塞尔曲线）
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const controlOffset = distance / 3;
    
    // 计算垂直于连线的方向
    const perpX = -dy / distance;
    const perpY = dx / distance;
    
    // 设置控制点偏移，使曲线稍微弯曲
    const controlX = (startX + endX) / 2 + perpX * controlOffset;
    const controlY = (startY + endY) / 2 + perpY * controlOffset;
    
    // 设置路径
    const path = `M ${startX} ${startY} Q ${controlX} ${controlY}, ${endX} ${endY}`;
    pathElement.setAttribute('d', path);
    
    // 创建连接点（起点）
    const startPoint = document.createElement('div');
    startPoint.className = 'connection-point';
    startPoint.style.left = `${startX}px`;
    startPoint.style.top = `${startY}px`;
    
    // 创建连接点（终点）
    const endPoint = document.createElement('div');
    endPoint.className = 'connection-point';
    endPoint.style.left = `${endX}px`;
    endPoint.style.top = `${endY}px`;
    
    // 创建删除按钮
    const deleteButton = document.createElement('div');
    deleteButton.className = 'connection-delete';
    deleteButton.innerHTML = '×';
    deleteButton.style.left = `${controlX}px`;
    deleteButton.style.top = `${controlY}px`;
    
    // 添加删除事件
    deleteButton.addEventListener('click', () => removeConnection(connection));
    
    // 添加到连接元素
    connectionElement.appendChild(startPoint);
    connectionElement.appendChild(endPoint);
    connectionElement.appendChild(deleteButton);
    
    // 添加到容器
    bubbleContainer.appendChild(connectionElement);
}

/**
 * 移除连接
 * @param {Object} connection - 连接对象
 */
function removeConnection(connection) {
    // 从DOM中移除连接元素
    const connectionElement = document.getElementById(connection.id);
    if (connectionElement) {
        connectionElement.parentNode.removeChild(connectionElement);
    }
    
    // 从连接数组中移除
    connections = connections.filter(conn => conn.id !== connection.id);
    
    // 更新状态
    updateStatus('连接已删除！', 'success');
    
    // 如果侧边栏正在显示，更新主题列表
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('visible')) {
        updateThemeList();
    }
}

/**
 * 更新所有连接的位置
 */
function updateConnectionPositions() {
    for (const connection of connections) {
        // 获取连接元素
        const connectionElement = document.getElementById(connection.id);
        if (!connectionElement) continue;
        
        // 获取SVG和路径元素
        const svgElement = connectionElement.querySelector('svg');
        const pathElement = svgElement.querySelector('path');
        
        // 获取连接点元素
        const connectionPoints = connectionElement.querySelectorAll('.connection-point');
        const startPoint = connectionPoints[0];
        const endPoint = connectionPoints[1];
        
        // 获取删除按钮
        const deleteButton = connectionElement.querySelector('.connection-delete');
        
        // 更新连接点位置
        const startX = connection.startBubble.x;
        const startY = connection.startBubble.y;
        const endX = connection.endBubble.x;
        const endY = connection.endBubble.y;
        
        startPoint.style.left = `${startX}px`;
        startPoint.style.top = `${startY}px`;
        endPoint.style.left = `${endX}px`;
        endPoint.style.top = `${endY}px`;
        
        // 计算控制点
        const dx = endX - startX;
        const dy = endY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const controlOffset = distance / 3;
        
        // 计算垂直于连线的方向
        const perpX = -dy / distance;
        const perpY = dx / distance;
        
        // 设置控制点偏移
        const controlX = (startX + endX) / 2 + perpX * controlOffset;
        const controlY = (startY + endY) / 2 + perpY * controlOffset;
        
        // 更新删除按钮位置
        deleteButton.style.left = `${controlX}px`;
        deleteButton.style.top = `${controlY}px`;
        
        // 更新路径
        const path = `M ${startX} ${startY} Q ${controlX} ${controlY}, ${endX} ${endY}`;
        pathElement.setAttribute('d', path);
    }
}

/**
 * 清除所有连接
 */
function clearAllConnections() {
    // 从DOM中移除所有连接元素
    const connectionElements = document.querySelectorAll('.connection');
    connectionElements.forEach(element => {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
    });
    
    // 清空连接数组
    connections = [];
    
    // 更新状态

    updateStatus('所有连接已清除！', 'success');
}

/**
 * 清除手写连线
 * @param {Array} path - 要清除的路径
 */
function clearConnectionLine(path) {
    // 清除画布上的手写连线
    const pathBounds = getCircleBounds(path);
    const lineWidth = 10; // 稍微宽一点，确保完全清除
    
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = 'white';
    
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
    
    // 恢复绘图设置
    ctx.lineWidth = DEFAULT_LINE_WIDTH;
    ctx.strokeStyle = DEFAULT_LINE_COLOR;
}