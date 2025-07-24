通过curl发送请求测试后端功能。
1. uvicorn server:app --host 0.0.0.0 --port 9999
2. cd test/scripts
3. 通过`. clear_db.sh`清楚数据库
4. 通过`. ocr.sh `往数据库增加数据；通过`. delete.sh`删除刚才添加的数据。
5. 通过`. batch_post.sh`增加实例数据；通过`. archive.sh`归档solution节点数据，进而清楚thought节点数据