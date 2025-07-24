from fastapi import FastAPI, UploadFile, File, Depends, Body
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database import get_db, DataObject
from ocr import tencent_ocr_high_precision
import datetime
import shutil
"""
运行命令：
    uvicorn server:app --host 0.0.0.0 --port 9999
"""

app = FastAPI()

@app.post("/upload")
async def upload(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # 保存文件
    with open(f"uploads/{file.filename}", "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    # 数据库操作示例
    # db.add_xxx(...)
    return JSONResponse(content={"msg": "上传成功", "filename": file.filename})

@app.post("/ocr")
async def ocr_api(file: UploadFile = File(...), db: Session = Depends(get_db)):
    image_bytes = await file.read()
    try:
        text = tencent_ocr_high_precision(image_bytes)
        # 新建数据库对象
        obj = DataObject(
            type="ocr",
            content=text,
            parent=None,
            create_time=datetime.datetime.utcnow()
        )
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return JSONResponse(content={"text": text, "id": obj.id})
    except Exception as e:
        import traceback; traceback.print_exc()
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/post")
async def create_node(
    content: str = Body(..., embed=True),
    type: str = Body(..., embed=True),
    parent: int = Body(None, embed=True),
    db: Session = Depends(get_db)
):
    # 类型校验
    if type not in ("thought", "solution"):
        return JSONResponse(content={"error": "type必须为'thought'或'solution'"}, status_code=400)
    # 构建节点
    obj = DataObject(
        type=type,
        content=content,
        parent=parent,
        create_time=datetime.datetime.utcnow()
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return {
        "id": obj.id,
        "content": obj.content,
        "type": obj.type,
        "parent": obj.parent,
        "create_time": obj.create_time.isoformat()
    }

# 删除节点
"""算法逻辑
1. 只要父节点没有其他子节点，就会被递归删除。
2. 返回值中会包含所有被删除的节点 id，便于前端同步状态。
3. 如果父节点还有其他子节点，则不会被删除，递归终止。
"""
@app.post("/delete")
async def delete_node(
    id: int = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    node = db.query(DataObject).filter(DataObject.id == id).first()
    if not node:
        return JSONResponse(content={"error": "节点不存在"}, status_code=404)
    # 检查是否有子节点
    if node.children.count() > 0:
        return JSONResponse(content={"error": "该节点有子节点，不能直接删除"}, status_code=400)
    
    # 记录被删除的节点id
    deleted_ids = []

    def recursive_delete_parents(n):
        parent_id = n.parent
        db.delete(n)
        db.commit()
        deleted_ids.append(n.id)
        if parent_id is not None:
            parent = db.query(DataObject).filter(DataObject.id == parent_id).first()
            if parent and parent.children.count() == 0:
                recursive_delete_parents(parent)

    recursive_delete_parents(node)
    return {"msg": f"节点 {id} 及其部分前置节点已被消除", "deleted_ids": deleted_ids}

#todo：@server.py 需要针对server的post和delete接口进行测试，我需要构建数据，并通过swift调用这些接口，并验证结果。
# 其他接口...