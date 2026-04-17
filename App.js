import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Trophy, Scissors, Timer, X, Play, Globe2, Star, BarChart3, 
  Sparkles, Loader2, Coins, Heart, Wand2, History, RotateCw, 
  Settings2, ShieldCheck, ShoppingCart, Clock, Zap, Award, 
  DoorOpen, ChevronRight
} from 'lucide-react';

// --- SABİTLER ---
const MAX_HEARTS = 5;
const REGEN_TIME = 30 * 60 * 1000; 

const FALLBACK_QUESTIONS = [
  { id: 1, category: 'bilim', question: "Gökyüzünün mavi görünmesinin temel sebebi nedir?", options: ["Işığın kırılması", "Rayleigh saçılması", "Bulutların yansıması", "Ozon tabakası"], answer: "Rayleigh saçılması", difficulty: "kolay", explanation: "Kısa dalga boylu mavi ışık atmosferde daha fazla saçılır.", puan: 1000 },
  { id: 2, category: 'bilim', question: "Atomun çekirdeğinde hangi parçacıklar bulunur?", options: ["Proton ve Elektron", "Proton ve Nötron", "Elektron ve Nötron", "Sadece Proton"], answer: "Proton ve Nötron", difficulty: "orta", explanation: "Proton ve Nötron merkezde bulunur.", puan: 2000 },
  { id: 3, category: 'bilim', question: "Sıvı haldeki tek metal hangisidir?", options: ["Cıva", "Kurşun", "Çinko", "Kalay"], answer: "Cıva", difficulty: "orta", explanation: "Cıva oda sıcaklığında sıvıdır.", puan: 3000 },
  { id: 5, category: 'bilim', question: "Güneş sistemindeki en büyük gezegen?", options: ["Satürn", "Neptün", "Jüpiter", "Uranüs"], answer: "Jüpiter", difficulty: "kolay", explanation: "Jüpiter bir gaz devidir.", puan: 5000 },
  { id: 31, category: 'genel', question: "Türkiye'nin başkenti neresidir?", options: ["İstanbul", "Ankara", "İzmir", "Bursa"], answer: "Ankara", difficulty: "kolay", explanation: "13 Ekim 1923.", puan: 1000 },
  { id: 62, category: 'sanat', question: "Mona Lisa tablosunu kim çizmiştir?", options: ["Picasso", "Da Vinci", "Michelangelo", "Dali"], answer: "Da Vinci", difficulty: "kolay", explanation: "Leonardo da Vinci eseri.", puan: 5000 }
];

const REWARDS_LIST = Array.from({ length: 30 }, (_, i) => {
  const step = i + 1;
  let val = step <= 10 ? step * 1000 : step <= 20 ? 10000 + (step - 10) * 9000 : 100000 + (step - 20) * 90000;
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

// Modernized Fetch (Controller eklenerek timeout desteği sağlandı)
const fetchGemini = async (payload) => {
  const apiKey = "YOUR_API_KEY"; // Burayı kendi keyinle doldurmalısın Ahmet
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error('API Error');
    return await response.json();
  } catch (err) {
    console.error("Gemini Error:", err);
    throw err;
  }
};

export default function App() {
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('quiz_master_v3_state');
    const defaultStats = {
      username: "Ahmet",
      avatar: "🚀",
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
    return saved ? { ...defaultStats, ...JSON.parse(saved) } : defaultStats;
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
  
  // Modals
  const [showShop, setShowShop] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [tempUsername, setTempUsername] = useState(stats.username);
  const [nextHeartTime, setNextHeartTime] = useState("");

  const currentQuestion = useMemo(() => gameQuestions[currentQuestionIndex], [gameQuestions, currentQuestionIndex]);

  const saveStats = useCallback((newStats) => {
    setStats(newStats);
    localStorage.setItem('quiz_master_v3_state', JSON.stringify(newStats));
  }, []);

  // Kalp Yenilenme Mantığı (Modernize edildi)
  const updateHearts = useCallback(() => {
    const now = Date.now();
    const diff = now - stats.lastHeartRegen;
    const earnedHearts = Math.floor(diff / REGEN_TIME);

    if (stats.hearts < MAX_HEARTS && earnedHearts > 0) {
      const newHearts = Math.min(MAX_HEARTS, stats.hearts + earnedHearts);
      const newRegenTime = newHearts === MAX_HEARTS ? now : stats.lastHeartRegen + (earnedHearts * REGEN_TIME);
      saveStats({ ...stats, hearts: newHearts, lastHeartRegen: newRegenTime });
    }
  }, [stats, saveStats]);

  useEffect(() => {
    const interval = setInterval(() => {
      updateHearts();
      if (stats.hearts < MAX_HEARTS) {
        const remaining = Math.max(0, REGEN_TIME - (Date.now() - stats.lastHeartRegen));
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setNextHeartTime(`${mins}:${secs.toString().padStart(2, '0')}`);
      } else setNextHeartTime("");
    }, 1000);
    return () => clearInterval(interval);
  }, [stats.hearts, stats.lastHeartRegen, updateHearts]);

  useEffect(() => {
    let timerId;
    if (isTimerActive && timer > 0) {
      timerId = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0 && isTimerActive) {
      endGame(guaranteedScore, false);
    }
    return () => clearInterval(timerId);
  }, [isTimerActive, timer, guaranteedScore]);

  const startQuiz = () => {
    if (stats.hearts <= 0) return;
    const pool = selectedCategory === 'all' ? FALLBACK_QUESTIONS : FALLBACK_QUESTIONS.filter(q => q.category === selectedCategory);
    const selected = [...pool].sort(() => Math.random() - 0.5).slice(0, 30);
    
    setGameQuestions(selected);
    setScore(0);
    setGuaranteedScore(0);
    setUsedJokers([]);
    setCurrentQuestionIndex(0);
    setTimer(selected[0]?.difficulty === 'zor' ? 15 : 20);
    setIsTimerActive(true);
    setIsAnswered(false);
    setSelectedOption(null);
    setAiHint(null);
    setScreen('quiz');
  };

  const handleAnswer = (option) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
    setIsTimerActive(false);
    const isCorrect = option === currentQuestion.answer;

    setTimeout(() => {
      if (isCorrect) {
        const nextScore = REWARDS_LIST[currentQuestionIndex]?.val || 0;
        setScore(nextScore);
        if (REWARDS_LIST[currentQuestionIndex]?.isSafe) setGuaranteedScore(nextScore);
        
        if (currentQuestionIndex === gameQuestions.length - 1) {
          endGame(nextScore, true);
        } else {
          const nextIdx = currentQuestionIndex + 1;
          setCurrentQuestionIndex(nextIdx);
          setTimer(gameQuestions[nextIdx]?.difficulty === 'zor' ? 15 : 20);
          setIsTimerActive(true);
          setIsAnswered(false);
          setSelectedOption(null);
          setAiHint(null);
        }
      } else {
        endGame(guaranteedScore, false);
      }
    }, 1200);
  };

  const endGame = (finalScore, isWin) => {
    setIsTimerActive(false);
    const earnedXp = (currentQuestionIndex + 1) * 100 + (isWin ? 1000 : 0);
    const newXp = stats.xp + earnedXp;
    const newLevel = Math.floor(newXp / 1000) + 1;

    saveStats({
      ...stats,
      highScore: Math.max(stats.highScore, finalScore),
      totalGames: stats.totalGames + 1,
      totalPoints: stats.totalPoints + finalScore,
      balance: stats.balance + Math.floor(finalScore / 10),
      xp: newXp,
      level: newLevel,
      hearts: Math.max(0, stats.hearts - (isWin ? 0 : 1)),
      lastHeartRegen: (stats.hearts === MAX_HEARTS && !isWin) ? Date.now() : stats.lastHeartRegen,
      gameHistory: [{ score: finalScore, date: new Date().toLocaleDateString(), questions: currentQuestionIndex + 1 }, ...(stats.gameHistory || [])].slice(0, 10)
    });
    setScreen('result');
  };

  const callAiJoker = async () => {
    if (isAiLoading || (stats.inventory?.ai_joker || 0) <= 0 || usedJokers.includes('ai')) return;
    setIsAiLoading(true);
    try {
      const data = await fetchGemini({
        contents: [{ parts: [{ text: `Soru: "${currentQuestion.question}". Seçenekler: ${currentQuestion.options.join(', ')}. Doğru cevabı söylemeden stratejik bir ipucu ver.` }] }]
      });
      setAiHint(data?.candidates?.[0]?.content?.parts?.[0]?.text || "Zihninizi zorlayın!");
      setUsedJokers(prev => [...prev, 'ai']);
      saveStats({ ...stats, inventory: { ...stats.inventory, ai_joker: stats.inventory.ai_joker - 1 } });
    } catch (e) { 
      setAiHint("Bağlantı kurulamadı."); 
    } finally { 
      setIsAiLoading(false); 
    }
  };

  const Modal = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-black uppercase text-yellow-500 tracking-tighter">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );

  if (screen === 'home') {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-3xl border border-slate-800">
            <div className="flex flex-col">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Heart key={i} size={18} className={i < stats.hearts ? "text-red-500 fill-red-500" : "text-slate-700"} />
                ))}
              </div>
              {nextHeartTime && <span className="text-[10px] text-slate-500 mt-1 font-bold">REGEN: {nextHeartTime}</span>}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-yellow-500 font-black bg-yellow-500/10 px-3 py-1 rounded-full">
                <Coins size={16} /> <span>{stats.balance.toLocaleString()}</span>
              </div>
              <button onClick={() => setShowSettings(true)} className="p-2 bg-slate-800 rounded-xl"><Settings2 size={18} /></button>
            </div>
          </div>

          {/* User Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy size={80} /></div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-16 h-16 rounded-full bg-yellow-500 flex items-center justify-center text-3xl">{stats.avatar}</div>
              <div className="flex-1">
                <h2 className="text-xl font-black uppercase tracking-tight">{stats.username}</h2>
                <p className="text-yellow-500 text-xs font-bold uppercase tracking-widest">
                  {RANK_TITLES.filter(t => stats.level >= t.minLevel).pop()?.name} (Seviye {stats.level})
                </p>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-2">
                  <div className="bg-yellow-500 h-full rounded-full transition-all duration-500" style={{ width: `${(stats.xp % 1000) / 10}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <h1 className="text-5xl font-black text-center text-transparent bg-clip-text bg-gradient-to-b from-white to-yellow-600 italic py-4 tracking-tighter">
            KODIUM <span className="text-sm block not-italic text-slate-500">v3.3 ULTIMATE</span>
          </h1>

          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES_DATA.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} 
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${selectedCategory === cat.id ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-600'}`}>
                {cat.icon}<span className="text-[8px] font-black">{cat.name}</span>
              </button>
            ))}
          </div>

          <button onClick={startQuiz} disabled={stats.hearts <= 0} 
            className="w-full py-6 rounded-[2.5rem] bg-gradient-to-r from-yellow-600 to-yellow-400 text-slate-950 font-black text-2xl shadow-[0_10px_30px_rgba(202,138,4,0.3)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all">
            {stats.hearts > 0 ? 'MEYDAN OKU' : 'CANIN BİTTİ'}
          </button>

          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => setShowStats(true)} className="flex flex-col items-center p-4 bg-slate-900/50 rounded-2xl border border-slate-800"><BarChart3 size={20} className="text-blue-400" /><span className="text-[8px] mt-1 font-bold uppercase">Kariyer</span></button>
            <button onClick={() => setShowShop(true)} className="flex flex-col items-center p-4 bg-slate-900/50 rounded-2xl border border-slate-800"><ShoppingCart size={20} className="text-purple-400" /><span className="text-[8px] mt-1 font-bold uppercase">Market</span></button>
            <button onClick={() => setShowHistory(true)} className="flex flex-col items-center p-4 bg-slate-900/50 rounded-2xl border border-slate-800"><History size={20} className="text-green-400" /><span className="text-[8px] mt-1 font-bold uppercase">Geçmiş</span></button>
          </div>
        </div>

        {/* Modals Logic */}
        {showShop && (
          <Modal title="Market" onClose={() => setShowShop(false)}>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400"><Sparkles /></div>
                  <div><p className="font-bold">AI İpucu</p><p className="text-[10px] text-slate-500 italic">Gemini destekli strateji.</p></div>
                </div>
                <button onClick={() => { if(stats.balance >= 1000) saveStats({...stats, balance: stats.balance - 1000, inventory: {...stats.inventory, ai_joker: (stats.inventory.ai_joker || 0) + 1}})}} className="bg-yellow-500 text-black px-4 py-2 rounded-xl font-bold">1.000 G</button>
              </div>
            </div>
          </Modal>
        )}
        
        {showStats && (
          <Modal title="İstatistikler" onClose={() => setShowStats(false)}>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 rounded-2xl text-center border border-slate-800"><p className="text-xs opacity-50 uppercase font-black">En Yüksek</p><p className="text-2xl font-black text-yellow-500">{stats.highScore.toLocaleString()}</p></div>
              <div className="p-4 bg-slate-950 rounded-2xl text-center border border-slate-800"><p className="text-xs opacity-50 uppercase font-black">Maç Sayısı</p><p className="text-2xl font-black">{stats.totalGames}</p></div>
              <div className="col-span-2 p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center"><p className="text-xs opacity-50 uppercase font-black">Toplam Puan</p><p className="text-xl font-bold">{stats.totalPoints.toLocaleString()} PT</p></div>
            </div>
          </Modal>
        )}

        {showSettings && (
          <Modal title="Ayarlar" onClose={() => setShowSettings(false)}>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2">İsim Güncelle</label>
                <input type="text" className="w-full bg-slate-950 p-4 rounded-xl mt-1 border border-slate-800 focus:border-yellow-500 outline-none" value={tempUsername} onChange={(e) => setTempUsername(e.target.value)} />
              </div>
              <button onClick={() => {saveStats({...stats, username: tempUsername}); setShowSettings(false);}} className="w-full bg-blue-600 py-3 rounded-xl font-bold">GÜNCELLE</button>
            </div>
          </Modal>
        )}

        {showHistory && (
          <Modal title="Oyun Geçmişi" onClose={() => setShowHistory(false)}>
            <div className="space-y-2">
              {stats.gameHistory?.length > 0 ? stats.gameHistory.map((h, i) => (
                <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div><p className="font-bold text-yellow-500">{h.score.toLocaleString()} PT</p><p className="text-[10px] text-slate-500">{h.date}</p></div>
                  <div className="text-[10px] font-black bg-slate-800 px-2 py-1 rounded-md">{h.questions} SORU</div>
                </div>
              )) : <p className="text-center text-slate-500 py-10">Henüz oyun verisi yok.</p>}
            </div>
          </Modal>
        )}
      </div>
    );
  }

  if (screen === 'quiz') {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex flex-col">
        {/* Progress Bar */}
        <div className="p-4 flex gap-2 overflow-x-auto bg-slate-900 border-b border-slate-800 no-scrollbar sticky top-0 z-10">
           {REWARDS_LIST.map((r, i) => (
             <div key={i} className={`px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${i === currentQuestionIndex ? 'bg-yellow-500 text-black scale-110 shadow-lg' : i < currentQuestionIndex ? 'bg-green-600/20 text-green-500' : 'bg-slate-800 text-slate-400'}`}>
               {r.isSafe && "🔒 "}{r.amount} PT
             </div>
           ))}
        </div>

        <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-8 max-w-4xl mx-auto w-full">
           <div className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center transition-all ${timer < 5 ? 'border-red-500 text-red-500 animate-pulse' : 'border-yellow-500 text-yellow-500'}`}>
              <span className="text-3xl font-black">{timer}</span>
              <Timer size={14} />
           </div>

           <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 w-full text-center shadow-2xl relative animate-in fade-in duration-500">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-6 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">SORU {currentQuestionIndex + 1} / 30</span>
              <h2 className="text-xl md:text-3xl font-bold leading-relaxed">{currentQuestion?.question}</h2>
           </div>

           {aiHint && (
             <div className="bg-blue-900/20 text-blue-400 p-4 rounded-2xl border border-blue-800/50 italic text-sm animate-in slide-in-from-top-4">
               <div className="flex items-center gap-2 mb-1 font-bold not-italic uppercase text-[10px]"><Sparkles size={12}/> Gemini Diyor ki:</div>
               {aiHint}
             </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {currentQuestion?.options.map((opt, i) => (
                <button key={i} onClick={() => handleAnswer(opt)} disabled={isAnswered}
                  className={`p-5 rounded-[1.5rem] border-2 font-bold transition-all text-lg ${
                    isAnswered && opt === currentQuestion.answer ? 'bg-green-600 border-green-400 shadow-[0_0_30px_rgba(34,197,94,0.3)]' :
                    isAnswered && selectedOption === opt ? 'bg-red-600 border-red-400' :
                    'bg-slate-900 border-slate-800 hover:border-yellow-500 active:scale-95'
                  }`}>
                  {opt}
                </button>
              ))}
           </div>

           <div className="flex gap-4 w-full">
             <button onClick={callAiJoker} disabled={isAnswered || usedJokers.includes('ai') || (stats.inventory?.ai_joker || 0) <= 0} 
               className="flex-1 flex items-center justify-center gap-2 bg-blue-600 py-4 rounded-2xl font-black shadow-lg disabled:opacity-30 transition-all hover:bg-blue-500">
                {isAiLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />} AI JOKER ({stats.inventory?.ai_joker || 0})
             </button>
             <button onClick={() => endGame(score, true)} className="flex-1 flex items-center justify-center gap-2 bg-slate-800 py-4 rounded-2xl font-black text-slate-400 hover:text-white transition-all">
                <DoorOpen size={20} /> ÇEKİL (GARANTİ: {guaranteedScore})
             </button>
           </div>
        </div>
      </div>
    );
  }

  if (screen === 'result') {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-500">
          <div className="relative inline-block mb-6">
            <Trophy size={100} className="text-yellow-500 animate-bounce" />
            <Sparkles className="absolute -top-2 -right-2 text-blue-400 animate-pulse" size={30} />
          </div>
          <h2 className="text-3xl font-black mb-2 italic tracking-tighter uppercase">SEFER BİTTİ</h2>
          <p className="text-slate-500 text-xs font-bold uppercase mb-4 tracking-widest">Toplam Kazanç</p>
          <div className="text-6xl font-black text-yellow-500 mb-8 drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]">{score.toLocaleString()} <span className="text-lg opacity-50 font-normal">PT</span></div>
          
          <div className="space-y-3">
            <button onClick={startQuiz} className="w-full py-5 bg-yellow-500 text-black rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
              <RotateCw size={20} /> YENİDEN BAŞLA
            </button>
            <button onClick={() => setScreen('home')} className="w-full py-4 bg-slate-800 rounded-2xl font-black text-slate-400 hover:text-white transition-all">ANA MENÜYE DÖN</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
