/**
 * backend.js - 后端连接功能
 * 处理与后端服务的通信
 */

// 后端连接状态
let backendConnected = false;

/**
 * 更新后端状态（空函数，因为侧边栏已删除）
 */
function updateBackendStatus(available) {
    // 空函数，因为侧边栏已删除
}

/**
 * 检查后端连接
 */
function checkBackendConnection() {
    updateBackendStatus(false);
    updateStatus('正在连接后端...', 'processing');
    
    // 创建超时
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('连接超时')), BACKEND_TIMEOUT);
    });
    
    // 创建请求
    const fetchPromise = fetch(`${BACKEND_URL}/ping`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    
    // 竞争超时和请求
    Promise.race([fetchPromise, timeoutPromise])
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('后端服务不可用');
        })
        .then(data => {
            backendConnected = true;
            updateBackendStatus(true);
            updateStatus('后端连接成功', 'success');
        })
        .catch(error => {
            backendConnected = false;
            updateBackendStatus(false);
            updateStatus(`后端连接失败: ${error.message}`, 'error');
            console.error('后端连接错误:', error);
        });
}

/**
 * 模拟OCR功能
 * @returns {Promise<string>} 识别的文本
 */
function simulateOCR() {
    return new Promise(resolve => {
        // 模拟处理延迟
        setTimeout(() => {
            // 随机生成一些文本
            const texts = [
                '这是一个笔记',
                '重要任务',
                '会议记录',
                '创意想法',
                '待办事项',
                '项目计划',
                '联系人信息',
                '备忘录'
            ];
            const randomText = texts[Math.floor(Math.random() * texts.length)];
            resolve(randomText);
        }, 1000);
    });
}

/**
 * 发送图像到OCR服务
 * @param {Blob} imageBlob - 图像Blob对象
 * @param {Object} bounds - 图像边界
 * @param {Array} path - 圆圈路径
 * @param {string} type - 节点类型（'thought' 或 'solution'）
 * @param {string} topicName - 主题名（可选）
 */
function sendToOCR(imageBlob, bounds, path, type = 'thought', topicName = '') {
    // 更新状态
    updateOCRStatus('processing');

    // 检查后端连接
    if (!backendConnected) {
        updateOCRStatus('error', '后端未连接，无法识别');
        return;
    }

    // 创建表单数据
    const formData = new FormData();
    formData.append('file', imageBlob, 'circle.png');
    formData.append('type', type); // 'thought' 或 'solution'
    if (topicName) {
        formData.append('topic_name', topicName);
    }

    // 创建超时
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('OCR请求超时')), BACKEND_TIMEOUT);
    });

    // 创建请求
    const fetchPromise = fetch(`${BACKEND_URL}/ocr`, {
        method: 'POST',
        body: formData
    });

    // 竞争超时和请求
    Promise.race([fetchPromise, timeoutPromise])
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('OCR服务错误');
        })
        .then(data => {
            if (data.text) {
                // 创建气泡，保存后端id
                const centerX = (bounds.minX + bounds.maxX) / 2;
                const centerY = (bounds.minY + bounds.maxY) / 2;
                const size = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
                // 传递后端id和类型
                createBubble(centerX, centerY, data.text, size, 'bubble-blue', data.id, type, topicName);

                // 清除圆圈区域（同时清除边框和内容）
                clearCircleAreaByMode(bounds, 'content', path);
                clearCircleAreaByMode(bounds, 'border', path);

                // 更新状态
                updateOCRStatus('success', data.text);

                // 重置当前路径
                currentPath = [];
            } else {
                throw new Error('未识别到文字');
            }
        })
        .catch(error => {
            updateOCRStatus('error', error.message);
            console.error('OCR错误:', error);
        });
}