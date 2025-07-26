/**
 * ui.js - 用户界面相关功能
 * 处理状态更新、气泡列表和其他UI元素
 */

/**
 * 更新状态显示
 * @param {string} message - 状态消息
 * @param {string} type - 状态类型（processing, success, error）
 */
function updateStatus(message, type = 'processing') {
    const statusElement = document.getElementById('status');
    
    // 清除之前的类
    statusElement.classList.remove('status-processing', 'status-success', 'status-error');
    
    // 设置新类和消息
    statusElement.classList.add(`status-${type}`);
    statusElement.textContent = message;
    
    // 显示状态
    statusElement.style.opacity = '1';
    
    // 设置自动隐藏
    setTimeout(() => {
        statusElement.style.opacity = '0';
    }, 3000);
}

/**
 * 更新OCR状态
 * @param {string} status - 状态（processing, success, error）
 * @param {string} message - 状态消息
 */
function updateOCRStatus(status, message) {
    if (status === 'processing') {
        updateStatus('正在识别文字...', 'processing');
    } else if (status === 'success') {
        updateStatus(`识别成功: ${message}`, 'success');
    } else if (status === 'error') {
        updateStatus(`识别失败: ${message}`, 'error');
    }
}











/**
 * 切换工具
 * @param {string} tool - 工具（pen, eraser）
 */
function setTool(tool) {
    const penToolButton = document.getElementById('pen-tool');
    const eraserToolButton = document.getElementById('eraser-tool');
    
    currentTool = tool;
    
    if (tool === 'pen') {
        penToolButton.classList.add('active');
        eraserToolButton.classList.remove('active');
    } else if (tool === 'eraser') {
        penToolButton.classList.remove('active');
        eraserToolButton.classList.add('active');
    }
}

/**
 * 设置线宽
 * @param {number} width - 线宽
 */
function setLineWidth(width) {
    lineWidth = width;
    ctx.lineWidth = width;
    
    // 更新显示
    const sizeValueElement = document.getElementById('size-value');
    sizeValueElement.textContent = `${width}px`;
}

/**
 * 切换戳破模式
 */
function togglePinMode() {
    isPinMode = !isPinMode;
    const pinModeButton = document.getElementById('pin-mode');
    
    if (isPinMode) {
        pinModeButton.classList.add('active');
        updateStatus('戳破模式已启用', 'success');
        
        // 更新所有气泡的光标样式
        document.querySelectorAll('.bubble').forEach(bubble => {
            bubble.style.cursor = 'crosshair';
        });
    } else {
        pinModeButton.classList.remove('active');
        updateStatus('戳破模式已禁用', 'success');
        
        // 恢复所有气泡的光标样式
        document.querySelectorAll('.bubble').forEach(bubble => {
            bubble.style.cursor = 'move';
        });
    }
}

/**
 * 显示侧边栏
 */
function showSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.add('visible');
    // 获取并显示solutions
    fetchAndRenderSolutions();
    
    // 提供智能引导
    setTimeout(() => provideSmartGuidance('sidebar_opened'), 500);
}

/**
 * 隐藏侧边栏
 */
function hideSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('visible');
}

// 删除原有的updateThemeList、createThemeItem、createOrphanItem等函数
// 因为侧边栏现在只显示solutions的todo文字形式

/**
 * 聚焦到指定气泡
 */
function focusBubble(bubbleId) {
    const bubble = document.getElementById(bubbleId);
    if (bubble) {
        // 滚动到气泡位置
        bubble.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // 高亮显示
        bubble.style.transform = 'scale(1.1)';
        bubble.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)';
        
        setTimeout(() => {
            bubble.style.transform = '';
            bubble.style.boxShadow = '';
        }, 1000);
    }
}

/**
 * 检查气泡是否与主题相连
 */
function isConnectedToTheme(bubble, themeBubble) {
    // 检查是否有直接连接
    return connections.some(connection => {
        return (connection.bubble1 === bubble && connection.bubble2 === themeBubble) ||
               (connection.bubble1 === themeBubble && connection.bubble2 === bubble);
    });
}

/**
 * 检查气泡是否有父主题
 */
function hasParentTheme(bubble, themeBubbles) {
    return themeBubbles.some(themeBubble => isConnectedToTheme(bubble, themeBubble));
}

/**
 * 显示AI引导（现在始终显示，保留函数以兼容现有代码）
 */
function showAIGuidance() {
    // AI引导框现在始终显示
}

/**
 * 隐藏AI引导（现在始终显示，保留函数以兼容现有代码）
 */
function hideAIGuidance() {
    // AI引导框现在始终显示
}

/**
 * 切换AI引导显示状态（现在始终显示，保留函数以兼容现有代码）
 */
function toggleAIGuidance() {
    // AI引导框现在始终显示，点击图标不再切换
}

/**
 * 更新AI引导内容
 * @param {string} message - 引导消息
 * @param {boolean} showTyping - 是否显示打字机效果
 */
function updateAIGuidance(message, showTyping = false) {
    const aiGuidanceText = document.querySelector('.ai-guidance-text');
    
    if (showTyping) {
        // 清除内容并添加打字机效果
        aiGuidanceText.textContent = '';
        aiGuidanceText.classList.add('typing');
        
        // 逐字显示
        let i = 0;
        const typeInterval = setInterval(() => {
            if (i < message.length) {
                aiGuidanceText.textContent += message.charAt(i);
                i++;
            } else {
                clearInterval(typeInterval);
                // 移除打字机效果
                setTimeout(() => {
                    aiGuidanceText.classList.remove('typing');
                }, 500);
            }
        }, 50);
    } else {
        aiGuidanceText.textContent = message;
        aiGuidanceText.classList.remove('typing');
    }
    
    // AI引导框现在始终显示，无需调用showAIGuidance()
}

/**
 * 添加AI图标脉动效果
 */
function pulseAIIcon() {
    const aiIcon = document.getElementById('ai-icon');
    aiIcon.classList.add('pulse');
    
    // 3秒后移除脉动效果
    setTimeout(() => {
        aiIcon.classList.remove('pulse');
    }, 3000);
}

/**
 * 根据用户操作提供智能引导
 * @param {string} action - 用户操作类型
 * @param {Object} data - 额外数据
 */
function provideSmartGuidance(action, data = {}) {
    let message = '';
    
    switch (action) {
        case 'first_bubble':
            message = '很好！您创建了第一个气泡。试试右键点击设置气泡类型。';
            break;
        case 'bubble_type_set':
            const typeNames = { 'conclusion': '结论', 'theme': '主题' };
            const typeName = typeNames[data.type] || '气泡';
            message = `${typeName}类型已设置！现在可以创建更多气泡并用连线建立关系。`;
            break;
        case 'connection_created':
            message = '连接已建立！点击左上角📋按钮查看解决方案列表。';
            break;
        case 'sidebar_opened':
            message = '这里显示您的解决方案列表。可以查看和管理所有已创建的解决方案。';
            break;
        case 'multiple_bubbles':
            message = '您已经创建了多个气泡！试试为它们设置不同的类型并建立连接。';
            break;
        case 'bubble_selected':
            message = '气泡已选中！您可以拖动它或右键设置类型。';
            break;
        case 'cleared_all':
            message = '画布已清空。画圆圈开始创建新的思维导图吧！';
            break;
        case 'no_bubbles':
            message = '欢迎回来！画圆圈创建气泡，开始您的思维整理之旅。';
            break;
        default:
            message = '继续探索BubbleMind的功能，创建您的思维导图！';
            break;
    }
    
    updateAIGuidance(message, true);
    pulseAIIcon();
}

// 聊天相关变量
let isChatMode = false;
let chatHistory = [];

/**
 * 切换AI聊天界面
 */
function toggleAIChat() {
    const aiIcon = document.getElementById('ai-icon');
    const aiGuidance = document.getElementById('ai-guidance');
    const aiChat = document.getElementById('ai-chat');
    const aiChatInput = document.querySelector('.ai-chat-input');
    
    isChatMode = !isChatMode;
    
    if (isChatMode) {
        // 切换到聊天模式
        aiIcon.textContent = '✕';
        aiIcon.style.fontSize = '18px';
        aiIcon.style.fontWeight = 'bold';
        aiGuidance.style.display = 'none';
        aiChat.style.display = 'flex';
        aiChatInput.style.display = 'flex';
        
        // 调整AI助手容器布局
        const aiAssistant = document.getElementById('ai-assistant');
        aiAssistant.style.flexDirection = 'column';
        aiAssistant.style.alignItems = 'flex-end';
        
        // 加载聊天历史
        loadChatHistory();
        
        // 聚焦输入框
        setTimeout(() => {
            document.getElementById('ai-input').focus();
        }, 100);
    } else {
        // 切换回引导模式
        aiIcon.textContent = '🤖';
        aiIcon.style.fontSize = '14px';
        aiIcon.style.fontWeight = 'normal';
        aiGuidance.style.display = 'block';
        aiChat.style.display = 'none';
        aiChatInput.style.display = 'none';
        
        // 恢复AI助手容器布局
        const aiAssistant = document.getElementById('ai-assistant');
        aiAssistant.style.flexDirection = 'row';
        aiAssistant.style.alignItems = 'center';
    }
}

/**
 * 发送消息
 */
function sendMessage() {
    const aiInput = document.getElementById('ai-input');
    const message = aiInput.value.trim();
    
    if (!message) return;
    
    // 添加用户消息到聊天记录
    addMessageToChat('user', message);
    
    // 清空输入框
    aiInput.value = '';
    
    // 模拟AI回复（这里可以后续接入真实的AI API）
    setTimeout(() => {
        const aiResponse = generateAIResponse(message);
        addMessageToChat('ai', aiResponse);
    }, 500);
}

/**
 * 添加消息到聊天界面
 * @param {string} type - 消息类型 ('user' 或 'ai')
 * @param {string} message - 消息内容
 */
function addMessageToChat(type, message) {
    const chatMessages = document.getElementById('ai-chat-messages');
    
    // 创建消息元素
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    bubbleDiv.textContent = message;
    
    messageDiv.appendChild(bubbleDiv);
    chatMessages.appendChild(messageDiv);
    
    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // 保存到聊天历史
    chatHistory.push({ type, message, timestamp: new Date() });
    saveChatHistory();
}

/**
 * 生成AI回复（模拟）
 * @param {string} userMessage - 用户消息
 * @returns {string} AI回复
 */
function generateAIResponse(userMessage) {
    const responses = {
        '你好': '您好！我是BubbleMind的AI助手，很高兴为您服务！',
        '帮助': '我可以帮助您使用BubbleMind创建思维导图。您可以画圆圈创建气泡，右键设置类型，拖拽连接气泡建立关系。',
        '怎么用': '使用很简单：1. 画圆圈创建气泡 2. 右键设置气泡类型（主题/结论） 3. 拖拽气泡建立连接 4. 点击📋查看结构',
        '清空': '您可以按C键或使用橡皮擦工具清空画布。',
        '快捷键': '快捷键：P-画笔，E-橡皮擦，C-清空画布。您也可以使用底部工具栏。'
    };
    
    // 简单的关键词匹配
    for (const [keyword, response] of Object.entries(responses)) {
        if (userMessage.includes(keyword)) {
            return response;
        }
    }
    
    // 默认回复
    const defaultResponses = [
        '我理解您的问题。BubbleMind主要用于创建思维导图，您可以尝试画圆圈创建气泡开始。',
        '感谢您的提问！如果您需要帮助，可以问我关于BubbleMind的使用方法。',
        '我会尽力帮助您。您可以告诉我您想了解BubbleMind的哪个功能？',
        '很好的问题！BubbleMind可以帮助您整理思路，创建可视化的思维导图。'
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

/**
 * 加载聊天历史
 */
function loadChatHistory() {
    const chatMessages = document.getElementById('ai-chat-messages');
    chatMessages.innerHTML = '';
    
    // 从localStorage加载聊天历史
    const savedHistory = localStorage.getItem('bubblemind_chat_history');
    if (savedHistory) {
        chatHistory = JSON.parse(savedHistory);
        
        // 显示历史消息
        chatHistory.forEach(({ type, message }) => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `chat-message ${type}`;
            
            const bubbleDiv = document.createElement('div');
            bubbleDiv.className = 'message-bubble';
            bubbleDiv.textContent = message;
            
            messageDiv.appendChild(bubbleDiv);
            chatMessages.appendChild(messageDiv);
        });
        
        // 滚动到底部
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } else {
        // 显示欢迎消息
        addMessageToChat('ai', '您好！我是BubbleMind的AI助手。有什么可以帮助您的吗？');
    }
}

/**
 * 保存聊天历史
 */
function saveChatHistory() {
    localStorage.setItem('bubblemind_chat_history', JSON.stringify(chatHistory));
}

// ========== 侧边栏solution管理 ========== //
/**
 * 从后端拉取solutions，以todo文字形式显示在侧边栏
 */
function fetchAndRenderSolutions() {
    // 拉取solutions
    fetch(`${BACKEND_URL}/solutions`)
        .then(res => res.json())
        .then(solutions => {
            renderSolutionsList(solutions);
        })
        .catch(err => {
            console.error('获取solutions失败:', err);
            updateStatus('获取solutions失败', 'error');
        });
}

/**
 * 渲染solutions列表到侧边栏
 * @param {Array} solutions - solutions数组
 */
function renderSolutionsList(solutions) {
    const themeListContainer = document.getElementById('theme-list');
    
    // 清空列表
    themeListContainer.innerHTML = '';
    
    if (!solutions || solutions.length === 0) {
        // 显示空状态
        themeListContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <div class="empty-state-text">
                    还没有解决方案<br>
                    画圈识别文字创建解决方案
                </div>
            </div>
        `;
        return;
    }
    
    // 为每个solution创建条目
    solutions.forEach(solution => {
        const solutionItem = createSolutionItem(solution);
        themeListContainer.appendChild(solutionItem);
    });
}

/**
 * 创建solution条目
 * @param {Object} solution - solution对象
 * @returns {HTMLElement} solution条目元素
 */
function createSolutionItem(solution) {
    const solutionDiv = document.createElement('div');
    solutionDiv.className = 'solution-item';
    solutionDiv.dataset.solutionId = solution.id;
    
    solutionDiv.innerHTML = `
        <div class="solution-content">
            <div class="solution-text">${solution.content || '未命名解决方案'}</div>
        </div>
        <div class="solution-actions">
            <button class="solution-archive" onclick="archiveSolution(${solution.id})">归档</button>
        </div>
    `;
    
    return solutionDiv;
}

/**
 * 归档solution
 * @param {number} solutionId - solution的id
 */
function archiveSolution(solutionId) {
    // 找到对应的solution元素
    const solutionElement = document.querySelector(`[data-solution-id="${solutionId}"]`);
    
    if (solutionElement) {
        // 添加删除线动画
        solutionElement.style.transition = 'all 0.5s ease';
        solutionElement.style.textDecoration = 'line-through';
        solutionElement.style.opacity = '0.5';
        
        // 延迟后移除元素
        setTimeout(() => {
            solutionElement.style.transform = 'translateX(-100%)';
            solutionElement.style.opacity = '0';
            
            // 动画完成后移除元素
            setTimeout(() => {
                if (solutionElement.parentNode) {
                    solutionElement.parentNode.removeChild(solutionElement);
                }
            }, 500);
        }, 300);
    }
    
    // 调用后端接口
    fetch(`${BACKEND_URL}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: solutionId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.code === 0) {
            updateStatus('解决方案已归档', 'success');
        } else {
            updateStatus('归档失败: ' + data.msg, 'error');
        }
    })
    .catch(err => {
        updateStatus('归档失败: ' + err.message, 'error');
    });
}

// 修改showSidebar函数，调用新的solutions获取函数
function showSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.add('visible');
    // 获取并显示solutions
    fetchAndRenderSolutions();
    
    // 提供智能引导
    setTimeout(() => provideSmartGuidance('sidebar_opened'), 500);
}

// ========== agent建议轮询 ========== //
let advicePollingTimer = null;
function startAdvicePolling(topicName = '') {
    if (advicePollingTimer) clearInterval(advicePollingTimer);
    advicePollingTimer = setInterval(() => {
        fetch(`${BACKEND_URL}/agent/advice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic_name: topicName })
        })
        .then(res => res.json())
        .then(data => {
            if (data.reply) {
                updateAIGuidance(data.reply, true);
            }
        });
    }, 10000); // 10秒轮询
}

// 页面加载后自动启动建议轮询
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        startAdvicePolling();
    });
}

// ========== agent多轮对话 ========== //
function sendMessage() {
    const aiInput = document.getElementById('ai-input');
    const message = aiInput.value.trim();
    if (!message) return;
    addMessageToChat('user', message);
    aiInput.value = '';
    // 请求后端/agent/chat接口
    fetch(`${BACKEND_URL}/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_text: message })
    })
    .then(res => res.json())
    .then(data => {
        if (data.reply) {
            addMessageToChat('ai', data.reply);
        } else if (data.error) {
            addMessageToChat('ai', 'AI出错: ' + data.error);
        }
    })
    .catch(err => {
        addMessageToChat('ai', 'AI请求失败: ' + err.message);
    });
}