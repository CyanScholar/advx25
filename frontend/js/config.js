/**
 * config.js - 配置文件
 * 包含应用的全局配置参数
 */

// 后端服务配置
const BACKEND_URL = 'http://175.178.123.55:9999';
const BACKEND_TIMEOUT = 5000; // 毫秒

// 画布配置
const DEFAULT_LINE_WIDTH = 3;
const DEFAULT_LINE_COLOR = '#000000';
const ERASER_WIDTH = 20;

// 气泡配置
const BUBBLE_COLORS = [
    'bubble-blue',
    'bubble-green',
    'bubble-purple',
    'bubble-orange',
    'bubble-pink'
];
const MIN_BUBBLE_SIZE = 60;
const MAX_BUBBLE_SIZE = 150;

// 圆圈检测配置
const CIRCLE_DETECTION_THRESHOLD = 0.25; // 圆形检测阈值，越小越严格
const MIN_CIRCLE_POINTS = 20; // 最小点数用于圆形检测

// 连线检测配置
const CONNECTION_MIN_LENGTH = 50; // 最小连线长度
const CONNECTION_MAX_ANGLE_VARIANCE = 0.3; // 连线角度变化阈值

// 粒子效果配置
const PARTICLE_COUNT = 15; // 气泡爆炸时的粒子数量
const PARTICLE_LIFETIME = 1000; // 粒子生命周期（毫秒）