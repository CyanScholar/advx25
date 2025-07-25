from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, backref
import datetime

Base = declarative_base()
engine = create_engine("sqlite:///./data.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

class Topic(Base):
    __tablename__ = "topics"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False)
    __table_args__ = (UniqueConstraint('name', name='uq_topic_name'),)
    def __repr__(self):
        return f"<Topic(id={self.id}, name={self.name})>"

class Thought(Base):
    __tablename__ = "thoughts"
    id = Column(Integer, primary_key=True, autoincrement=True)
    content = Column(String)
    parent = Column(Integer, ForeignKey('thoughts.id'), nullable=True)
    topic_name = Column(String, ForeignKey('topics.name'), nullable=True)
    connect = Column(String, nullable=True)  # 双向的字段
    children = relationship(
        "Thought",
        backref=backref('parent_obj', remote_side=[id]),
        lazy="dynamic"
    )
    create_time = Column(DateTime, default=datetime.datetime.utcnow)
    def __repr__(self):
        return f"<Thought(id={self.id}, content={self.content[:20]}, parent={self.parent}, topic_name={self.topic_name}, create_time={self.create_time})>"

class Solution(Base):
    __tablename__ = "solutions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    content = Column(String)
    parent = Column(Integer, ForeignKey('thoughts.id'), nullable=True)  # 关联 thought
    topic_name = Column(String, ForeignKey('topics.name'), nullable=True)
    connect = Column(String, nullable=True)  # 双向的字段
    create_time = Column(DateTime, default=datetime.datetime.utcnow)
    def __repr__(self):
        return f"<Solution(id={self.id}, content={self.content[:20]}, parent={self.parent}, topic_name={self.topic_name}, create_time={self.create_time})>"

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 确保表结构已创建
Base.metadata.create_all(engine)
