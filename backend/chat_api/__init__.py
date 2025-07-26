"""
chat_api - 聊天API模块
提供多种AI聊天模型的统一接口
"""

# 导入各个聊天模型
from . import kimi
from . import minimax

# 为了兼容性，也可以直接导入函数
from .kimi import chat as kimi_chat
from .minimax import chat as minimax_chat

__all__ = ['kimi', 'minimax', 'kimi_chat', 'minimax_chat'] 