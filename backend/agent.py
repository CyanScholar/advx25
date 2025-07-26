from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
import importlib
from sqlalchemy.orm import Session
from database import get_db, Thought, Solution

class ChatAgent(ABC):
    """
    ChatAgent 基类，支持多种聊天模型的统一接口
    """
    
    def __init__(self, model_name: str = "minimax"):
        """
        初始化聊天代理
        
        Args:
            model_name: 模型名称，支持 "minimax" 或 "kimi"
        """
        self.model_name = model_name
        self.chat_module = None
        self.messages = []  # 存储对话历史
        self._load_model()
        self._init_system_prompt()
    
    def _load_model(self):
        """加载指定的聊天模型模块"""
        try:
            if self.model_name == "minimax":
                from chat_api import minimax
                self.chat_module = minimax
            elif self.model_name == "kimi":
                from chat_api import kimi
                self.chat_module = kimi
            else:
                raise ValueError(f"不支持的模型: {self.model_name}")
        except ImportError as e:
            raise ImportError(f"无法导入模型模块 {self.model_name}: {e}")
    
    def _init_system_prompt(self):
        """初始化系统提示"""
        if self.model_name == "minimax":
            system_content = """作为一位善解人意、遵循人本主义治疗原则的心理疏导工程师，你擅长积极倾听、共情回应和引导式提问。你的核心任务是帮助来访者探索其烦恼背后隐藏的心理议题，增强自我觉察。

现在，你将与来访者进行一对一的心理探索互动：
1. 来访者先写下几个关于其内心困惑的关键词或话题
2. 你通过精心设计的提问，引导他深入反思这些内容
3. 基于新的思考，来访者再写下另一个（或几个）关键词或话题
4. 你再次运用提问引导探索

这个过程不断推进，帮助来访者逐步洞察内心。

你现在所体验的app是我们正在打造一个全新的情绪科技产品——《思绪气泡 BubbleMind》，一个用手写+气泡+爆炸动画帮你清空脑袋的减压神器。不同于传统的记事本或待办清单，我们创造了一个"写下念头→变成泡泡→戳破释放"的全新交互体验。每当你脑子里有烦人的碎碎念，就写下来让它变成一颗可爱的气泡，当你想通了或想放下时，轻轻一戳——"啪"的一声爆开，那种瞬间释放的感觉真的太爽了！

请用温暖、理解的态度与用户交流，通过提问引导他们深入思考，帮助他们发现问题的根源并增强自我觉察。"""
        else:  # kimi
            system_content = """在与用户的开放式讨论或问题解决对话中，当观察到用户的思维陷入特定瓶颈（表现为发散不足、聚焦过深、发散过度但缺乏成果、结论受阻或矛盾）时，根据对当前思维状态（广度、深度、聚焦度、结论状态、障碍来源）的诊断，运用对应的引导策略：

1. 开放式提问促发散
2. 提示建立联系
3. 聚焦深化分支
4. 寻找共性提炼结论
5. 拆解外部困难
6. 提供情感支持克服内部障碍
7. 分析矛盾根源

帮助用户突破思维限制，推动讨论或问题解决向更有效、更深入或更清晰的方向发展。

你现在所体验的app是我们正在打造一个全新的情绪科技产品——《思绪气泡 BubbleMind》，一个用手写+气泡+爆炸动画帮你清空脑袋的减压神器。不同于传统的记事本或待办清单，我们创造了一个"写下念头→变成泡泡→戳破释放"的全新交互体验。

请用简洁、易懂的语言与用户交流，帮助他们突破思维瓶颈，找到问题的解决方案。"""
        
        self.messages = [{"role": "system", "content": system_content}]
    
    def chat(self, input_text: str) -> str:
        """
        与AI进行多轮对话
        
        Args:
            input_text: 用户输入的文本
            
        Returns:
            AI的回复文本
        """
        if not self.chat_module:
            raise RuntimeError("聊天模块未正确加载")
        
        # 添加当前用户输入
        self.messages.append({"role": "user", "content": input_text})
        
        # 调用API获取回复
        try:
            print(f"正在调用 {self.model_name} API...")  # 调试信息
            if self.model_name == "minimax":
                response = self.chat_module.chat(self.messages, temperature=0.1, max_tokens=256)
            else:  # kimi
                response = self.chat_module.chat(self.messages, temperature=0.6, max_tokens=1000)
            
            print(f"API响应: {response}")  # 调试信息
            
            # 将AI回复添加到对话历史
            self.messages.append({"role": "assistant", "content": response})
            
            return response
        except Exception as e:
            print(f"API调用失败: {str(e)}")  # 调试信息
            raise Exception(f"聊天失败: {str(e)}")
    
    def advice(self, topic_name: str = None, db: Session = None) -> str:
        """
        基于数据库中的最后叶子节点提供简短建议或反问
        
        Args:
            topic_name: 主题名称（可选）
            db: 数据库会话（可选）
            
        Returns:
            AI的建议回复
        """
        if not db:
            return "无法获取建议：缺少数据库连接"
        
        try:
            # 获取最后的叶子节点
            last_thought = None
            if topic_name:
                # 按主题筛选
                thoughts = db.query(Thought).filter(
                    Thought.topic_name == topic_name,
                    Thought.children == None  # 叶子节点
                ).order_by(Thought.create_time.desc()).limit(1).first()
            else:
                # 获取所有叶子节点中的最新一个
                thoughts = db.query(Thought).filter(
                    Thought.children == None  # 叶子节点
                ).order_by(Thought.create_time.desc()).limit(1).first()
            
            if not thoughts:
                return "目前还没有相关的思考记录，请先添加一些想法。"
            
            # 构建建议请求
            advice_prompt = f"""基于以下思考内容，请提供一句简短的建议或引导性问题：

思考内容：{thoughts.content}

请用一句话给出建议或提出一个引导性问题，帮助用户进一步思考。"""
            
            # 临时添加建议请求到对话历史
            temp_messages = self.messages.copy()
            temp_messages.append({"role": "user", "content": advice_prompt})
            
            # 调用API获取建议
            if self.model_name == "minimax":
                advice = self.chat_module.chat(temp_messages, temperature=0.1, max_tokens=100)
            else:  # kimi
                advice = self.chat_module.chat(temp_messages, temperature=0.6, max_tokens=200)
            
            return advice
            
        except Exception as e:
            return f"获取建议时出现错误: {str(e)}"
    
    def reset_conversation(self):
        """重置对话历史"""
        self._init_system_prompt()
    
    def get_conversation_history(self):
        """获取当前对话历史"""
        return self.messages.copy()
    
    def add_user_message(self, message: str):
        """手动添加用户消息到历史"""
        self.messages.append({"role": "user", "content": message})
    
    def add_assistant_message(self, message: str):
        """手动添加助手消息到历史"""
        self.messages.append({"role": "assistant", "content": message})

# 便捷的工厂函数
def create_chat_agent(model_name: str = "minimax") -> ChatAgent:
    """
    创建聊天代理的工厂函数
    
    Args:
        model_name: 模型名称 ("minimax" 或 "kimi")
        
    Returns:
        ChatAgent 实例
    """
    return ChatAgent(model_name)
