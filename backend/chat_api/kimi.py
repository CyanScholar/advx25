# agent_discover.py
# kimi
# d20fv36s1rhbpuv0tcvg
# sk-aAXy0GoM2Dejzp85raAWcsoS49tq3Qq4lHUj6HIzUCD4KmpP

from openai import OpenAI

client = OpenAI(
    api_key = "sk-aAXy0GoM2Dejzp85raAWcsoS49tq3Qq4lHUj6HIzUCD4KmpP",
    base_url = "https://api.moonshot.cn/v1",
)

def chat(messages: list, temperature: float = 0.6, max_tokens: int = 1000) -> str:
    """
    Kimi API 接入函数
    
    Args:
        messages: 对话消息列表
        temperature: 温度参数
        max_tokens: 最大token数
        
    Returns:
        AI回复内容
    """
    completion = client.chat.completions.create(
        model="kimi-k2-0711-preview",
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens
    )

    return completion.choices[0].message.content