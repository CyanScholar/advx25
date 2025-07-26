# ocr.py
from tencentcloud.common import credential
from tencentcloud.ocr.v20181119 import ocr_client, models
import base64
import os
import re

# 你的腾讯云API密钥
TENCENT_SECRET_ID = os.getenv("TENCENT_SECRET_ID", "AKIDb5NTLyNk28zhEZfWny4zlS2RcdR1QcbM")
TENCENT_SECRET_KEY = os.getenv("TENCENT_SECRET_KEY", "c9XjfMp5cz9DF80nVEwYzKbmv00xkV3R")

def clean_text(text):
    """清理和优化OCR识别的文本"""
    if not text:
        return ""
    
    # 移除多余的空白字符
    text = re.sub(r'\s+', ' ', text.strip())
    
    # 移除特殊字符，保留中文、英文、数字、标点
    text = re.sub(r'[^\u4e00-\u9fff\w\s.,!?;:()（）]', '', text)
    
    # 处理换行符，将多个换行合并为单个空格
    text = re.sub(r'\n+', ' ', text)
    
    # 移除首尾空白
    text = text.strip()
    
    return text

def detect_language(text):
    """检测文本语言类型"""
    if not text:
        return "zh"
    
    # 统计中文字符数量
    chinese_chars = len(re.findall(r'[\u4e00-\u9fff]', text))
    # 统计英文字符数量
    english_chars = len(re.findall(r'[a-zA-Z]', text))
    
    if chinese_chars > english_chars:
        return "zh"
    elif english_chars > chinese_chars:
        return "en"
    else:
        return "auto"  # 混合语言

def tencent_ocr_high_precision(image_bytes):
    print("调用腾讯OCR")
    cred = credential.Credential(TENCENT_SECRET_ID, TENCENT_SECRET_KEY)
    client = ocr_client.OcrClient(cred, "ap-beijing")
    
    # 使用高精度OCR
    req = models.GeneralAccurateOCRRequest()
    req.ImageBase64 = base64.b64encode(image_bytes).decode()
    
    try:
        resp = client.GeneralAccurateOCR(req)
        
        # 解析返回的文字
        result = []
        for item in resp.TextDetections:
            detected_text = item.DetectedText
            if detected_text:
                result.append(detected_text)
        
        # 合并所有文本
        combined_text = " ".join(result)
        
        # 清理文本
        cleaned_text = clean_text(combined_text)
        
        print(f"OCR识别结果: {cleaned_text}")
        
        if not cleaned_text:
            return "未识别到文字"
        
        return cleaned_text
        
    except Exception as e:
        print(f"OCR识别失败: {str(e)}")
        return "OCR识别失败"
