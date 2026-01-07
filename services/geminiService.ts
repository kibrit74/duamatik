
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { SearchResult, GroundingChunk, SpiritualPlan } from "../types";
import { logUsageStat, getAppSetting } from "./supabase";
import { logger } from "../utils/logger";

// Fallback API anahtarı (.env.local'dan)
const fallbackApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

// Dinamik API anahtarı yönetimi
let cachedApiKey: string | null = null;
let ai: GoogleGenAI | null = null;

// API anahtarını al (önce Supabase, sonra .env.local)
async function getApiKey(): Promise<string> {
  if (cachedApiKey) {
    logger.log('🔑 Using cached API key, length:', cachedApiKey.length);
    return cachedApiKey;
  }

  try {
    logger.log('🔍 Fetching API key from Supabase...');
    let dbKey = await getAppSetting('gemini_api_key');
    logger.log('📦 Supabase returned key:', dbKey ? `length=${dbKey.length}, starts=${dbKey.substring(0, 15)}...` : 'NULL/EMPTY');

    // Bozuk anahtar tespiti - 50 karakterden uzunsa muhtemelen iki kere yapıştırılmış
    if (dbKey && dbKey.length > 50) {
      logger.warn('⚠️ API key appears corrupted (too long). Attempting to fix...');
      // Gemini API keys are typically 39 chars and start with "AIzaSy"
      if (dbKey.startsWith('AIzaSy')) {
        dbKey = dbKey.substring(0, 39); // İlk 39 karakteri al
        logger.log('🔧 Fixed key length:', dbKey.length);
      }
    }

    if (dbKey && dbKey.length > 10 && dbKey.length < 50) {
      cachedApiKey = dbKey;
      return dbKey;
    }
  } catch (e) {
    logger.warn('❌ Supabase API key okunamadı, fallback kullanılıyor:', e);
  }

  logger.log('⚠️ Using fallback API key, length:', fallbackApiKey?.length || 0);
  cachedApiKey = fallbackApiKey;
  return fallbackApiKey;
}

// GoogleGenAI instance'ı al
async function getAI(): Promise<GoogleGenAI> {
  if (ai) return ai;
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error("API Anahtarı bulunamadı. Admin panelinden veya .env.local'dan tanımlayın.");
  ai = new GoogleGenAI({ apiKey });
  return ai;
}

// API anahtarı cache'ini temizle (admin panelden değiştirildiğinde çağrılabilir)
export function clearApiKeyCache() {
  cachedApiKey = null;
  ai = null;
}


/**
 * Helper function to robustly extract JSON from a potential markdown string
 */
function extractJSON(text: string): any {
  let jsonText = text;

  // 1. Try parsing directly
  try {
    return JSON.parse(text);
  } catch (e) {
    // 2. Try extracting from markdown code block
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      jsonText = match[1];
    } else {
      // 3. Try finding the first '{' and last '}'
      const firstOpen = text.indexOf('{');
      const lastClose = text.lastIndexOf('}');
      if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
        jsonText = text.substring(firstOpen, lastClose + 1);
      }
    }
  }

  try {
    return JSON.parse(jsonText);
  } catch (e) {
    // 4. Try cleaning trailing commas (common LLM error)
    try {
      const cleaned = jsonText.replace(/,(\s*[}\]])/g, '$1');
      return JSON.parse(cleaned);
    } catch (e2) {
      throw new Error("Geçerli bir JSON formatı bulunamadı.");
    }
  }
}

// Dynamic Fallback Generator based on Mood
const getFallbackPlan = (mood: string): SpiritualPlan => {
  const m = mood.toLowerCase();

  if (m.includes('kaygı') || m.includes('korku') || m.includes('endişe')) {
    return {
      title: "Sekine Limanı",
      description: "Kaygı, kalbinin dinlenmeye ihtiyacı olduğunu fısıldar. Senin için ferahlık kapılarını aralayacak bir program hazırladım.",
      days: [
        {
          day: 1,
          focus: "Teslimiyet",
          morning: "Güne 'Hasbunallahu ve ni'mel vekil' (Allah bana yeter) zikriyle başla.",
          evening: "İnşirah suresini okuyarak göğsünün genişlemesine niyet et.",
          dhikr: "Hasbunallahu ve ni'mel vekil"
        },
        {
          day: 2,
          focus: "Güven",
          morning: "Gelecek endişesini bir kenara bırakıp, 'İşimi Allah'a havale ediyorum' de.",
          evening: "Yatmadan önce Ayetel Kürsi oku ve Allah'ın korumasına sığın.",
          dhikr: "Ya Selam"
        },
        {
          day: 3,
          focus: "Huzur",
          morning: "Doğayı izle ve Allah'ın sanatındaki düzeni tefekkür et.",
          evening: "Gözlerini kapat ve kalbinin atışını dinleyerek 'Allah' de.",
          dhikr: "La ilahe illallah"
        }
      ]
    };
  }

  if (m.includes('hüzün') || m.includes('üzgün') || m.includes('mutsuz') || m.includes('sad')) {
    return {
      title: "Teselli Bahçesi",
      description: "Hüzün, Allah'a en yakın olduğun andır. Kalbinin kırıklığını O'nun rahmetiyle saralım.",
      days: [
        {
          day: 1,
          focus: "Kabulleniş",
          morning: "Hz. Yakub gibi hüznünü sadece Allah'a şikayet et (Yusuf Suresi 86).",
          evening: "Duha suresini oku, Rabbinin seni terk etmediğini hatırla.",
          dhikr: "La ilahe illa ente subhaneke inni kuntu minezzalimin"
        },
        {
          day: 2,
          focus: "Ümit",
          morning: "Bugün bir yetimi veya ihtiyaç sahibini sevindir.",
          evening: "Hz. Eyyüb'ün sabrını düşün ve şifa dile.",
          dhikr: "Ya Fettah"
        },
        {
          day: 3,
          focus: "Ferahlama",
          morning: "Sabah namazından sonra gökyüzüne bak ve derin bir nefes al.",
          evening: "İnşirah suresini dinle ve anlamını düşün.",
          dhikr: "Elhamdülillah"
        }
      ]
    };
  }

  if (m.includes('yorgun') || m.includes('bitkin') || m.includes('güçsüz')) {
    return {
      title: "Manevi Güç",
      description: "Bedenin ve ruhun yorgun düştüğünde, sonsuz güç sahibi Allah'tan kuvvet isteme vaktidir.",
      days: [
        {
          day: 1,
          focus: "İstiaze",
          morning: "Sabah 'La havle ve la kuvvete illa billah' ile gücünü tazele.",
          evening: "Erken uyu ve uyumadan önce Felak-Nas surelerini oku.",
          dhikr: "La havle ve la kuvvete illa billah"
        },
        {
          day: 2,
          focus: "Arınma",
          morning: "Güzel bir abdest al, suyun ferahlığını hisset.",
          evening: "Zihnini yoran düşünceleri bir kağıda yaz ve sonra o kağıdı at.",
          dhikr: "Ya Hayyu Ya Kayyum"
        },
        {
          day: 3,
          focus: "Yenilenme",
          morning: "Sabah namazını kıldıktan sonra güneşin doğuşunu izle.",
          evening: "Kendine şefkat göster, Allah kimseye gücünün yettiğinden fazlasını yüklemez.",
          dhikr: "Ya Kaviyy"
        }
      ]
    };
  }

  if (m.includes('kararsız') || m.includes('kafa') || m.includes('confused')) {
    return {
      title: "Hidayet Yolu",
      description: "Kafan karışık olduğunda en iyi rehber Allah'tır. O'ndan netlik ve hayırlı olanı isteyelim.",
      days: [
        {
          day: 1,
          focus: "İstihare",
          morning: "Karar vermen gereken konu için Allah'tan hayırlısını iste.",
          evening: "İki rekat hacet namazı kıl ve kalbini Allah'a aç.",
          dhikr: "Ya Hadi"
        },
        {
          day: 2,
          focus: "İşaret",
          morning: "Kuran'dan rastgele bir sayfa aç ve mealini oku, sana mesajına bak.",
          evening: "Güvendiğin, salih bir dostunla istişare et.",
          dhikr: "Ya Alim"
        },
        {
          day: 3,
          focus: "Tevekkül",
          morning: "Kararını ver ve gerisini Allah'a bırak.",
          evening: "Fatiha suresindeki 'Bizi doğru yola ilet' ayetini düşün.",
          dhikr: "Hasbiyallahu la ilahe illa hu"
        }
      ]
    };
  }

  if (m.includes('şükür') || m.includes('mutlu') || m.includes('grateful')) {
    return {
      title: "Bereket Kapısı",
      description: "Elhamdülillah! Bu güzel halini şükürle taçlandıralım ki nimet artsın.",
      days: [
        {
          day: 1,
          focus: "Hamd",
          morning: "Güne 100 defa 'Elhamdülillah' diyerek başla.",
          evening: "Bugün seni gülümseten 3 şeyi not et.",
          dhikr: "Elhamdülillah"
        },
        {
          day: 2,
          focus: "İkram",
          morning: "Sevincini paylaşmak için birine küçük bir hediye ver veya sadaka ver.",
          evening: "Şükür namazı kıl.",
          dhikr: "Eş-Şekûr"
        },
        {
          day: 3,
          focus: "Zikir",
          morning: "Kainattaki güzelliklere 'Maşallah' gözüyle bak.",
          evening: "Rahman suresini oku veya dinle.",
          dhikr: "Subhanallahi ve bihamdihi"
        }
      ]
    };
  }

  // Generic Fallback
  return {
    title: "Manevi Reçete",
    description: "Sana özel hazırladığım bu program ile kalbini ferahlat.",
    days: [
      {
        day: 1,
        focus: "Tevbe",
        morning: "33 defa 'Estağfirullah' çekerek kalbini arındır.",
        evening: "Mülk suresini oku veya dinle.",
        dhikr: "Estağfirullah"
      },
      {
        day: 2,
        focus: "Dua",
        morning: "Sevdiklerin için ismen dua et.",
        evening: "Peygamberimize (s.a.v) salavat getir.",
        dhikr: "Allahümme salli ala seyyidina Muhammed"
      },
      {
        day: 3,
        focus: "Kuran",
        morning: "Fatiha suresinin manasını tefekkür et.",
        evening: "Yatmadan önce son 3 sureyi (İhlas, Felak, Nas) oku.",
        dhikr: "Subhanallah"
      }
    ]
  };
};


// ==========================================
// CHAT SESSION & MANEVİ KOÇ
// ==========================================

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface ChatResponse {
  text: string;
  plan?: SpiritualPlan; // Eğer cevap içinde plan varsa
}

const SYSTEM_INSTRUCTION = `
Sen bir Manevi Rehbersin (Manevi Asistan).
Amacın: İnsanları teselli etmek, huzur vermek, İslami kaynaklardan (Ayet, Hadis, Büyüklerin Sözleri) örnekler vererek onları rahatlatmak.

Kurallar:
1. İslami literatüre sadık kal ama dilin günümüz Türkçesi, samimi, şefkatli ve akıcı olsun.
2. Asla yargılama, her zaman kucaklayıcı ol. Sadece "Allah'ın rahmeti geniştir" mesajını ver.
3. Siyaset, fıkhi tartışmalar (helal/haram fetvası verme) veya tartışmalı konulardan uzak dur. Fetva sorulursa "Bu konuda ehil hocalara veya Diyanet'e danışman daha doğru olur" de.
4. Kullanıcı bir derdini paylaşırsa, ona "Seni çok iyi anlıyorum kardeşim..." gibi empatik cümlelerle başla.
5. Uygun yerlerde emoji kullan (🌹, 🤲, ✨ gibi) ama abartma.
6. Eğer kullanıcı senden "program", "reçete", "plan" veya "ne yapmalıyım" gibi yapılandırılmış bir tavsiye isterse, cevabının sonuna (veya içine) AŞAĞIDAKİ JSON FORMATINDA bir plan ekle. JSON bloğu \`\`\`json ve \`\`\` arasında olsun.

PLAN JSON FORMATI:
{
  "title": "Program Başlığı",
  "description": "Açıklama",
  "days": [ { "day": 1, "focus": "Odak", "morning": "...", "evening": "...", "dhikr": "..." }, ... ]
}
`;

// Helper class to mimic the old ChatSession behavior with the new SDK
class SimpleChatSession {
  private history: ChatMessage[];
  private systemInstruction: string;
  private modelName: string;

  constructor(history: ChatMessage[], systemInstruction: string, modelName: string) {
    this.history = history;
    this.systemInstruction = systemInstruction;
    this.modelName = modelName;
  }

  async sendMessage(message: string) {
    // Add user message
    this.history.push({ role: 'user', parts: [{ text: message }] });

    try {
      const aiInstance = await getAI();
      const response = await aiInstance.models.generateContent({
        model: this.modelName,
        contents: this.history,
        config: {
          systemInstruction: this.systemInstruction,
        }
      });

      const text = response.text || "";

      // Add model response
      this.history.push({ role: 'model', parts: [{ text }] });

      // Return in a format compatible with the existing `sendChatMessage` function
      return {
        response: {
          text: () => text
        }
      };
    } catch (error) {
      logger.error("Chat Error:", error);
      throw error;
    }
  }
}

export async function createChatHistory(history: ChatMessage[] = []): Promise<any> {
  // Return our custom wrapper that matches the expected interface
  return new SimpleChatSession(history, SYSTEM_INSTRUCTION, "gemini-2.0-flash");
}

export async function sendChatMessage(chat: any, message: string): Promise<ChatResponse> {
  try {
    const result = await chat.sendMessage(message);
    const text = result.response.text();

    let responseText = text;
    let planData: SpiritualPlan | undefined;

    // Check for JSON plan in response
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        planData = JSON.parse(jsonMatch[1]);
        // Remove JSON from text to show clean message
        responseText = text.replace(/```json[\s\S]*?```/, '').trim();
      } catch (e) {
        logger.warn("JSON Parse Error in Chat:", e);
      }
    } else {
      // Fallback
      try {
        const extracted = extractJSON(text);
        if (extracted && extracted.days) {
          planData = extracted;
        }
      } catch (e) { logger.error('Manual parsing failed', e); }
    }

    return {
      text: responseText || "Seni dinliyorum...",
      plan: planData
    };

  } catch (error: any) {
    logger.error("Chat Error:", error);

    // Kota aşımı veya yoğunluk kontrolü (429 / Resource Exhausted)
    if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      return {
        text: "⚠️ Üzgünüm, şu an çok yoğunum veya günlük işlem kotam doldu. Lütfen bir süre sonra tekrar dene. (Hata: 429)"
      };
    }

    return {
      text: "Şu an bağlantımda bir zayıflık var ama kalben yanındayım. Lütfen biraz sonra tekrar yaz. 🌹"
    };
  }
}

export const extractTextFromImage = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<string> => {
  const aiInstance = await getAI();

  try {
    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          {
            text: "Bu resimdeki duayı veya metni olduğu gibi, Türkçe karakterlere dikkat ederek çıkar. Sadece metni döndür, yorum yapma. Eğer Arapça kısımlar varsa onları da olduğu gibi yaz."
          }
        ]
      }
    });

    if (!response.text) {
      throw new Error("Model boş yanıt döndürdü.");
    }

    // Başarılı OCR işlemini kaydet
    logUsageStat('ocr').catch(logger.warn);

    return response.text;
  } catch (error) {
    logger.error("OCR Error:", error);
    throw new Error("Resim okunurken bir hata oluştu. Lütfen tekrar deneyin.");
  }
};

export const searchPrayer = async (query: string): Promise<SearchResult> => {
  const aiInstance = await getAI();

  try {
    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Kullanıcı şu konuda bir dua arıyor: "${query}".
      
      Lütfen bu duruma uygun en bilinen ve sahih duayı bul.
      Cevabında şunlar olsun:
      1. Duanın kendisi (Türkçe meal).
      2. Varsa Arapça metni.
      3. Türkçe okunuşu.
      
      Sadece duayı ve bu bilgileri ver, sohbet etme. Kaynaklardan yararlan.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "Sonuç bulunamadı.";

    // Extract grounding chunks for sources safely
    let uniqueSources: { title: string; url: string }[] = [];

    if (response.candidates && response.candidates[0] && response.candidates[0].groundingMetadata) {
      const chunks = response.candidates[0].groundingMetadata.groundingChunks as GroundingChunk[] | undefined;

      if (chunks) {
        const sources = chunks
          .filter(c => c.web)
          .map(c => ({
            title: c.web!.title,
            url: c.web!.uri
          }));

        // Deduplicate
        uniqueSources = sources.filter((v, i, a) => a.findIndex(t => (t.url === v.url)) === i);
      }
    }

    return { text, sources: uniqueSources };
  } catch (error: any) {
    logger.error("Search Error Details:", error);
    // Return a more user-friendly error message
    throw new Error(error.message || "Dua araması sırasında bağlantı hatası oluştu.");
  }
};

export const generatePrayerAudio = async (text: string): Promise<string> => {
  const aiInstance = await getAI();

  // Metin temizleme ve validasyon
  let cleanText = text
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero-width karakterleri temizle
    .replace(/\s+/g, ' ') // Çoklu boşlukları tekle
    .replace(/[^\w\sğüşıöçĞÜŞİÖÇ.,!?;:'"()-]/gi, '') // Özel karakterleri temizle
    .slice(0, 800); // Daha kısa limit

  if (!cleanText || cleanText.length < 10) {
    throw new Error("Ses oluşturmak için yeterli metin yok.");
  }

  // Retry mekanizması
  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await aiInstance.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ parts: [{ text: cleanText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // Farklı ses dene
            },
          },
        },
      });

      // finishReason kontrolü
      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        const finishReason = candidate.finishReason;

        // Başarısız finish reason'ları kontrol et
        if (finishReason === 'OTHER' || finishReason === 'SAFETY' || finishReason === 'RECITATION') {
          logger.warn(`TTS finishReason: ${finishReason}, attempt ${attempt + 1}`);

          if (attempt < maxRetries) {
            // Metni kısaltarak tekrar dene
            cleanText = cleanText.slice(0, Math.floor(cleanText.length * 0.6));
            await new Promise(r => setTimeout(r, 300));
            continue;
          }

          // Kullanıcıya daha açıklayıcı hata
          throw new Error("Gemini TTS API şu anda yanıt vermiyor (Preview). Tarayıcı sesini kullanabilirsiniz.");
        }

        // Audio verisini bul
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
              // Başarılı TTS işlemini kaydet
              logUsageStat('tts').catch(logger.warn);
              return part.inlineData.data;
            }
          }
        }
      }

      // Eğer buraya kadar geldiyse yanıt boş
      if (attempt < maxRetries) {
        logger.warn(`TTS empty response, retrying... attempt ${attempt + 1}`);
        await new Promise(r => setTimeout(r, 500));
        continue;
      }

      throw new Error("Ses verisi oluşturulamadı. Tarayıcı sesini kullanabilirsiniz.");

    } catch (error: any) {
      lastError = error;

      // API rate limit veya geçici hatalar için retry
      if (error.message?.includes('rate') || error.message?.includes('quota')) {
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
      }

      // Zaten bizim hatamız ise doğrudan fırlat
      if (error.message?.includes('Tarayıcı') || error.message?.includes('Preview')) {
        throw error;
      }
    }
  }

  throw lastError || new Error("Ses oluşturulurken bir hata meydana geldi. Tarayıcı sesini kullanabilirsiniz.");
};

export const generateSpiritualPlan = async (mood: string): Promise<SpiritualPlan> => {
  const aiInstance = await getAI();

  try {
    const response = await aiInstance.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `The user is feeling: "${mood}". Create a highly personalized 3-day spiritual plan in Turkish.
        
        IMPORTANT: The plan MUST be specifically tailored to the mood "${mood}". 
        - If Anxious: Focus on calm, trust in God (Tevekkül).
        - If Sad: Focus on comfort, hope, Yusuf Surah.
        - If Tired: Focus on strength (La havle), easy dhikrs.
        - If Confused: Focus on guidance (Istihare), clarity.
        - If Grateful: Focus on hamd, giving charity.
        
        Return valid JSON only.`,
      config: {
        systemInstruction: `You are a wise, compassionate Islamic spiritual therapist (Manevi Rehber).
          
          Your Goal: To comfort the user who is feeling "${mood}" and provide a customized 3-day spiritual plan.
          
          Response Style:
          1. **Therapeutic Tone:** Be warm, gentle, and reassuring. Speak like a kind friend.
          2. **No Lists:** Use complete, flowing Turkish sentences.
          3. **Specific:** Do not give generic advice. Tailor every task to the input mood "${mood}".
          
          JSON Structure: 
             - title: A short, calming, and poetic title.
             - description: A comforting paragraph (2-3 sentences) specific to the mood.
             - days: Array of 3 days. Each day object must have: 
                - day (number)
                - focus (string): One single word theme.
                - morning (string): A simple spiritual task.
                - evening (string): A simple spiritual task.
                - dhikr (string): A specific short dhikr.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.NUMBER },
                  focus: { type: Type.STRING, description: "Theme word for the day" },
                  morning: { type: Type.STRING, description: "Short actionable spiritual task" },
                  evening: { type: Type.STRING, description: "Short actionable spiritual task" },
                  dhikr: { type: Type.STRING, description: "A specific dhikr or short dua to repeat" }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;

    if (!text) {
      logger.warn("AI returned empty text, using fallback.");
      return getFallbackPlan(mood);
    }

    // Robust Parsing
    const parsed = extractJSON(text);

    // Ensure 'days' array exists to prevent crashes
    if (!parsed.days || !Array.isArray(parsed.days)) {
      logger.warn("AI returned malformed JSON (missing days), using fallback days.");
      const fallback = getFallbackPlan(mood);
      parsed.days = fallback.days;
      if (!parsed.title) parsed.title = fallback.title;
      if (!parsed.description) parsed.description = fallback.description;
    }

    return parsed as SpiritualPlan;

  } catch (error: any) {
    logger.warn("Spiritual Plan Generation Failed (Using Fallback):", error.message || error);
    // Return dynamic fallback plan instead of static one
    return getFallbackPlan(mood);
  }
};

export const interpretDream = async (dreamText: string): Promise<string> => {
  const aiInstance = await getAI();

  try {
    const response = await aiInstance.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Rüya metni: "${dreamText}"`,
      config: {
        systemInstruction: `Sen İslami kaynaklara (İmam Nablusi, İbn-i Sirin, İmam Cafer-i Sadık) hakim, hikmetli bir rüya tabircisisin. 
        Kullanıcının anlattığı rüyayı Türkçe olarak yorumla.
        
        Kurallar:
        1. Üslubun sakin, manevi, umut verici ve dengeli olsun. Asla kesin hüküm ("öleceksin", "felaket olacak") verme.
        2. Rüyayı hayra yor. "Rüya, ilk yorumlayanın tabirine göre çıkar" hadisini unutma.
        3. Cevabın çok uzun olmasın, öz ve anlaşılır olsun.
        4. Cevabın sonunda, "En doğrusunu Allah bilir" minvalinde bir kapanış yap.`,
      },
    });

    return response.text || "Rüyanız şu an yorumlanamıyor. Lütfen daha sonra tekrar deneyin.";
  } catch (error: any) {
    logger.error("Dream Interpretation Error:", error);
    throw new Error("Yorumlama sırasında bir hata oluştu.");
  }
};
