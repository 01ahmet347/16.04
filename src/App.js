import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Trophy, Scissors, Timer, X, Play, Globe2, Star, BarChart3, 
  Sparkles, Loader2, Coins, Heart, Wand2, History, RotateCw, 
  Settings2, ShieldCheck, ShoppingCart, Clock, 
  Zap, Award // <--- Bu iki ikonu buraya ekle
} from 'lucide-react';

// --- SABİTLER ---
const MAX_HEARTS = 5;
const REGEN_TIME = 30 * 60 * 1000; 

const FALLBACK_QUESTIONS = [
  { id: 1, category: 'bilim', question: "Gökyüzünün mavi görünmesinin temel sebebi nedir?", options: ["Işığın kırılması", "Rayleigh saçılması", "Bulutların yansıması", "Ozon tabakası"], answer: "Rayleigh saçılması", difficulty: "kolay", globalRate: 85, explanation: "Kısa dalga boylu mavi ışık atmosferde daha fazla saçılır.", puan: 1000 },
  { id: 2, category: 'bilim', question: "Atomun çekirdeğinde hangi parçacıklar bulunur?", options: ["Proton ve Elektron", "Proton ve Nötron", "Elektron ve Nötron", "Sadece Proton"], answer: "Proton ve Nötron", difficulty: "orta", globalRate: 60, explanation: "Proton ve Nötron merkezde bulunur.", puan: 2000 },
  { id: 3, category: 'bilim', question: "Sıvı haldeki tek metal hangisidir?", options: ["Cıva", "Kurşun", "Çinko", "Kalay"], answer: "Cıva", difficulty: "orta", globalRate: 58, explanation: "Cıva oda sıcaklığında sıvıdır.", puan: 3000 },
  { id: 5, category: 'bilim', question: "Güneş sistemindeki en büyük gezegen?", options: ["Satürn", "Neptün", "Jüpiter", "Uranüs"], answer: "Jüpiter", difficulty: "kolay", globalRate: 92, explanation: "Jüpiter bir gaz devidir.", puan: 5000 },
  { id: 31, category: 'genel', question: "Türkiye'nin başkenti neresidir?", options: ["İstanbul", "Ankara", "İzmir", "Bursa"], answer: "Ankara", difficulty: "kolay", globalRate: 100, explanation: "13 Ekim 1923.", puan: 1000 },
  { id: 62, category: 'sanat', question: "Mona Lisa tablosunu kim çizmiştir?", options: ["Picasso", "Da Vinci", "Michelangelo", "Dali"], answer: "Da Vinci", difficulty: "kolay", globalRate: 90, explanation: "Leonardo da Vinci eseri.", puan: 5000 }
];

const REWARDS_LIST = Array.from({ length: 30 }, (_, i) => {
  const step = i + 1;
  let val = 0;
  if (step <= 10) val = step * 1000;
  else if (step <= 20) val = 10000 + (step - 10) * 9000;
  else val = 100000 + (step - 20) * 90000;
  return { step, amount: val.toLocaleString(), val, isSafe: step % 5 === 0 };
});

const RANK_TITLES = [
  { minLevel: 1, name: "Çaylak" }, { minLevel: 5, name: "Bilge" }, { minLevel: 10, name: "Üstat" }, { minLevel: 20, name: "Ordinaryüs" }
];

const CATEGORIES_DATA = [
  { id: 'all', name: 'Karışık', icon: <Globe2 size={20} /> },
  { id: 'genel', name: 'Genel Kültür', icon: <Star size={20} /> },
  { id: 'bilim', name: 'Bilim', icon: <Zap size={20} /> },
  { id: 'sanat', name: 'Sanat', icon: <Award size={20} /> }
];

// --- API YARDIMCISI ---
const fetchGemini = async (payload, retries = 3) => {
  const apiKey = "BURAYA_KENDI_API_KEYINI_YAZ"; 
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('API Error');
      return await response.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
};

export default function App() {
  // --- STATE ---
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('quiz_master_v3_state');
    const defaultStats = {
      username: "Oyuncu",
      avatar: "👤",
      highScore: 0,
      totalGames: 0,
      totalPoints: 0,
      level: 1,
      xp: 0,
      balance: 5000,
      hearts: 5,
      lastHeartRegen: Date.now(),
      inventory: { ai_joker: 3 },
      gameHistory: []
    };
    if (saved) {
      try { return { ...defaultStats, ...JSON.parse(saved) }; } catch (e) { return defaultStats; }
    }
    return defaultStats;
  });

  const [screen, setScreen] = useState('home');
  const [gameQuestions, setGameQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [guaranteedScore, setGuaranteedScore] = useState(0);
  const [timer, setTimer] = useState(20);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [usedJokers, setUsedJokers] = useState([]);
  const [aiHint, setAiHint] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showShop, setShowShop] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [tempUsername, setTempUsername] = useState(stats.username);
  const [nextHeartTime, setNextHeartTime] = useState("");

  const currentQuestion = gameQuestions[currentQuestionIndex];

  // --- YARDIMCI FONKSİYONLAR ---
  const saveStats = useCallback((newStats) => {
    setStats(newStats);
    localStorage.setItem('quiz_master_v3_state', JSON.stringify(newStats));
  }, []);

  const updateHearts = useCallback(() => {
    setStats(prev => {
      if (prev.hearts >= MAX_HEARTS) return { ...prev, lastHeartRegen: Date.now() };
      const now = Date.now();
      const diff = now - prev.lastHeartRegen;
      const earnedHearts = Math.floor(diff / REGEN_TIME);
      if (earnedHearts > 0) {
        const newHearts = Math.min(MAX_HEARTS, prev.hearts + earnedHearts);
        const newRegenTime = newHearts === MAX_HEARTS ? now : prev.lastHeartRegen + (earnedHearts * REGEN_TIME);
        const newState = { ...prev, hearts: newHearts, lastHeartRegen: newRegenTime };
        localStorage.setItem('quiz_master_v3_state', JSON.stringify(newState));
        return newState;
      }
      return prev;
    });
  }, []);

  // --- EFFECTLER ---
  useEffect(() => {
    const interval = setInterval(() => {
      updateHearts();
      if (stats.hearts < MAX_HEARTS) {
        const remaining = Math.max(0, REGEN_TIME - (Date.now() - stats.lastHeartRegen));
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setNextHeartTime(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      } else setNextHeartTime("");
    }, 1000);
    return () => clearInterval(interval);
  }, [stats.hearts, stats.lastHeartRegen, updateHearts]);

  useEffect(() => {
    let interval;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    } else if (timer === 0 && isTimerActive) {
      endGame(guaranteedScore, false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer, guaranteedScore]);

  // --- OYUN MANTIĞI ---
  const resetQuestion = (index, data) => {
    setCurrentQuestionIndex(index);
    setTimer(data?.difficulty === 'zor' ? 15 : 20);
    setIsTimerActive(true);
    setIsAnswered(false);
    setSelectedOption(null);
    setAiHint(null);
  };

  const startQuiz = () => {
    if (stats.hearts <= 0) return;
    let pool = selectedCategory === 'all' ? FALLBACK_QUESTIONS : FALLBACK_QUESTIONS.filter(q => q.category === selectedCategory);
    const selected = [...pool].sort(() => 0.5 - Math.random()).slice(0, 30);
    setGameQuestions(selected);
    setScore(0);
    setGuaranteedScore(0);
    setUsedJokers([]);
    setScreen('quiz');
    resetQuestion(0, selected[0]);
  };

  const handleAnswer = (option) => {
    if (isAnswered || !currentQuestion) return;
    setSelectedOption(option);
    setIsAnswered(true);
    setIsTimerActive(false);
    const isCorrect = option === currentQuestion.answer;

    setTimeout(() => {
      if (isCorrect) {
        const nextScore = REWARDS_LIST[currentQuestionIndex]?.val || 0;
        setScore(nextScore);
        if (REWARDS_LIST[currentQuestionIndex]?.isSafe) setGuaranteedScore(nextScore);
        if (currentQuestionIndex === gameQuestions.length - 1) endGame(nextScore, true);
        else resetQuestion(currentQuestionIndex + 1, gameQuestions[currentQuestionIndex + 1]);
      } else endGame(guaranteedScore, false);
    }, 1200);
  };

  const endGame = (finalScore, isWin) => {
    setIsTimerActive(false);
    const earnedXp = (currentQuestionIndex + 1) * 100 + (isWin ? 1000 : 0);
    const newXp = stats.xp + earnedXp;
    const newLevel = Math.floor(newXp / 1000) + 1;

    const newStats = {
      ...stats,
      highScore: Math.max(stats.highScore, finalScore),
      totalGames: stats.totalGames + 1,
      totalPoints: stats.totalPoints + finalScore,
      balance: stats.balance + Math.floor(finalScore / 10),
      xp: newXp,
      level: newLevel,
      hearts: Math.max(0, stats.hearts - (isWin ? 0 : 1)),
      lastHeartRegen: stats.hearts === MAX_HEARTS && !isWin ? Date.now() : stats.lastHeartRegen,
      gameHistory: [{ score: finalScore, date: new Date().toLocaleDateString(), questions: currentQuestionIndex + 1 }, ...(stats.gameHistory || [])].slice(0, 10)
    };
    saveStats(newStats);
    setScreen('result');
  };

  const callAiJoker = async () => {
    if (!currentQuestion || isAiLoading || (stats.inventory?.ai_joker || 0) <= 0 || usedJokers.includes('ai')) return;
    setIsAiLoading(true);
    try {
      const data = await fetchGemini({
        contents: [{ parts: [{ text: `Soru: "${currentQuestion.question}". Cevabı söylemeden çok kısa bir ipucu ver.` }] }]
      });
      setAiHint(data?.candidates?.[0]?.content?.parts?.[0]?.text || "Bir şeyler ters gitti.");
      setUsedJokers([...usedJokers, 'ai']);
      saveStats({ ...stats, inventory: { ...stats.inventory, ai_joker: stats.inventory.ai_joker - 1 } });
    } catch (e) { setAiHint("AI şu an meşgul!"); } finally { setIsAiLoading(false); }
  };

  const buyItem = (type, cost) => {
    if (stats.balance < cost) return;
    const newInventory = { ...stats.inventory };
    let newHearts = stats.hearts;
    if (type === 'ai_joker') newInventory.ai_joker += 1;
    if (type === 'heart') newHearts = Math.min(MAX_HEARTS, newHearts + 1);
    saveStats({ ...stats, balance: stats.balance - cost, inventory: newInventory, hearts: newHearts });
  };

  // --- MODAL BİLEŞENİ ---
  const Modal = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 className="text-xl font-black uppercase text-yellow-500">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );

  // --- EKRANLAR ---

  if (screen === 'home') {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center p-6 font-sans">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-3xl border border-slate-800">
            <div className="flex flex-col">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Heart key={i} size={18} className={i < stats.hearts ? "text-red-500 fill-red-500" : "text-slate-700"} />
                ))}
              </div>
              {nextHeartTime && <span className="text-[10px] text-slate-500 mt-1 font-bold">Yükleniyor: {nextHeartTime}</span>}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-yellow-500 font-black">
                <Coins size={18} /> <span>{stats.balance.toLocaleString()}</span>
              </div>
              <button onClick={() => setShowSettings(true)} className="p-2 bg-slate-800 rounded-xl"><Settings2 size={18} /></button>
            </div>
          </div>

          {/* Profil */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-yellow-500 flex items-center justify-center text-3xl">{stats.avatar}</div>
              <div className="flex-1">
                <h2 className="text-xl font-black uppercase">{stats.username}</h2>
                <p className="text-yellow-500 text-xs font-bold uppercase">
                  {RANK_TITLES.filter(t => stats.level >= t.minLevel).pop()?.name} (Seviye {stats.level})
                </p>
              </div>
            </div>
          </div>

          <h1 className="text-5xl font-black text-center text-transparent bg-clip-text bg-gradient-to-b from-white to-yellow-600 italic py-4">QUİZ MASTER </h1>

          {/* Kategoriler */}
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES_DATA.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${selectedCategory === cat.id ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' : 'bg-slate-900/50 border-slate-800 text-slate-500'}`}>
                {cat.icon}<span className="text-[8px] font-black">{cat.name}</span>
              </button>
            ))}
          </div>

          <button onClick={startQuiz} disabled={stats.hearts <= 0} className="w-full py-6 rounded-[2.5rem] bg-gradient-to-r from-yellow-600 to-yellow-400 text-slate-950 font-black text-2xl active:scale-95 disabled:opacity-50">
            {stats.hearts > 0 ? 'YARIŞMAYA BAŞLA' : 'CANIN BİTTİ'}
          </button>

          {/* Alt Menü */}
          <div className="grid grid-cols-4 gap-3">
            <button onClick={() => setShowStats(true)} className="flex flex-col items-center p-4 bg-slate-900/50 rounded-2xl border border-slate-800"><BarChart3 size={20} className="text-blue-400" /><span className="text-[8px] mt-1 font-bold">STAT</span></button>
            <button onClick={() => setShowShop(true)} className="flex flex-col items-center p-4 bg-slate-900/50 rounded-2xl border border-slate-800"><ShoppingCart size={20} className="text-purple-400" /><span className="text-[8px] mt-1 font-bold">MARKET</span></button>
            <button onClick={() => {}} className="flex flex-col items-center p-4 bg-slate-900/50 rounded-2xl border border-slate-800 opacity-50 cursor-not-allowed"><RotateCw size={20} className="text-orange-400" /><span className="text-[8px] mt-1 font-bold">ÇARK</span></button>
            <button onClick={() => setShowHistory(true)} className="flex flex-col items-center p-4 bg-slate-900/50 rounded-2xl border border-slate-800"><History size={20} className="text-green-400" /><span className="text-[8px] mt-1 font-bold">GEÇMİŞ</span></button>
          </div>
        </div>

        {/* Market Modal */}
        {showShop && (
          <Modal title="Market" onClose={() => setShowShop(false)}>
            <div className="space-y-3">
              <div className="flex justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="flex flex-col">
                  <span className="font-bold">AI İpucu Joker</span>
                  <span className="text-xs text-slate-500">Zekâ Küpü'nden yardım al.</span>
                </div>
                <button onClick={() => buyItem('ai_joker', 1000)} className="bg-yellow-500 text-black px-4 py-1 rounded-xl font-bold">1.000 G</button>
              </div>
              <div className="flex justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="flex flex-col">
                  <span className="font-bold">Anında Can</span>
                  <span className="text-xs text-slate-500">Yarışmaya geri dön.</span>
                </div>
                <button onClick={() => buyItem('heart', 2500)} className="bg-yellow-500 text-black px-4 py-1 rounded-xl font-bold">2.500 G</button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  if (screen === 'quiz') {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex flex-col">
        {/* Puan Ağacı */}
        <div className="p-4 flex gap-2 overflow-x-auto bg-slate-900 border-b border-slate-800 no-scrollbar">
           {REWARDS_LIST.map((r, i) => (
             <div key={i} className={`px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${i === currentQuestionIndex ? 'bg-yellow-500 text-black scale-105' : i < currentQuestionIndex ? 'bg-green-900/30 text-green-500' : 'bg-slate-800 text-slate-400'}`}>
               {r.amount} PT
             </div>
           ))}
        </div>
        
        <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-8">
           <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center text-3xl font-black ${timer < 5 ? 'border-red-500 text-red-500 animate-pulse' : 'border-yellow-500 text-yellow-500'}`}>
              {timer}
           </div>
           
           <div className="bg-slate-900 p-8 rounded-[3rem] border border-slate-800 w-full max-w-3xl text-center shadow-2xl">
              <h2 className="text-2xl md:text-3xl font-bold leading-tight">{currentQuestion?.question}</h2>
           </div>

           {aiHint && <div className="bg-blue-900/20 text-blue-400 p-4 rounded-2xl border border-blue-800/50 italic text-sm animate-pulse">💡 {aiHint}</div>}

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
              {currentQuestion?.options.map((opt, i) => (
                <button 
                  key={i} 
                  onClick={() => handleAnswer(opt)}
                  disabled={isAnswered}
                  className={`p-6 rounded-2xl border-2 font-bold text-lg transition-all active:scale-95 ${
                    isAnswered && opt === currentQuestion.answer ? 'bg-green-600 border-green-400' :
                    isAnswered && selectedOption === opt ? 'bg-red-600 border-red-400' :
                    'bg-slate-900 border-slate-800 hover:border-yellow-500'
                  }`}
                >
                  {opt}
                </button>
              ))}
           </div>
           
           <div className="flex gap-4">
             <button onClick={callAiJoker} disabled={isAnswered || usedJokers.includes('ai') || stats.inventory.ai_joker <= 0} className="flex items-center gap-2 bg-blue-600 px-6 py-3 rounded-full font-bold disabled:opacity-30">
                <Sparkles size={18} /> AI ({stats.inventory.ai_joker})
             </button>
             <button onClick={() => endGame(score, true)} className="text-slate-500 uppercase text-xs font-bold tracking-widest hover:text-white transition-colors">Çekil ve Puanı Al</button>
           </div>
        </div>
      </div>
    );
  }

  if (screen === 'result') {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-slate-900 p-12 rounded-[4rem] border border-slate-800 shadow-2xl max-w-md w-full">
          <Trophy size={100} className="text-yellow-500 mx-auto mb-6 animate-bounce" />
          <h2 className="text-4xl font-black mb-2 italic">OYUN BİTTİ</h2>
          <div className="text-6xl font-black text-yellow-500 mb-8">{score.toLocaleString()} <span className="text-xl opacity-50">PT</span></div>
          
          <div className="space-y-4">
            <button onClick={() => setScreen('home')} className="w-full py-5 bg-slate-800 rounded-2xl font-black hover:bg-slate-700">ANA MENÜ</button>
            <button onClick={startQuiz} className="w-full py-5 bg-yellow-500 text-black rounded-2xl font-black hover:bg-yellow-400">YENİDEN DENE</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}