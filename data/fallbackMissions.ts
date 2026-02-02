/**
 * フォールバックミッション
 * AI生成に失敗した場合に使用される予備のミッション集
 */

export interface FallbackMission {
    text: string;
    category: 'observe' | 'move' | 'mood';
    difficulty: 1 | 2 | 3 | 4 | 5;
}

export const FALLBACK_MISSIONS: FallbackMission[] = [
    // observe（観察）系 - 難易度1
    { text: '空を見上げて雲の形を撮影する', category: 'observe', difficulty: 1 },
    { text: '道端の花や植物を1つ見つけて撮る', category: 'observe', difficulty: 1 },
    { text: '鳥を見つけて撮影する', category: 'observe', difficulty: 1 },
    { text: '今日の空の色を写真に収める', category: 'observe', difficulty: 1 },
    { text: '道に落ちている葉っぱを撮影する', category: 'observe', difficulty: 1 },
    { text: '周りに咲いている花を撮る', category: 'observe', difficulty: 1 },
    { text: '木の幹の模様を接写する', category: 'observe', difficulty: 1 },
    { text: '空に飛んでいる鳥を撮影する', category: 'observe', difficulty: 1 },
    { text: '近くにある石ころを撮影する', category: 'observe', difficulty: 1 },
    { text: '歩道の影を撮影する', category: 'observe', difficulty: 1 },
    { text: '街路樹の葉を1枚撮る', category: 'observe', difficulty: 1 },
    { text: '太陽の光が当たっている場所を撮る', category: 'observe', difficulty: 1 },
    { text: '足元に咲いている小さな花を撮る', category: 'observe', difficulty: 1 },

    // observe（観察）系 - 難易度2
    { text: '猫を見かけたら写真を撮る', category: 'observe', difficulty: 2 },
    { text: '公園で一番大きな木の写真を撮る', category: 'observe', difficulty: 2 },
    { text: '珍しい色の花を見つけて撮影する', category: 'observe', difficulty: 2 },
    { text: '同じ種類の花を3つ見つけて撮る', category: 'observe', difficulty: 2 },
    { text: '虫や小動物を静かに撮影する', category: 'observe', difficulty: 2 },
    { text: '面白い形の雲を見つけて写真を撮る', category: 'observe', difficulty: 2 },
    { text: '季節を感じるものを撮影する', category: 'observe', difficulty: 2 },
    { text: '蝶や蜂が花に止まっている瞬間を撮る', category: 'observe', difficulty: 2 },
    { text: '水たまりに映る景色を撮影する', category: 'observe', difficulty: 2 },
    { text: '鳥の鳴き声がする方向を撮影する', category: 'observe', difficulty: 2 },
    { text: '地面の模様や質感を撮影する', category: 'observe', difficulty: 2 },
    { text: '異なる色の葉っぱを3つ見つけて撮る', category: 'observe', difficulty: 2 },

    // observe（観察）系 - 難易度3
    { text: '今まで気づかなかった建物や看板を撮る', category: 'observe', difficulty: 3 },
    { text: '5種類の異なる植物を見つけて撮影する', category: 'observe', difficulty: 3 },
    { text: '面白い形の石や木の枝を撮影する', category: 'observe', difficulty: 3 },
    { text: '珍しい鳥を見つけて撮影する', category: 'observe', difficulty: 3 },
    { text: '光と影のコントラストが美しい場所を撮る', category: 'observe', difficulty: 3 },
    { text: '自然の中に隠れているパターンを撮影する', category: 'observe', difficulty: 3 },
    { text: '動いている動物を捉えて撮影する', category: 'observe', difficulty: 3 },
    { text: '3つの異なる色の花を1枚に収める', category: 'observe', difficulty: 3 },
    { text: '歴史を感じる風景を探して撮影する', category: 'observe', difficulty: 3 },

    // move（移動）系 - 難易度1
    { text: 'いつもと違う景色を1枚撮る', category: 'move', difficulty: 1 },
    { text: '後ろを振り返って景色を撮影する', category: 'move', difficulty: 1 },
    { text: '信号待ちの風景を撮影する', category: 'move', difficulty: 1 },
    { text: '木を別の角度から撮影する', category: 'move', difficulty: 1 },
    { text: '立ち止まった場所から周りを撮影する', category: 'move', difficulty: 1 },
    { text: '横断歩道を渡った先の景色を撮る', category: 'move', difficulty: 1 },
    { text: '歩き始めた場所の景色を記録する', category: 'move', difficulty: 1 },
    { text: '角を曲がる前の風景を撮影する', category: 'move', difficulty: 1 },
    { text: '今いる場所の全体を撮影する', category: 'move', difficulty: 1 },

    // move（移動）系 - 難易度2
    { text: 'いつもと違う道の景色を撮る', category: 'move', difficulty: 2 },
    { text: '普段通らない小道の風景を撮影する', category: 'move', difficulty: 2 },
    { text: '曲がり角の景色を撮影する', category: 'move', difficulty: 2 },
    { text: '坂道から見える景色を撮影する', category: 'move', difficulty: 2 },
    { text: '公園のベンチからの景色を撮る', category: 'move', difficulty: 2 },
    { text: '100歩先の景色を撮影する', category: 'move', difficulty: 2 },
    { text: '橋の上から見える景色を撮影する', category: 'move', difficulty: 2 },
    { text: '左右どちらかの道を選んで景色を撮る', category: 'move', difficulty: 2 },
    { text: '高い場所から見下ろした景色を撮る', category: 'move', difficulty: 2 },
    { text: '木陰に入って見える景色を撮影する', category: 'move', difficulty: 2 },
    { text: '少し寄り道した先の風景を撮る', category: 'move', difficulty: 2 },

    // move（移動）系 - 難易度3
    { text: '知らない道の風景を撮影する', category: 'move', difficulty: 3 },
    { text: '新しいルートの景色を記録する', category: 'move', difficulty: 3 },
    { text: '階段から見える景色を撮影する', category: 'move', difficulty: 3 },
    { text: '遠回りした道の景色を撮る', category: 'move', difficulty: 3 },
    { text: '探検気分で新しい道を見つけて撮影する', category: 'move', difficulty: 3 },
    { text: '地図を使わずに辿り着いた場所を撮る', category: 'move', difficulty: 3 },
    { text: '3つの角を曲がった先の景色を撮影する', category: 'move', difficulty: 3 },
    { text: '行ったことのない公園を見つけて撮る', category: 'move', difficulty: 3 },
    { text: '散歩の最も遠い地点で景色を撮影する', category: 'move', difficulty: 3 },

    // move（移動）系 - 難易度4
    { text: '目的地までの道のりを撮影する', category: 'move', difficulty: 4 },
    { text: '往復で違う風景を2枚撮る', category: 'move', difficulty: 4 },
    { text: '15分以上歩いた先の風景を撮影する', category: 'move', difficulty: 4 },
    { text: '新しい場所を2か所訪れて撮影する', category: 'move', difficulty: 4 },
    { text: '普段行かないエリアまで足を伸ばして撮る', category: 'move', difficulty: 4 },
    { text: '行きと帰りで違うルートの景色を記録する', category: 'move', difficulty: 4 },
    { text: '目印のない道を探索して景色を撮る', category: 'move', difficulty: 4 },

    // mood（気分）系 - 難易度1
    { text: '心が落ち着く景色を撮影する', category: 'mood', difficulty: 1 },
    { text: '静かな場所を見つけて撮る', category: 'mood', difficulty: 1 },
    { text: '今日良かったことを思い出す景色を撮る', category: 'mood', difficulty: 1 },
    { text: '笑顔になれる風景を撮影する', category: 'mood', difficulty: 1 },
    { text: '癒される景色を撮影する', category: 'mood', difficulty: 1 },
    { text: '好きな風景を撮影する', category: 'mood', difficulty: 1 },
    { text: '温かい気持ちになる景色を撮る', category: 'mood', difficulty: 1 },
    { text: 'ホッとする場所を見つけて撮影する', category: 'mood', difficulty: 1 },
    { text: '優しい気持ちになれる風景を撮る', category: 'mood', difficulty: 1 },
    { text: '明るい気分になれる景色を撮影する', category: 'mood', difficulty: 1 },
    { text: '安心できる場所の風景を撮る', category: 'mood', difficulty: 1 },

    // mood（気分）系 - 難易度2
    { text: '静寂を感じる場所を撮影する', category: 'mood', difficulty: 2 },
    { text: '感謝したくなる景色を撮る', category: 'mood', difficulty: 2 },
    { text: '心に残る風景を撮影する', category: 'mood', difficulty: 2 },
    { text: '今日の気分を表す景色を撮る', category: 'mood', difficulty: 2 },
    { text: '自然の美しさを感じる景色を撮る', category: 'mood', difficulty: 2 },
    { text: '穏やかな気持ちになれる風景を撮る', category: 'mood', difficulty: 2 },
    { text: '前向きな気持ちになれる景色を撮影する', category: 'mood', difficulty: 2 },
    { text: '懐かしさを感じる風景を撮る', category: 'mood', difficulty: 2 },
    { text: '希望を感じる景色を撮影する', category: 'mood', difficulty: 2 },
    { text: '心が軽くなる風景を見つけて撮る', category: 'mood', difficulty: 2 },
    { text: '新鮮な気持ちになれる景色を撮影する', category: 'mood', difficulty: 2 },

    // mood（気分）系 - 難易度3
    { text: '自分らしさを表現できる景色を撮る', category: 'mood', difficulty: 3 },
    { text: '季節の良さを感じる風景を撮影する', category: 'mood', difficulty: 3 },
    { text: '思い出に残したい景色を撮影する', category: 'mood', difficulty: 3 },
    { text: '今日1日を象徴する景色を撮る', category: 'mood', difficulty: 3 },
    { text: '心の変化を感じる風景を撮影する', category: 'mood', difficulty: 3 },
    { text: '成長を実感できる景色を撮る', category: 'mood', difficulty: 3 },
    { text: '自分だけの特別な景色を見つけて撮る', category: 'mood', difficulty: 3 },
    { text: '人生の豊かさを感じる風景を撮影する', category: 'mood', difficulty: 3 },
    { text: '未来への期待を込めて景色を撮る', category: 'mood', difficulty: 3 },
];

/**
 * ランダムなフォールバックミッションを取得
 */
export function getRandomFallbackMission(): FallbackMission {
    return FALLBACK_MISSIONS[Math.floor(Math.random() * FALLBACK_MISSIONS.length)];
}
