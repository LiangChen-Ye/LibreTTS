// OpenAI TTS API 兼容接口 - 支持 Chunked Transfer Encoding
// 参考: https://platform.openai.com/docs/api-reference/audio/createSpeech

import { handleTTS, handleTTSChunked } from './tts.js';

export default async function handler(req, res) {
// 设置CORS头
res.setHeader("Access-Control-Allow-Origin", "*");
res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

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
  
  // 验证文本长度限制（OpenAI限制为4096字符）
  if (body.input.length > 4096) {
    return res.status(400).json({ 
      error: { 
        message: "Input text is too long. Maximum length is 4096 characters.", 
        type: "invalid_request_error",
        param: "input"
      } 
    });
  }
  
  // 从OpenAI格式映射到我们的API格式
  const text = body.input;
  
  // 根据OpenAI模型映射到Microsoft声音
  // 默认使用英文声音，如果是中文内容则使用中文声音
  let voiceName = "zh-CN-XiaoxiaoNeural";
  
  // 处理速度参数 (OpenAI: 0.25-4.0)
  let rate = 0; // 默认速度
  if (body.speed && typeof body.speed === 'number') {
    // 将OpenAI的速度范围(0.25-4.0)映射到合适的rate值
    // 1.0 = 0%, 0.5 = -50%, 2.0 = +100%
    const speedMultiplier = Math.max(0.25, Math.min(4.0, body.speed));
    rate = Math.round((speedMultiplier - 1.0) * 100);
    rate = Math.max(-50, Math.min(100, rate)); // 限制在合理范围内
  }
  
  const pitch = 0; // 默认音调
  
  // 根据请求的响应格式设置输出格式
  let outputFormat;
  if (body.response_format === "opus") {
    outputFormat = "audio-24khz-48kbitrate-mono-opus";
  } else if (body.response_format === "aac") {
    outputFormat = "audio-24khz-48kbitrate-mono-mp3"; // 使用MP3作为AAC的替代
  } else if (body.response_format === "flac") {
    outputFormat = "audio-24khz-48kbitrate-mono-mp3"; // 使用MP3作为FLAC的替代
  } else if (body.response_format === "wav") {
    outputFormat = "audio-24khz-16bit-mono-pcm";
  } else {
    // 默认使用mp3
    outputFormat = "audio-24khz-48kbitrate-mono-mp3";
  }
  
  // 检查是否请求流式传输
  // OpenAI默认使用chunked传输，除非明确指定不使用
  const useChunked = body.stream !== false; // 默认为true，除非明确设置为false
  
  if (useChunked) {
    // 使用chunked传输
    return await handleTTSChunked(res, text, voiceName, rate, pitch, outputFormat, false);
  } else {
    // 使用传统传输
    return await handleTTS(res, text, voiceName, rate, pitch, outputFormat, false);
  }
  
} catch (error) {
  console.error("API Error:", error);
  
  // 如果响应头还没有发送，返回JSON错误
  if (!res.headersSent) {
    return res.status(500).json({ 
      error: { 
        message: error.message || "Internal server error", 
        type: "server_error" 
      } 
    });
  } else {
    // 如果已经开始streaming，只能关闭连接
    res.end();
  }
}
}

// 新增：专门为OpenAI兼容接口设计的chunked处理函数
export async function handleOpenAITTSChunked(res, text, voiceName, rate, pitch, outputFormat) {
try {
  // 设置OpenAI兼容的响应头
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Content-Type', getOpenAIContentType(outputFormat));
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // 添加OpenAI特有的响应头
  res.setHeader('openai-model', 'tts-1');
  res.setHeader('openai-organization', 'user-org');
  res.setHeader('openai-processing-ms', '1000');
  res.setHeader('openai-version', '2020-10-01');
  
  // 发送响应头
  res.writeHead(200);
  
  // 调用现有的TTS处理逻辑
  return await handleTTSChunked(res, text, voiceName, rate, pitch, outputFormat, false);
  
} catch (error) {
  console.error("OpenAI TTS Chunked Error:", error);
  
  if (!res.headersSent) {
    throw error;
  } else {
    res.end();
  }
}
}

// 获取OpenAI兼容的Content-Type
function getOpenAIContentType(outputFormat) {
if (outputFormat.includes('mp3')) {
  return 'audio/mpeg';
} else if (outputFormat.includes('opus')) {
  return 'audio/opus';
} else if (outputFormat.includes('wav') || outputFormat.includes('pcm')) {
  return 'audio/wav';
} else if (outputFormat.includes('ogg')) {
  return 'audio/ogg';
} else {
  return 'audio/mpeg'; // 默认
}
}
