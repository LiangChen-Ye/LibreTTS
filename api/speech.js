// OpenAI TTS API 兼容接口
// 参考: https://platform.openai.com/docs/api-reference/audio/createSpeech

import { handleTTS } from './tts.js';

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  // 处理OPTIONS请求
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  
  // 只允许POST请求
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body;
    
    // 验证必需的参数
    if (!body.model || !body.input) {
      return res.status(400).json({ 
        error: { 
          message: "Missing required parameters: model and input are required", 
          type: "invalid_request_error" 
        } 
      });
    }
    
    // 从OpenAI格式映射到我们的API格式
    const text = body.input;
    
    // 根据OpenAI模型映射到Microsoft声音
    // 默认使用英文声音，如果是中文内容则使用中文声音
    let voiceName;
    const containsChinese = /[\u4e00-\u9fa5]/.test(text);
    
    if (body.voice === "alloy") {
      voiceName = containsChinese ? "zh-CN-XiaoxiaoNeural" : "en-US-JennyNeural";
    } else if (body.voice === "echo") {
      voiceName = containsChinese ? "zh-CN-YunxiNeural" : "en-US-GuyNeural";
    } else if (body.voice === "fable") {
      voiceName = containsChinese ? "zh-CN-XiaochenNeural" : "en-US-AriaNeural";
    } else if (body.voice === "onyx") {
      voiceName = containsChinese ? "zh-CN-YunyangNeural" : "en-US-ChristopherNeural";
    } else if (body.voice === "nova") {
      voiceName = containsChinese ? "zh-CN-XiaohanNeural" : "en-US-SaraNeural";
    } else if (body.voice === "shimmer") {
      voiceName = containsChinese ? "zh-CN-XiaoyiNeural" : "en-US-JennyMultilingualNeural";
    } else {
      // 默认声音
      voiceName = containsChinese ? "zh-CN-XiaoxiaoMultilingualNeural" : "en-US-JennyMultilingualNeural";
    }
    
    // 设置速度和音调
    const rate = 0; // 默认速度
    const pitch = 0; // 默认音调
    
    // 根据请求的响应格式设置输出格式
    let outputFormat;
    if (body.response_format === "opus") {
      outputFormat = "audio-24khz-48kbitrate-mono-opus";
    } else if (body.response_format === "aac") {
      outputFormat = "audio-24khz-48kbitrate-mono-mp3"; // 使用MP3作为AAC的替代
    } else if (body.response_format === "flac") {
      outputFormat = "audio-24khz-48kbitrate-mono-mp3"; // 使用MP3作为FLAC的替代
    } else {
      // 默认使用mp3
      outputFormat = "audio-24khz-48kbitrate-mono-mp3";
    }
    
    // 调用现有的TTS处理函数
    return await handleTTS(res, text, voiceName, rate, pitch, outputFormat, false);
    
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