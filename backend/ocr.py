# ocr.py
from tencentcloud.common import credential
from tencentcloud.ocr.v20181119 import ocr_client, models
import base64
import os

# 你的腾讯云API密钥
TENCENT_SECRET_ID = os.getenv("TENCENT_SECRET_ID", "AKIDb5NTLyNk28zhEZfWny4zlS2RcdR1QcbM")
TENCENT_SECRET_KEY = os.getenv("TENCENT_SECRET_KEY", "c9XjfMp5cz9DF80nVEwYzKbmv00xkV3R")

def tencent_ocr_high_precision(image_bytes):
    print("调用腾讯OCR")
    cred = credential.Credential(TENCENT_SECRET_ID, TENCENT_SECRET_KEY)
    client = ocr_client.OcrClient(cred, "ap-beijing")  # 区域可选
    # 是否启用高精度
    req = models.GeneralAccurateOCRRequest()
    # req = models.GeneralBasicOCRRequest ()
    
    req.ImageBase64 = base64.b64encode(image_bytes).decode()
    # req.Language = "zh"
    resp = client.GeneralAccurateOCR(req)
    # 解析返回的文字
    result = []
    for item in resp.TextDetections:
        result.append(item.DetectedText)
    return "\n".join(result)