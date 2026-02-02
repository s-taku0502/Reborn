import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AI_PROVIDER_API_KEY = process.env.AI_PROVIDER_API_KEY;

const SYSTEM_PROMPT = `あなたは「散歩神」という散歩アプリの神様です。
ユーザーに散歩のお題（ミッション）を与える役割を持っています。

## お題生成の制約:
1. 安全性: 危険な行為、違法行為、他人に迷惑をかける行為は絶対に避ける
2. 簡潔性: 50文字以内で具体的かつ実行可能
3. カテゴリ: "observe"(観察), "move"(移動), "mood"(気分)のいずれか
4. 難易度: 1-5（1=誰でも簡単、5=挑戦的）
5. ポジティブ: 楽しく、前向きな体験になるもの

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

const FALLBACK_MISSIONS = [
    { text: '空を見上げて雲の形を観察する', category: 'observe', difficulty: 1 },
    { text: 'いつもと違う道を1本選んで歩く', category: 'move', difficulty: 2 },
    { text: '深呼吸を3回して、今の気分を確かめる', category: 'mood', difficulty: 1 },
    { text: '道端の花や植物を1つ見つける', category: 'observe', difficulty: 1 },
    { text: '5分間、音楽を聴かずに歩く', category: 'mood', difficulty: 2 },
];

function getRandomFallback() {
    const mission = FALLBACK_MISSIONS[Math.floor(Math.random() * FALLBACK_MISSIONS.length)];
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

        // AI未設定の場合はフォールバック
        if (!AI_PROVIDER_API_KEY) {
            console.warn('AI_PROVIDER_API_KEY not set, using fallback');
            return NextResponse.json(getRandomFallback());
        }

        // Gemini API を使用してミッション生成
        const ai = new GoogleGenAI({
            apiKey: AI_PROVIDER_API_KEY,
        });

        const userPrompt = `現在の状況:
- 時間帯: ${timeOfDay}
- 天候: ${weather}

上記を考慮して、散歩のお題を1つ生成してください。JSON形式で返してください。`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: userPrompt,
            systemInstruction: SYSTEM_PROMPT,
        });

        const content = response.text();

        if (!content) {
            console.warn('Empty response from Gemini');
            return NextResponse.json(getRandomFallback());
        }

        // JSON 抽出（Gemini がマークダウンでラップすることがあるため）
        let jsonStr = content;
        const jsonMatch = content.match(/\{[^{}]*\}/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }

        const missionData = JSON.parse(jsonStr);

        // バリデーション
        if (!missionData.text || !missionData.category || !missionData.difficulty) {
            return NextResponse.json(getRandomFallback());
        }

        if (missionData.text.length > 50) {
            missionData.text = missionData.text.substring(0, 50);
        }

        return NextResponse.json({
            id: `ai_${Date.now()}`,
            text: missionData.text,
            category: missionData.category,
            difficulty: Number(missionData.difficulty) || 2,
            source: 'ai',
            reason: missionData.reason || 'AI生成',
        });
    } catch (error) {
        console.error('Generate mission API error:', error);
        return NextResponse.json(getRandomFallback());
    }
}
