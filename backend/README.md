# Backend 使用说明

## 1. 环境准备

建议使用 Python 3.8 及以上版本。

### 1.1 创建虚拟环境
```bash
python3 -m venv env
source env/bin/activate
```

### 1.2 安装依赖
```bash
pip install -r requirements.txt
```

## 2. 启动服务

```bash
uvicorn server:app --host 0.0.0.0 --port 9999
```

## 3. 数据库说明
- 使用 SQLite，文件为 `backend/data.db`
- 三张主表：
  - `topics`：主题表，字段 `id`、`name`（唯一）
  - `thoughts`：思绪节点表，字段 `id`、`content`、`parent`、`topic_name`、`create_time`
  - `solutions`：解决方案节点表，字段 `id`、`content`、`parent`（指向 thought）、`topic_name`、`create_time`
- 所有节点通过 `topic_name` 关联到 `topics.name`

## 4. 常用接口

### 4.1 新增节点（/post）
- URL: `POST /post`
- JSON参数：
  - `content` (str): 节点内容
  - `type` (str): "thought" 或 "solution"
  - `parent` (int, 可选): 父节点id
  - `topic_name` (str): 主题名（自动创建topic）
- 返回：节点详细信息

### 4.2 OCR识别并入库（/ocr）
- URL: `POST /ocr`
- form-data参数：
  - `file` (file): 图片文件
  - `type` (str): "thought" 或 "solution"
  - `topic_name` (str): 主题名（自动创建topic）
- 返回：识别结果及节点id

### 4.3 删除思绪节点（/delete）
- URL: `POST /delete`
- JSON参数：`id` 或 `content`（仅支持thought节点）
- 逻辑：递归删除自身及所有无后继祖先节点

### 4.4 归档解决方案（/archive）
- URL: `POST /archive`
- JSON参数：`id` 或 `content`（仅支持solution节点）
- 逻辑：断开与thought的父子关系，并递归消除无后继祖先thought节点

### 4.5 清空数据库（/clear）
- URL: `POST /clear`
- 清空所有节点

## 5. 主题管理
- 所有节点通过 `topic_name` 关联主题。
- 新的 topic_name 会自动写入 topics 表。
- 可通过 SQL 查询所有主题及其下的节点。

## 6. 依赖包
- fastapi
- uvicorn
- sqlalchemy
- pillow
- tencentcloud-sdk-python

## 7. 常见问题
- **表结构变更后报错**：请删除 `data.db` 重新启动服务。
- **端口冲突**：请检查 9999 端口是否被占用。

## 8. 其它
- 推荐配合 test/scripts/ 下的批量测试脚本使用。
- 如需更多接口或批量操作，详见源码注释。 