import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getRandomFallbackMission } from '@/data/fallbackMissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Gemini API Key - 環境変数 GEMINI_API_KEY または AI_PROVIDER_API_KEY から取得
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.AI_PROVIDER_API_KEY;

const SYSTEM_PROMPT = `あなたは「散歩神」という散歩アプリの神様です。
ユーザーに散歩のお題（ミッション）を与える役割を持っています。

## お題生成の制約:
1. 安全性: 危険な行為、違法行為、他人に迷惑をかける行為は絶対に避ける
2. 簡潔性: 50文字以内で具体的かつ実行可能
3. カテゴリ: "observe"(観察), "move"(移動), "mood"(気分)のいずれか
4. 難易度: 1-5（1=誰でも簡単、5=挑戦的）
5. ポジティブ: 楽しく、前向きな体験になるもの
6. 写真撮影: ユーザーはカメラでお題に沿っていると思う写真を撮る必要があることを考慮すること

## 出力形式（JSON）:
{
    "text": "お題の文章（50文字以内）",
    "category": "observe | move | mood",
    "difficulty": 1-5の数値,
    "reason": "このお題を選んだ理由（100文字以内）"
}

## 良い例:
- "公園で一番大きな木の写真を撮る"（observe, 2）
- "猫を見かけたら立ち止まって3秒眺める"（observe, 1）
- "いつもと違う道を1本選んで歩く"（move, 2）
- "空を見上げて深呼吸を3回する"（mood, 1）

## 避けるべき例:
- 他人の家を覗く（プライバシー侵害）
- 私有地に入る（不法侵入）
- 危険な場所に行く（安全性）
- 長時間かかるもの（散歩の範囲を超える）`;

function getRandomFallback() {
    const mission = getRandomFallbackMission();
    console.log('[AI Mission] 🔄 Using FALLBACK mission:', mission.text);
    return {
        id: `fallback_${Date.now()}`,
        ...mission,
        source: 'fallback',
        reason: 'AI生成に失敗したため、フォールバックミッションを使用しました',
    };
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const context = body?.context || {};
        const timeOfDay = context.timeOfDay || 'day';
        const weather = context.weather || 'clear';

        // デバッグ情報
        console.log('[AI Mission] API Key exists:', !!GEMINI_API_KEY);
        console.log('[AI Mission] API Key prefix:', GEMINI_API_KEY?.substring(0, 10) + '...');

        // AI未設定の場合はフォールバック
        if (!GEMINI_API_KEY) {
            console.warn('[AI Mission] GEMINI_API_KEY not set, using fallback');
            return NextResponse.json(getRandomFallback());
        }

        console.log('[AI Mission] Attempting Gemini API call...');

        // Gemini API クライアント初期化（環境変数から自動取得）
        const ai = new GoogleGenAI({
            apiKey: GEMINI_API_KEY,
        });

        const userPrompt = `現在の状況:
- 時間帯: ${timeOfDay}
- 天候: ${weather}

上記を考慮して、散歩のお題を1つ生成してください。JSON形式で返してください。`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: `${SYSTEM_PROMPT}\n\n${userPrompt}`,
        });

        console.log('[AI Mission] Gemini API response received');

        const content = response.text;

        if (!content) {
            console.warn('[AI Mission] Empty response from Gemini');
            return NextResponse.json(getRandomFallback());
        }

        console.log('[AI Mission] Response content:', content);

        // JSON 抽出（Gemini がマークダウンでラップすることがあるため）
        let jsonStr = content;
        const jsonMatch = content.match(/\{[^{}]*\}/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }

        const missionData = JSON.parse(jsonStr);

        // バリデーション
        if (!missionData.text || !missionData.category || !missionData.difficulty) {
            console.warn('[AI Mission] Invalid mission data:', missionData);
            return NextResponse.json(getRandomFallback());
        }

        if (missionData.text.length > 50) {
            missionData.text = missionData.text.substring(0, 50);
        }

        console.log('[AI Mission] Successfully generated AI mission');

        const aiMission = {
            id: `ai_${Date.now()}`,
            text: missionData.text,
            category: missionData.category,
            difficulty: Number(missionData.difficulty) || 2,
            source: 'ai',
            reason: missionData.reason || 'AI生成',
        };

        console.log('[AI Mission] ✨ AI Generated mission:', aiMission.text);

        return NextResponse.json(aiMission);
    } catch (error) {
        console.error('[AI Mission] ❌ Generate mission API error:', error);
        const fallback = getRandomFallback();
        return NextResponse.json(fallback);
    }
}
