from fastapi import FastAPI, UploadFile, File, Depends, Body, Form, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database import get_db, Thought, Solution, Topic
from ocr import tencent_ocr_high_precision
import datetime
import shutil
import db_ops
"""
运行命令：
    uvicorn server:app --host 0.0.0.0 --port 9999
"""

app = FastAPI()

# 全局自动消除开关
auto_eliminate = True

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
async def connect_nodes(node_id: int, connect_ids: list, node_type: str, db: Session = Depends(get_db)):
    """
    建立节点间的 connect 关系（双向）。
    - node_id: 当前节点id
    - connect_ids: 需连接的节点id列表
    - node_type: "thought" 或 "solution"
    """
    node = db_ops.add_connect(db, node_id, connect_ids, node_type)
    return {"msg": "连接已建立", "node": node.id}

@app.post("/disconnect")
async def disconnect_nodes(node_id: int, connect_ids: list, node_type: str, db: Session = Depends(get_db)):
    """
    断开节点间的 connect 关系（双向）。
    """
    node = db_ops.remove_connect(db, node_id, connect_ids, node_type)
    return {"msg": "连接已断开", "node": node.id}

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
    node = None
    if "id" in data:
        node = db.query(Thought).filter(Thought.id == data["id"]).first()
    elif "content" in data:
        node = db.query(Thought).filter(Thought.content == data["content"]).first()
    if not node:
        return {"code": 1, "msg": "节点不存在", "data": {}}
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
    node = None
    if "id" in data:
        node = db.query(Solution).filter(Solution.id == data["id"]).first()
    elif "content" in data:
        node = db.query(Solution).filter(Solution.content == data["content"]).first()
    if not node:
        return {"code": 1, "msg": "节点不存在", "data": {}}
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

@app.post("/agent/guide")
async def guide_api(topic_name: str, user_id: str, user_history: list, db: Session = Depends(get_db)):
    reply = agent_guide_chat(user_id, topic_name, db, user_history)
    return {"reply": reply}

@app.post("/agent/solve")
async def solve_api(topic_name: str, user_id: str, user_history: list, db: Session = Depends(get_db)):
    reply = agent_solve_chat(user_id, topic_name, db, user_history)
    return {"reply": reply}

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=9999)