import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { requireOwner } from '../middleware/auth.js';

const router = express.Router();

router.post('/analyze', requireOwner, async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        message: 'GEMINI_API_KEY is not configured in the backend environment. Please set GEMINI_API_KEY in backend/.env.',
      });
    }

    const { action, content, contextType = 'general', title = '', recipient = '', mood = '' } = req.body;

    if (!action) {
      return res.status(400).json({ message: 'AI action is required' });
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-1.5-flash as fast and reliable default model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let systemContext = `Bạn là một trợ lý viết nhật ký cá nhân và suy ngẫm tĩnh lặng, tinh tế. Phong cách phản hồi của bạn nên nhẹ nhàng, thấu hiểu, không phán xét, mang tính chiêm nghiệm và riêng tư.`;

    let userPrompt = '';

    switch (action) {
      case 'analyze':
        userPrompt = `${systemContext}\n\nHãy phân tích và lắng nghe cảm xúc trong nội dung nhật ký/lá thư sau đây (${contextType}, Mood: ${mood || 'Chưa rõ'}):\nTiêu đề: ${title}\nNội dung:\n"${content}"\n\nHãy chia sẻ một góc nhìn ấm áp, thấu hiểu và điểm lại những cảm xúc nổi bật.`;
        break;

      case 'summarize':
        userPrompt = `${systemContext}\n\nHãy tóm tắt ngắn gọn các ý chính và thông điệp cốt lõi của bài viết sau:\nTiêu đề: ${title}\nNgười nhận: ${recipient}\nNội dung:\n"${content}"`;
        break;

      case 'improve':
        userPrompt = `${systemContext}\n\nHãy gợi ý các cách diễn đạt tinh tế hơn, mượt mà hơn cho văn bản sau nhưng vẫn giữ nguyên vẹn ý nghĩa cốt lõi và giọng văn chân thật của người viết:\nTiêu đề: ${title}\nNội dung nguyên bản:\n"${content}"\n\nHãy đưa ra bài viết gợi ý và giải thích ngắn gọn điểm cải thiện.`;
        break;

      case 'extract':
        userPrompt = `${systemContext}\n\nHãy trích xuất các điểm quan trọng, các dự định hoặc suy nghĩ đáng nhớ nhất trong nội dung sau dưới dạng gạch đầu dòng ngắn gọn:\n"${content}"`;
        break;

      case 'themes':
        userPrompt = `${systemContext}\n\nHãy tìm ra các chủ đề lặp lại, nguồn năng lượng cảm xúc hoặc các từ khóa suy tưởng chính trong đoạn viết sau:\n"${content}"`;
        break;

      case 'reflect':
        userPrompt = `${systemContext}\n\nHãy giúp người viết tự suy ngẫm sâu hơn về đoạn viết sau. Đưa ra 2-3 lời nhắn nhủ thấu cảm:\n"${content}"`;
        break;

      case 'prompts':
        userPrompt = `${systemContext}\n\nDựa vào cảm xúc hoặc nội dung sau (${mood || 'Tự do'}), hãy gợi ý 3 chủ đề hoặc câu mở đầu để viết tiếp cho ngày hôm nay:\n"${content || 'Tôi muốn dành thời gian cho riêng mình'}"`;
        break;

      case 'questions':
        userPrompt = `${systemContext}\n\nDựa trên những gì người viết đã chia sẻ:\n"${content}"\n\nHãy gợi ý 3-4 câu hỏi nhẹ nhàng để người viết tự vấn và lắng nghe chính mình.`;
        break;

      default:
        userPrompt = `${systemContext}\n\nHãy suy ngẫm cùng người viết về nội dung này:\n"${content}"`;
    }

    const response = await model.generateContent(userPrompt);
    const resultText = response.response.text();

    return res.json({
      result: resultText,
      action,
    });
  } catch (error) {
    console.error('Gemini AI processing error:', error);
    return res.status(500).json({
      message: 'Lỗi xử lý AI Gemini: ' + (error.message || 'Không thể hoàn tất yêu cầu'),
      error: error.message,
    });
  }
});

export default router;
