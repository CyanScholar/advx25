from fastapi import FastAPI, UploadFile, File, Depends, Body, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database import get_db, Thought, Solution, Topic
from ocr import tencent_ocr_high_precision
import datetime
import shutil
"""
运行命令：
    uvicorn server:app --host 0.0.0.0 --port 9999
"""
#todo: 使用uv或者requrement.txt或者setup.py管理依赖

def get_or_create_topic(db, topic_name):
    if not topic_name:
        return None
    topic = db.query(Topic).filter(Topic.name == topic_name).first()
    if not topic:
        topic = Topic(name=topic_name)
        db.add(topic)
        db.commit()
        db.refresh(topic)
    return topic

app = FastAPI()

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

@app.post("/post")
async def create_node(
    data: dict = Body(...),
    db: Session = Depends(get_db)
):
    node_type = data.get("type", "thought")
    topic_name = data.get("topic_name")
    if topic_name:
        get_or_create_topic(db, topic_name)
    if node_type == "thought":
        obj = Thought(
            content=data.get("content", ""),
            parent=data.get("parent"),
            topic_name=topic_name,
            create_time=data.get("create_time", datetime.datetime.utcnow())
        )
    elif node_type == "solution":
        obj = Solution(
            content=data.get("content", ""),
            parent=data.get("parent"),
            topic_name=topic_name,
            create_time=data.get("create_time", datetime.datetime.utcnow())
        )
    else:
        return JSONResponse(content={"error": "type必须为'thought'或'solution'"}, status_code=400)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return {
        "id": obj.id,
        "content": obj.content,
        "type": node_type,
        "parent": obj.parent,
        "topic_name": obj.topic_name,
        "create_time": obj.create_time.isoformat()
    }

@app.post("/clear")
async def clear_db(db: Session = Depends(get_db)):
    db.query(Thought).delete()
    db.query(Solution).delete()
    db.commit()
    return {"msg": "数据库已清空"}

# 递归删除thought及其无后继祖先
def recursive_delete_thought(node, db, deleted_ids):
    parent_id = node.parent
    db.delete(node)
    db.commit()
    deleted_ids.append(node.id)
    if parent_id is not None:
        parent = db.query(Thought).filter(Thought.id == parent_id).first()
        if parent and parent.children.count() == 0:
            recursive_delete_thought(parent, db, deleted_ids)

@app.post("/delete")
async def delete_thought(
    data: dict = Body(...),
    db: Session = Depends(get_db)
):
    node = None
    if "id" in data:
        node = db.query(Thought).filter(Thought.id == data["id"]).first()
    elif "content" in data:
        node = db.query(Thought).filter(Thought.content == data["content"]).first()
    if not node:
        return JSONResponse(content={"error": "节点不存在"}, status_code=404)
    if node.children.count() > 0:
        return JSONResponse(content={"error": "该节点有子节点，不能直接删除"}, status_code=400)
    deleted_ids = []
    recursive_delete_thought(node, db, deleted_ids)
    return {"msg": f"节点及部分祖先已被递归删除", "deleted_ids": deleted_ids}

@app.post("/archive")
async def archive_solution(
    data: dict = Body(...),
    db: Session = Depends(get_db)
):
    node = None
    if "id" in data:
        node = db.query(Solution).filter(Solution.id == data["id"]).first()
    elif "content" in data:
        node = db.query(Solution).filter(Solution.content == data["content"]).first()
    if not node:
        return JSONResponse(content={"error": "节点不存在"}, status_code=404)
    parent_id = node.parent
    node.parent = None
    db.commit()
    deleted_ids = []
    # 归档后递归消除 parent thought
    if parent_id is not None:
        parent = db.query(Thought).filter(Thought.id == parent_id).first()
        if parent and parent.children.count() == 0 and db.query(Solution).filter(Solution.parent == parent_id).count() == 0:
            recursive_delete_thought(parent, db, deleted_ids)
    return {"msg": f"solution节点已归档", "id": node.id, "deleted_thought_ids": deleted_ids}