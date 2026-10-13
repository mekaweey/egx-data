import urllib.request
import json

url = "http://127.0.0.1:4000/v1/chat/completions"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer sk-litellm-proxy-key"
}

data = {
    "model": "gemini-flash",
    "messages": [
        {"role": "user", "content": "Say 'LiteLLM Proxy is running successfully!'"}
    ]
}

req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        print("Status:", resp.status)
        print("Response message:", res["choices"][0]["message"]["content"])
except Exception as e:
    if hasattr(e, "read"):
        print("Error body:", e.read().decode("utf-8"))
    print("Error:", e)

