# agent_guide.py
from database import get_db, Thought, Solution
from sqlalchemy.orm import Session

def get_thought_chains(db: Session, topic_name: str = None):
    # 获取所有思绪节点，按 topic_name 过滤
    query = db.query(Thought)
    if topic_name:
        query = query.filter(Thought.topic_name == topic_name)
    thoughts = query.all()
    # 构建 parent->children 映射，递归生成链条
    # ... 这里可实现链条遍历、闭环检测等
    return thoughts

def detect_stuck_or_loop(thoughts):
    # 检查链条过短、闭环、写不下去等
    # 返回结构分析结果
    pass

def agent_guide_chat(user_id, topic_name, db: Session, user_history):
    thoughts = get_thought_chains(db, topic_name)
    analysis = detect_stuck_or_loop(thoughts)
    # 组装 prompt，调用 LLM
    prompt = f"用户在主题“{topic_name}”下的思绪链条分析：{analysis}。请温和地引导用户继续思考。"
    # 这里调用 Kimi/Minimax 的 chat 接口
    ai_reply = call_llm_api(prompt, user_history)
    return ai_reply
