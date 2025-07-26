#!/usr/bin/env python3
"""
测试API连接脚本
用于验证kimi和minimax API是否正常工作
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_minimax():
    """测试MiniMax API"""
    print("测试MiniMax API...")
    try:
        from chat_api import minimax
        
        messages = [
            {"role": "system", "content": "你是一个有用的助手。"},
            {"role": "user", "content": "你好"}
        ]
        
        response = minimax.chat(messages, temperature=0.1, max_tokens=100)
        print(f"MiniMax响应: {response}")
        return True
    except Exception as e:
        print(f"MiniMax API测试失败: {e}")
        return False

def test_kimi():
    """测试Kimi API"""
    print("测试Kimi API...")
    try:
        from chat_api import kimi
        
        messages = [
            {"role": "system", "content": "你是一个有用的助手。"},
            {"role": "user", "content": "你好"}
        ]
        
        response = kimi.chat(messages, temperature=0.6, max_tokens=100)
        print(f"Kimi响应: {response}")
        return True
    except Exception as e:
        print(f"Kimi API测试失败: {e}")
        return False

if __name__ == "__main__":
    print("开始API测试...")
    
    minimax_ok = test_minimax()
    kimi_ok = test_kimi()
    
    print("\n测试结果:")
    print(f"MiniMax: {'✅ 正常' if minimax_ok else '❌ 失败'}")
    print(f"Kimi: {'✅ 正常' if kimi_ok else '❌ 失败'}")
    
    if not minimax_ok and not kimi_ok:
        print("\n⚠️  所有API都失败，请检查:")
        print("1. API密钥是否有效")
        print("2. 网络连接是否正常")
        print("3. API服务是否可用") 