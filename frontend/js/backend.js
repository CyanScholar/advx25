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
        },
        mode: 'cors' // 明确指定CORS模式
    });
    
    // 竞争超时和请求
    Promise.race([fetchPromise, timeoutPromise])
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(`后端服务不可用: ${response.status} ${response.statusText}`);
        })
        .then(data => {
            backendConnected = true;
            updateBackendStatus(true);
            updateStatus('后端连接成功', 'success');
            console.log('后端连接成功:', data);
        })
        .catch(error => {
            backendConnected = false;
            updateBackendStatus(false);
            updateStatus(`后端连接失败: ${error.message}`, 'error');
            console.error('后端连接错误:', error);
        });
}

/**
 * 检查后端连接并清空数据库
 */
function checkBackendConnectionAndClear() {
    console.log('检查后端连接并清空数据库...');
    
    // 先检查连接
    checkBackendConnection();
    
    // 延迟清空数据库，确保连接检查完成
    setTimeout(() => {
        if (backendConnected) {
            clearDatabase();
        } else {
            console.warn('后端未连接，跳过数据库清空');
        }
    }, 1000);
}

/**
 * 清空数据库
 */
function clearDatabase() {
    console.log('清空数据库...');
    updateStatus('正在清空数据库...', 'processing');
    
    fetch(`${BACKEND_URL}/clear`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        mode: 'cors'
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error(`清空数据库失败: ${response.status}`);
    })
    .then(data => {
        console.log('数据库清空成功:', data);
        updateStatus('数据库已清空', 'success');
    })
    .catch(error => {
        console.error('清空数据库错误:', error);
        updateStatus(`清空数据库失败: ${error.message}`, 'error');
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
    console.log('开始OCR识别:', { type, topicName, bounds });
    
    // 更新状态
    updateOCRStatus('processing');

    // 检查后端连接
    if (!backendConnected) {
        console.error('后端未连接，无法进行OCR识别');
        updateOCRStatus('error', '后端未连接，无法识别');
        // 尝试重新连接
        checkBackendConnection();
        return;
    }

    // 创建表单数据
    const formData = new FormData();
    formData.append('file', imageBlob, 'circle.png');
    formData.append('type', type); // 'thought' 或 'solution'
    if (topicName) {
        formData.append('topic_name', topicName);
    }

    console.log('发送OCR请求到:', `${BACKEND_URL}/ocr`);
    console.log('表单数据:', {
        type: type,
        topic_name: topicName,
        file_size: imageBlob.size
    });

    // 创建超时
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('OCR请求超时')), BACKEND_TIMEOUT);
    });

    // 创建请求
    const fetchPromise = fetch(`${BACKEND_URL}/ocr`, {
        method: 'POST',
        body: formData,
        mode: 'cors' // 明确指定CORS模式
    });

    // 竞争超时和请求
    Promise.race([fetchPromise, timeoutPromise])
        .then(response => {
            console.log('OCR响应状态:', response.status, response.statusText);
            if (response.ok) {
                return response.json();
            }
            // 尝试读取错误信息
            return response.text().then(text => {
                throw new Error(`OCR服务错误: ${response.status} ${response.statusText} - ${text}`);
            });
        })
        .then(data => {
            console.log('OCR识别结果:', data);
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
            console.error('OCR错误详情:', error);
            
            // 根据错误类型提供更友好的错误信息
            let errorMessage = error.message;
            if (error.message.includes('未检测到文字') || error.message.includes('ImageNoText')) {
                errorMessage = '图片中未检测到文字，请确保图片包含清晰的文字内容';
            } else if (error.message.includes('连接') || error.message.includes('网络')) {
                errorMessage = '网络连接失败，请检查后端服务是否正常运行';
                backendConnected = false;
                checkBackendConnection();
            } else if (error.message.includes('超时')) {
                errorMessage = 'OCR请求超时，请稍后重试';
            }
            
            updateOCRStatus('error', errorMessage);
        });
}