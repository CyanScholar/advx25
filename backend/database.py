from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, backref
import datetime

Base = declarative_base()
engine = create_engine("sqlite:///./data.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

class Thought(Base):
    __tablename__ = "thoughts"
    id = Column(Integer, primary_key=True, autoincrement=True)
    content = Column(String)
    parent = Column(Integer, ForeignKey('thoughts.id'), nullable=True)
    children = relationship(
        "Thought",
        backref=backref('parent_obj', remote_side=[id]),
        lazy="dynamic"
    )
    create_time = Column(DateTime, default=datetime.datetime.utcnow)
    def __repr__(self):
        return f"<Thought(id={self.id}, content={self.content[:20]}, parent={self.parent}, create_time={self.create_time})>"

class Solution(Base):
    __tablename__ = "solutions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    content = Column(String)
    parent = Column(Integer, ForeignKey('thoughts.id'), nullable=True)  # 关联 thought
    create_time = Column(DateTime, default=datetime.datetime.utcnow)
    def __repr__(self):
        return f"<Solution(id={self.id}, content={self.content[:20]}, parent={self.parent}, create_time={self.create_time})>"

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 确保表结构已创建
Base.metadata.create_all(engine)
