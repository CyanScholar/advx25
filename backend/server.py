from fastapi import FastAPI, UploadFile, File, Depends, Body, Form, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database import get_db, Thought, Solution, Topic
from ocr import tencent_ocr_high_precision
from agent import ChatAgent, create_chat_agent
import datetime
import shutil
import db_ops
from fastapi.middleware.cors import CORSMiddleware


def get_or_create_agent():
    """获取或创建全局 agent 实例"""
    global global_agent, current_model_api
    if global_agent is None or global_agent.model_name != current_model_api:
        global_agent = create_chat_agent(model_name=current_model_api)
    return global_agent
"""
运行命令：
    uvicorn server:app --host 0.0.0.0 --port 9999
"""

app = FastAPI()

# 全局自动消除开关
auto_eliminate = True

# 先清空数据库，避免重复创建
@app.on_event("startup")
async def startup_event():
    """启动时清空数据库"""
    try:
        db = next(get_db())
        db.query(Thought).delete()
        db.query(Solution).delete()
        db.query(Topic).delete()
        db.commit()
        print("数据库已清空")
    except Exception as e:
        print(f"清空数据库失败: {e}")

# 服务关闭时清空数据库和AI对话session
@app.on_event("shutdown")
async def shutdown_event():
    global conversation_history
    try:
        db = next(get_db())
        db.query(Thought).delete()
        db.query(Solution).delete()
        db.query(Topic).delete()
        db.commit()
        conversation_history.clear()
        print("[SHUTDOWN] 数据库和AI对话session已清空")
    except Exception as e:
        print(f"[SHUTDOWN] 清空失败: {e}")

# ===================== 节点更新接口 =====================
@app.post("/update")
async def update_node(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    更新节点类型
    - id: 节点id
    - type: 新类型 ("thought", "solution", "topic")
    - content: 节点内容
    """
    try:
        body = await request.json()
        node_id = body.get("id")
        new_type = body.get("type")
        content = body.get("content")
        
        if not node_id or not new_type or not content:
            return JSONResponse(
                content={"error": "id、type、content都不能为空"},
                status_code=400
            )
        
        if new_type not in ["thought", "solution", "topic"]:
            return JSONResponse(
                content={"error": "type必须是'thought'、'solution'或'topic'"},
                status_code=400
            )
        
        # 查找并更新节点
        if new_type == "solution":
            # 更新为solution
            thought = db.query(Thought).filter(Thought.id == node_id).first()
            if thought:
                # 创建新的solution
                solution = Solution(
                    content=content,
                    parent=thought.parent,
                    topic_name=thought.topic_name,
                    create_time=datetime.datetime.utcnow()
                )
                db.add(solution)
                # 删除原thought
                db.delete(thought)
                db.commit()
                return {"msg": "节点已更新为solution", "id": solution.id}
        elif new_type == "topic":
            # 更新为topic
            thought = db.query(Thought).filter(Thought.id == node_id).first()
            solution = db.query(Solution).filter(Solution.id == node_id).first()
            
            if thought:
                # 从thought更新为topic
                topic = Topic(name=content)
                db.add(topic)
                db.delete(thought)
                db.commit()
                return {"msg": "节点已更新为topic", "id": topic.id}
            elif solution:
                # 从solution更新为topic
                topic = Topic(name=content)
                db.add(topic)
                db.delete(solution)
                db.commit()
                return {"msg": "节点已更新为topic", "id": topic.id}
        else:
            # 更新为thought
            solution = db.query(Solution).filter(Solution.id == node_id).first()
            topic = db.query(Topic).filter(Topic.id == node_id).first()
            
            if solution:
                # 从solution更新为thought
                thought = Thought(
                    content=content,
                    parent=solution.parent,
                    topic_name=solution.topic_name,
                    create_time=datetime.datetime.utcnow()
                )
                db.add(thought)
                db.delete(solution)
                db.commit()
                return {"msg": "节点已更新为thought", "id": thought.id}
            elif topic:
                # 从topic更新为thought
                thought = Thought(
                    content=content,
                    parent=None,
                    topic_name=content,
                    create_time=datetime.datetime.utcnow()
                )
                db.add(thought)
                db.delete(topic)
                db.commit()
                return {"msg": "节点已更新为thought", "id": thought.id}
        
        return JSONResponse(
            content={"error": "节点不存在"},
            status_code=404
        )
        
    except Exception as e:
        return JSONResponse(
            content={"error": f"更新失败: {str(e)}"},
            status_code=500
        )

@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "healthy", "message": "ADVX API 服务正常运行"}

@app.get("/ping")
async def ping():
    """ping端点，用于前端健康检查"""
    return {"status": "ok", "message": "pong"}

# ===================== 数据查询接口 =====================
@app.get("/thoughts")
async def get_thoughts(db: Session = Depends(get_db)):
    """获取所有thoughts"""
    thoughts = db.query(Thought).all()
    return [
        {
            "id": thought.id,
            "content": thought.content,
            "parent": thought.parent,
            "topic_name": thought.topic_name,
            "create_time": thought.create_time.isoformat() if thought.create_time else None
        }
        for thought in thoughts
    ]

@app.get("/solutions")
async def get_solutions(db: Session = Depends(get_db)):
    """获取所有solutions"""
    solutions = db.query(Solution).all()
    return [
        {
            "id": solution.id,
            "content": solution.content,
            "parent": solution.parent,
            "topic_name": solution.topic_name,
            "create_time": solution.create_time.isoformat() if solution.create_time else None
        }
        for solution in solutions
    ]

# ===================== 主题管理 =====================
def get_or_create_topic(db, topic_name):
    """确保 topic_name 在 topics 表中存在，不存在则自动创建"""
    if not topic_name:
        return None
    topic = db.query(Topic).filter(Topic.name == topic_name).first()
    if not topic:
        topic = Topic(name=topic_name)
        db.add(topic)
        db.commit()
        db.refresh(topic)
    return topic

@app.post("/upload")
async def upload(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # 保存文件到 uploads 目录
    with open(f"uploads/{file.filename}", "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return JSONResponse(content={"msg": "上传成功", "filename": file.filename})

@app.post("/ocr")
async def ocr_api(
    file: UploadFile = File(...),
    type: str = Form(...),
    topic_name: str = Form(None),
    db: Session = Depends(get_db)
):
    if type not in ("thought", "solution"):
        return JSONResponse(content={"error": "type必须为'thought'或'solution'"}, status_code=400)
    if topic_name:
        get_or_create_topic(db, topic_name)
    image_bytes = await file.read()
    try:
        text = tencent_ocr_high_precision(image_bytes)
        if type == "thought":
            obj = Thought(
                content=text,
                parent=None,
                topic_name=topic_name,
                create_time=datetime.datetime.utcnow()
            )
        else:
            obj = Solution(
                content=text,
                parent=None,
                topic_name=topic_name,
                create_time=datetime.datetime.utcnow()
            )
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return JSONResponse(content={"text": text, "id": obj.id, "topic_name": obj.topic_name})
    except Exception as e:
        import traceback; traceback.print_exc()
        return JSONResponse(content={"error": str(e)}, status_code=500)

# ===================== 节点创建 =====================
@app.post("/post")
async def create_node(
    data: dict = Body(...),
    db: Session = Depends(get_db)
):
    """
    新增思绪/解决方案节点。
    - 支持 parent 用 name 或 id 指定
    - connect 字段仅在传入时才处理，且为双向
    - topic_name 自动写入 topics 表
    """
    node_type = data.get("type", "thought")
    topic_name = data.get("topic_name")
    if topic_name:
        get_or_create_topic(db, topic_name)
    # 支持 name 查询 parent
    parent = data.get("parent")
    if isinstance(parent, str):
        parent_node = db_ops.get_node_by_id_or_name(db, "thought", name=parent)
        parent = parent_node.id if parent_node else None
    # 创建节点（不传connect，避免无效参数）
    node = db_ops.create_node(
        db,
        node_type=node_type,
        content=data.get("content", ""),
        parent=parent,
        topic_name=topic_name,
        connect=None,
        create_time=data.get("create_time")
    )
    # 仅当传入 connect 时，单独处理，支持 name/id
    connect = data.get("connect")
    if connect and isinstance(connect, list):
        connect_ids = []
        for c in connect:
            if isinstance(c, int):
                connect_ids.append(c)
            elif isinstance(c, str):
                other = db_ops.get_node_by_id_or_name(db, "thought", name=c)
                if other:
                    connect_ids.append(other.id)
        if connect_ids:
            db_ops.add_connect(db, node.id, connect_ids, node_type)
    return {
        "id": node.id,
        "content": node.content,
        "type": node_type,
        "parent": node.parent,
        "topic_name": node.topic_name,
        "connect": node.connect,
        "create_time": node.create_time.isoformat()
    }

# ===================== 连接管理 =====================
@app.post("/connect")
async def connect_nodes(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    建立节点间的 connect 关系（双向）。
    - node_id: 当前节点id
    - connect_ids: 需连接的节点id列表
    - node_type: "thought" 或 "solution"
    """
    try:
        # 获取JSON body中的参数
        body = await request.json()
        node_id = body.get("node_id")
        connect_ids = body.get("connect_ids", [])
        node_type = body.get("node_type", "thought")
        
        if not node_id:
            return JSONResponse(
                content={"error": "node_id不能为空"},
                status_code=400
            )
        
        node = db_ops.add_connect(db, node_id, connect_ids, node_type)
        return {"msg": "连接已建立", "node": node.id}
    except Exception as e:
        return JSONResponse(
            content={"error": f"连接失败: {str(e)}"},
            status_code=500
        )

@app.post("/disconnect")
async def disconnect_nodes(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    断开节点间的 connect 关系（双向）。
    - node_id: 当前节点id
    - connect_ids: 需断开的节点id列表
    - node_type: "thought" 或 "solution"
    """
    try:
        # 获取JSON body中的参数
        body = await request.json()
        node_id = body.get("node_id")
        connect_ids = body.get("connect_ids", [])
        node_type = body.get("node_type", "thought")
        
        if not node_id:
            return JSONResponse(
                content={"error": "node_id不能为空"},
                status_code=400
            )
        
        node = db_ops.remove_connect(db, node_id, connect_ids, node_type)
        return {"msg": "连接已断开", "node": node.id}
    except Exception as e:
        return JSONResponse(
            content={"error": f"断开连接失败: {str(e)}"},
            status_code=500
        )

# ===================== 自动消除开关 =====================
@app.post("/auto_eliminate")
async def set_auto_eliminate(request: Request):
    """
    设置自动递归消除开关。
    """
    global auto_eliminate
    value = None
    if "value" in request.query_params:
        value = request.query_params["value"]
    elif request.headers.get("content-type", "").startswith("application/x-www-form-urlencoded"):
        form = await request.form()
        value = form.get("value")
    else:
        try:
            data = await request.json()
            value = data.get("value")
        except Exception:
            pass
    if isinstance(value, str):
        value = value.lower() in ("1", "true", "yes", "on")
    elif value is None:
        value = True
    auto_eliminate = value
    return {"code": 0, "msg": f'自动消除已{"开启" if value else "关闭"}', "data": {"auto_eliminate": auto_eliminate}}

# ===================== 清空数据库 =====================
@app.post("/clear")
async def clear_db(db: Session = Depends(get_db)):
    """
    一键清空 thoughts 和 solutions 表。
    """
    db.query(Thought).delete()
    db.query(Solution).delete()
    db.query(Topic).delete()
    db.commit()
    return {"msg": "数据库已清空"}

# ===================== 递归消除/删除 =====================
@app.post("/delete")
async def delete_thought(
    data: dict = Body(...),
    db: Session = Depends(get_db)
):
    """
    删除思绪节点（thought），支持递归消除。
    - id/content: 指定节点
    """
    print(f"[DELETE] 收到请求: {data}")
    node = None
    
    # 优先通过id查找
    if "id" in data:
        node = db.query(Thought).filter(Thought.id == data["id"]).first()
        print(f"[DELETE] 通过id {data['id']} 查找Thought: {'找到' if node else '未找到'}")
    
    # 如果通过id没找到，尝试通过content查找
    if not node and "content" in data:
        node = db.query(Thought).filter(Thought.content == data["content"]).first()
        print(f"[DELETE] 通过content '{data['content']}' 查找Thought: {'找到' if node else '未找到'}")
    
    if not node:
        # 打印所有Thought节点信息
        all_thoughts = db.query(Thought).all()
        print(f"[DELETE] 节点未找到，当前所有Thought: {[(t.id, t.content[:20]) for t in all_thoughts]}")
        return {"code": 1, "msg": "节点不存在", "data": {}}
    
    print(f"[DELETE] 找到节点: id={node.id}, content='{node.content}'")
    
    if node.children.count() > 0:
        return {"code": 2, "msg": "该节点有子节点，不能直接删除", "data": {}}
    
    deleted = []
    def _eliminate(n):
        parent_id = n.parent
        deleted.append({"id": n.id, "content": n.content})
        db.delete(n)
        db.commit()
        if auto_eliminate:
            if parent_id is not None:
                parent = db.query(Thought).filter(Thought.id == parent_id).first()
                if parent and parent.children.count() == 0:
                    _eliminate(parent)
    _eliminate(node)
    return {"code": 0, "msg": "节点及部分祖先已被递归删除", "data": {"deleted": deleted}}

# ===================== 归档 solution 节点 =====================
@app.post("/archive")
async def archive_solution(
    data: dict = Body(...),
    db: Session = Depends(get_db)
):
    """
    归档 solution 节点，断开与 parent thought 的关系，并可递归消除。
    - id/content: 指定 solution 节点
    """
    print(f"[ARCHIVE] 收到请求: {data}")
    node = None
    
    # 优先通过id查找
    if "id" in data:
        node = db.query(Solution).filter(Solution.id == data["id"]).first()
        print(f"[ARCHIVE] 通过id {data['id']} 查找Solution: {'找到' if node else '未找到'}")
    
    # 如果通过id没找到，尝试通过content查找
    if not node and "content" in data:
        node = db.query(Solution).filter(Solution.content == data["content"]).first()
        print(f"[ARCHIVE] 通过content '{data['content']}' 查找Solution: {'找到' if node else '未找到'}")
    
    if not node:
        # 打印所有Solution节点信息
        all_solutions = db.query(Solution).all()
        print(f"[ARCHIVE] 节点未找到，当前所有Solution: {[(s.id, s.content[:20]) for s in all_solutions]}")
        return {"code": 1, "msg": "节点不存在", "data": {}}
    
    print(f"[ARCHIVE] 找到节点: id={node.id}, content='{node.content}'")
    
    parent_id = node.parent
    node.parent = None
    db.commit()
    deleted = []
    if auto_eliminate:
        if parent_id is not None:
            parent = db.query(Thought).filter(Thought.id == parent_id).first()
            if parent and parent.children.count() == 0 and db.query(Solution).filter(Solution.parent == parent_id).count() == 0:
                def _eliminate(n):
                    pid = n.parent
                    deleted.append({"id": n.id, "content": n.content})
                    db.delete(n)
                    db.commit()
                    if pid is not None:
                        p = db.query(Thought).filter(Thought.id == pid).first()
                        if p and p.children.count() == 0:
                            _eliminate(p)
                _eliminate(parent)
    return {"code": 0, "msg": "solution节点已归档", "data": {"id": node.id, "deleted": deleted}}


# 全局变量管理 agent session
current_model_api = "kimi"  # 当前选择的模型API
global_agent = None  # 全局 agent 实例
conversation_history = []  # 存储对话历史

@app.post("/agent/advice")
async def advice_endpoint(
    request: Request
):
    """
    获取AI建议的接口，基于数据库中的最后叶子节点
    
    Args:
        topic_name: 主题名称（可选，通过JSON body传递）
    """
    try:
        # 获取请求体中的topic_name
        body = await request.json()
        topic_name = body.get("topic_name") if body else None
        
        # 获取全局 agent 实例
        agent = get_or_create_agent()
        
        # 获取数据库会话
        db = next(get_db())
        
        # 获取建议
        advice_text = agent.advice(topic_name=topic_name, db=db)
        
        # 确保返回正确的格式
        return {"reply": advice_text}
    except Exception as e:
        return JSONResponse(
            content={"error": f"获取建议失败: {str(e)}"},
            status_code=500
        )

@app.post("/agent/chat")
async def chat_endpoint(
    request: Request
):
    """
    与AI进行对话的接口
    
    Args:
        input_text: 用户输入的文本（通过JSON body传递）
    """
    try:
        global conversation_history
        
        # 获取请求体中的input_text
        body = await request.json()
        input_text = body.get("input_text") if body else ""
        
        if not input_text:
            return JSONResponse(
                content={"error": "input_text不能为空"},
                status_code=400
            )
        
        # 获取全局 agent 实例
        agent = get_or_create_agent()
        
        # 进行对话
        reply = agent.chat(input_text)
        
        # 更新对话历史
        conversation_history.append({"user": input_text, "assistant": reply})
        
        return {"reply": reply}
    except Exception as e:
        return JSONResponse(
            content={"error": f"对话失败: {str(e)}"},
            status_code=500
        )

@app.post("/agent/set_model")
async def set_model_api(
    model_api: str = Body(...)
):
    """
    设置当前使用的模型API
    
    Args:
        model_api: 模型API名称 ("minimax" 或 "kimi")
    """
    global current_model_api, global_agent
    
    if model_api not in ["minimax", "kimi"]:
        return JSONResponse(
            content={"error": "不支持的模型API"},
            status_code=400
        )
    
    current_model_api = model_api
    
    # 强制重新创建 agent 实例，因为模型改变了
    global_agent = None
    
    return {"message": f"模型API已切换到: {model_api}"}

@app.get("/agent/current_model")
async def get_current_model():
    """
    获取当前使用的模型API
    """
    global current_model_api
    return {"model_api": current_model_api}

@app.post("/agent/reset_session")
async def reset_session():
    """
    重置对话会话
    """
    global conversation_history, global_agent
    
    # 清空对话历史
    conversation_history.clear()
    
    # 重置全局 agent 的对话历史
    if global_agent:
        global_agent.reset_conversation()
    
    return {"message": "对话会话已重置"}

@app.get("/agent/session_info")
async def get_session_info():
    """
    获取会话信息
    """
    global conversation_history, current_model_api, global_agent
    
    history_count = len(conversation_history)
    agent_exists = global_agent is not None
    
    return {
        "agent_exists": agent_exists,
        "history_count": history_count,
        "current_model_api": current_model_api
    }

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9999)