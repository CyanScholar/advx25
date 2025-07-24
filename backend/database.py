from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, backref
import datetime

Base = declarative_base()
engine = create_engine("sqlite:///./data.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

class DataObject(Base):
    __tablename__ = "data_objects"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String)
    content = Column(String)
    parent = Column(Integer, ForeignKey('data_objects.id'), nullable=True)
    # 关键：children 反向引用自身
    children = relationship(
        "DataObject",
        backref=backref('parent_obj', remote_side=[id]),
        lazy="dynamic"
    )
    create_time = Column(DateTime, default=datetime.datetime.utcnow)

    def __repr__(self):
        return f"<DataObject(id={self.id}, type={self.type}, content={self.content[:20]}, parent={self.parent}, create_time={self.create_time})>"

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 确保表结构已创建
Base.metadata.create_all(engine)
