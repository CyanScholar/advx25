# agent_discover.py
# d20fv36s1rhbpuv0tcvg
# sk-aAXy0GoM2Dejzp85raAWcsoS49tq3Qq4lHUj6HIzUCD4KmpP

from database import get_db, Solution, Thought
from sqlalchemy.orm import Session

def get_solutions(db: Session, topic_name: str = None):
    query = db.query(Solution)
    if topic_name:
        query = query.filter(Solution.topic_name == topic_name)
    return query.all()

def agent_solve_chat(user_id, topic_name, db: Session, user_history):
    solutions = get_solutions(db, topic_name)
    # 组装 prompt，结合 solutions 内容
    prompt = f"请对用户在主题“{topic_name}”下的所有解决方案进行总结，并给出具体建议。"
    ai_reply = call_llm_api(prompt, user_history)
    return ai_reply
