// OpenAI Models API 兼容接口
// 参考: https://platform.openai.com/docs/api-reference/models

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  // 处理OPTIONS请求
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  
  // 只允许GET请求
  if (req.method !== "GET") {
    return res.status(405).json({ error: { message: "Method not allowed", type: "invalid_request_error" } });
  }

  try {
    // 模拟OpenAI的模型列表响应
    const models = {
      "object": "list",
      "data": [
        {
          "id": "tts-1",
          "object": "model",
          "created": 1677610602,
          "owned_by": "openai",
          "permission": [
            {
              "id": "modelperm-KlsZtTGbGPLEIlya3tj8vKKp",
              "object": "model_permission",
              "created": 1677610602,
              "allow_create_engine": false,
              "allow_sampling": true,
              "allow_logprobs": true,
              "allow_search_indices": false,
              "allow_view": true,
              "allow_fine_tuning": false,
              "organization": "*",
              "group": null,
              "is_blocking": false
            }
          ],
          "root": "tts-1",
          "parent": null
        },
        {
          "id": "tts-1-hd",
          "object": "model",
          "created": 1677610602,
          "owned_by": "openai",
          "permission": [
            {
              "id": "modelperm-KlsZtTGbGPLEIlya3tj8vKKp",
              "object": "model_permission",
              "created": 1677610602,
              "allow_create_engine": false,
              "allow_sampling": true,
              "allow_logprobs": true,
              "allow_search_indices": false,
              "allow_view": true,
              "allow_fine_tuning": false,
              "organization": "*",
              "group": null,
              "is_blocking": false
            }
          ],
          "root": "tts-1-hd",
          "parent": null
        }
      ]
    };
    
    return res.json(models);
    
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ 
      error: { 
        message: error.message || "Internal server error", 
        type: "server_error" 
      } 
    });
  }
} 