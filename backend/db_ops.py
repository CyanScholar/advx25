from database import Thought, Solution, Topic
from sqlalchemy.orm import Session
import json

# 全局变量用于自动消除开关
AUTO_ELIMINATE = True

def set_auto_eliminate(db: Session, value: bool):
    global AUTO_ELIMINATE
    AUTO_ELIMINATE = value

def get_auto_eliminate(db: Session):
    global AUTO_ELIMINATE
    return AUTO_ELIMINATE

# 通用节点查找
def get_node_by_id_or_name(db: Session, node_type: str, id=None, name=None):
    Model = Thought if node_type == "thought" else Solution
    if id is not None:
        return db.query(Model).filter(Model.id == id).first()
    elif name is not None:
        return db.query(Model).filter(Model.content == name).first()
    return None

# 创建节点
def create_node(db: Session, node_type: str, content: str, parent=None, topic_name=None, connect=None, create_time=None):
    Model = Thought if node_type == "thought" else Solution
    node = Model(
        content=content,
        parent=parent,
        topic_name=topic_name,
        connect=json.dumps(connect or []),
        create_time=create_time or None
    )
    db.add(node)
    db.commit()
    db.refresh(node)
    return node

# 更新节点
def update_node(db: Session, node_type: str, id: int, **kwargs):
    node = get_node_by_id_or_name(db, node_type, id=id)
    if not node:
        return None
    for k, v in kwargs.items():
        if hasattr(node, k):
            setattr(node, k, v)
    db.commit()
    db.refresh(node)
    return node

# 删除节点
def delete_node(db: Session, node_type: str, id: int):
    node = get_node_by_id_or_name(db, node_type, id=id)
    if not node:
        return False
    db.delete(node)
    db.commit()
    return True

# 获取 connect 的节点
def get_connect_nodes(db: Session, node_type: str, id: int):
    node = get_node_by_id_or_name(db, node_type, id=id)
    if not node or not node.connect:
        return []
    ids = json.loads(node.connect)
    Model = Thought if node_type == "thought" else Solution
    return db.query(Model).filter(Model.id.in_(ids)).all()

def add_connect(db: Session, node_id: int, connect_ids: list, node_type="thought"):
    # 支持 thought/solution
    Model = Thought if node_type == "thought" else Solution
    node = db.query(Model).filter(Model.id == node_id).first()
    if not node:
        return None
    # connect 字段为 JSON 字符串
    current = set(json.loads(node.connect or "[]"))
    current.update(connect_ids)
    node.connect = json.dumps(list(current))
    db.commit()
    # 双向维护
    for cid in connect_ids:
        # 根据node_type查询对应的表
        other = db.query(Model).filter(Model.id == cid).first()
        if other:
            other_conn = set(json.loads(other.connect or "[]"))
            other_conn.add(node_id)
            other.connect = json.dumps(list(other_conn))
    db.commit()
    return node

def remove_connect(db: Session, node_id: int, connect_ids: list, node_type="thought"):
    # 断开连接，双向
    Model = Thought if node_type == "thought" else Solution
    node = db.query(Model).filter(Model.id == node_id).first()
    if not node:
        return None
    current = set(json.loads(node.connect or "[]"))
    current -= set(connect_ids)
    node.connect = json.dumps(list(current))
    db.commit()
    # 双向维护
    for cid in connect_ids:
        # 根据node_type查询对应的表
        other = db.query(Model).filter(Model.id == cid).first()
        if other:
            other_conn = set(json.loads(other.connect or "[]"))
            other_conn.discard(node_id)
            other.connect = json.dumps(list(other_conn))
    db.commit()
    return node

# 其它增删查操作...
