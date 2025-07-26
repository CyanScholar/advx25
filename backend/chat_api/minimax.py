import requests

group_id = "1948920855580905691"
api_key = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiLpmYbmmJ_lrociLCJVc2VyTmFtZSI6IumZhuaYn-WuhyIsIkFjY291bnQiOiIiLCJTdWJqZWN0SUQiOiIxOTQ4OTIwODU1NTg1MDk5OTk1IiwiUGhvbmUiOiIxODY4OTYxMTMzMCIsIkdyb3VwSUQiOiIxOTQ4OTIwODU1NTgwOTA1NjkxIiwiUGFnZU5hbWUiOiIiLCJNYWlsIjoiIiwiQ3JlYXRlVGltZSI6IjIwMjUtMDctMjYgMTY6MzY6NDgiLCJUb2tlblR5cGUiOjEsImlzcyI6Im1pbmltYXgifQ.MUKwPhFGtrdiQZNpZrJQn4ijnWT7zAx8kOW5_Y8zVMvaXB5Wq7KhhBvdYcFCzdlVCDc3d9w6GqBWWF7wia9lYbupVrlBIyhLjEfw5waD2LgWRYIVsf8O_0L584tBR3n5KcjELdQrArlzsh3bhR4SE00FDazDJ98uiuGHHVF2mHhmy9zMdUbqH6oRuzTkIPqKV_mXUatW66QRDLWSSLOEEUpXKfpql9IGUnKhVjeplRsb3Ce3LeDs7KLdfOG0F898uM0YyV8LRPfsW-HpU6DEnEgioibTigqdk8v8_A7qq8EucVMYU6eXsj2gv5EigFiY0KCSrYS9Hm_veJLEbEvMfg"

url = f"https://api.minimax.chat/v1/text/chatcompletion_v2?GroupId={group_id}"
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

def chat(messages: list, temperature: float = 0.1, max_tokens: int = 256) -> str:
    """
    MiniMax API 接入函数
    
    Args:
        messages: 对话消息列表
        temperature: 温度参数
        max_tokens: 最大token数
        
    Returns:
        AI回复内容
    """
    payload = {
        "model": "minimax-text-01",
        "messages": messages,
        "stream": False,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "top_p": 0.95
    }

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code == 200:
        response_data = response.json()
        return response_data["reply"]
    else:
        raise Exception(f"MiniMax API 请求失败: {response.status_code}, {response.text}")