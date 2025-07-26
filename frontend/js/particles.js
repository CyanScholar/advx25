/**
 * particles.js - 粒子效果
 * 处理气泡爆炸时的粒子效果
 */

/**
 * 创建气泡爆炸粒子
 * @param {Object} bubble - 气泡对象
 */
function createPopParticles(bubble) {
    // 创建碎片粒子
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        createBubbleFragment(bubble);
    }
    
    // 创建光泽粒子
    for (let i = 0; i < PARTICLE_COUNT / 2; i++) {
        createShineParticle(bubble);
    }
    
    // 创建微小粒子
    for (let i = 0; i < PARTICLE_COUNT * 2; i++) {
        createTinyParticle(bubble);
    }
}

/**
 * 创建气泡碎片粒子
 * @param {Object} bubble - 气泡对象
 */
function createBubbleFragment(bubble) {
    const bubbleContainer = document.getElementById('bubble-container');
    
    // 随机角度和速度
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    
    // 随机大小
    const size = 5 + Math.random() * (bubble.size / 5);
    
    // 创建粒子对象
    const particle = {
        id: generateId(),
        x: bubble.x,
        y: bubble.y,
        size: size,
        color: bubble.color,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.1,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        lifetime: PARTICLE_LIFETIME,
        type: 'fragment'
    };
    
    // 渲染粒子
    renderParticle(particle, bubbleContainer);
    
    // 开始动画
    animateParticle(particle);
}

/**
 * 创建光泽粒子
 * @param {Object} bubble - 气泡对象
 */
function createShineParticle(bubble) {
    const bubbleContainer = document.getElementById('bubble-container');
    
    // 随机角度和速度
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    
    // 随机大小
    const size = 3 + Math.random() * (bubble.size / 8);
    
    // 创建粒子对象
    const particle = {
        id: generateId(),
        x: bubble.x,
        y: bubble.y,
        size: size,
        color: 'shine',
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.05,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 5,
        opacity: 0.8,
        lifetime: PARTICLE_LIFETIME * 0.8,
        type: 'shine'
    };
    
    // 渲染粒子
    renderParticle(particle, bubbleContainer);
    
    // 开始动画
    animateParticle(particle);
}

/**
 * 创建微小粒子
 * @param {Object} bubble - 气泡对象
 */
function createTinyParticle(bubble) {
    const bubbleContainer = document.getElementById('bubble-container');
    
    // 随机角度和速度
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 5;
    
    // 随机大小
    const size = 1 + Math.random() * 3;
    
    // 创建粒子对象
    const particle = {
        id: generateId(),
        x: bubble.x,
        y: bubble.y,
        size: size,
        color: 'tiny',
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.03,
        rotation: 0,
        rotationSpeed: 0,
        opacity: 0.7,
        lifetime: PARTICLE_LIFETIME * 0.6,
        type: 'tiny'
    };
    
    // 渲染粒子
    renderParticle(particle, bubbleContainer);
    
    // 开始动画
    animateParticle(particle);
}

/**
 * 渲染粒子到DOM
 * @param {Object} particle - 粒子对象
 * @param {HTMLElement} container - 容器元素
 */
function renderParticle(particle, container) {
    // 创建粒子元素
    const particleElement = document.createElement('div');
    particleElement.id = particle.id;
    particleElement.className = 'particle';
    
    // 设置样式
    particleElement.style.width = `${particle.size}px`;
    particleElement.style.height = `${particle.size}px`;
    particleElement.style.left = `${particle.x}px`;
    particleElement.style.top = `${particle.y}px`;
    particleElement.style.opacity = particle.opacity;
    particleElement.style.transform = `rotate(${particle.rotation}deg)`;
    
    // 根据粒子类型设置不同样式
    if (particle.type === 'fragment') {
        particleElement.style.backgroundColor = '';
        particleElement.style.borderRadius = '50% 50% 50% 0';
        particleElement.classList.add(particle.color);
        particleElement.style.boxShadow = 'inset 0 0 5px rgba(255, 255, 255, 0.5)';
    } else if (particle.type === 'shine') {
        particleElement.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        particleElement.style.borderRadius = '50%';
        particleElement.style.boxShadow = '0 0 5px rgba(255, 255, 255, 0.8)';
    } else if (particle.type === 'tiny') {
        particleElement.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
        particleElement.style.borderRadius = '50%';
    }
    
    // 添加到容器
    container.appendChild(particleElement);
}

/**
 * 动画粒子
 * @param {Object} particle - 粒子对象
 */
function animateParticle(particle) {
    // 获取粒子元素
    const particleElement = document.getElementById(particle.id);
    if (!particleElement) return;
    
    // 更新粒子位置
    particle.x += particle.vx;
    particle.y += particle.vy;
    
    // 应用重力
    particle.vy += particle.gravity;
    
    // 应用阻力
    particle.vx *= 0.98;
    particle.vy *= 0.98;
    
    // 更新旋转
    particle.rotation += particle.rotationSpeed;
    
    // 缩小粒子
    particle.size *= 0.99;
    
    // 降低不透明度
    particle.opacity *= 0.99;
    
    // 减少生命周期
    particle.lifetime -= 16; // 假设60fps，约16ms一帧
    
    // 更新DOM元素
    particleElement.style.left = `${particle.x - particle.size / 2}px`;
    particleElement.style.top = `${particle.y - particle.size / 2}px`;
    particleElement.style.width = `${particle.size}px`;
    particleElement.style.height = `${particle.size}px`;
    particleElement.style.opacity = particle.opacity;
    particleElement.style.transform = `rotate(${particle.rotation}deg)`;
    
    // 如果粒子还活着，继续动画
    if (particle.lifetime > 0 && particle.opacity > 0.1) {
        requestAnimationFrame(() => animateParticle(particle));
    } else {
        // 移除粒子
        if (particleElement.parentNode) {
            particleElement.parentNode.removeChild(particleElement);
        }
    }
}