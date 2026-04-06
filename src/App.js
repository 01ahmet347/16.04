import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Trophy, 
  Users, 
  Phone, 
  Scissors, 
  Timer, 
  RefreshCcw, 
  Settings, 
  LayoutDashboard,
  X,
  CheckCircle2,
  AlertCircle,
  Play,
  Volume2,
  VolumeX,
  ArrowUpCircle,
  Zap,
  Repeat2,
  Globe2,
  Star,
  BarChart3,
  ShoppingBag,
  Award,
  Medal,
  Flame,
  Target,
  Sparkles,
  Loader2,
  Coins,
  Heart,
  User,
  Calendar,
  Wand2,
  Edit3,
  Check,
  Megaphone,
  Eye,
  Flag,
  History,
  TrendingUp,
  RotateCw,
  Gift,
  DoorOpen,
  Settings2,
  ShieldCheck,
  RotateCcw,
  Trash2
} from 'lucide-react';

// --- GENİŞLETİLMİŞ SORU HAVUZU (HER BÖLÜM İÇİN ÖRNEKLER) ---
// Not: Gerçek uygulamada bu liste 90+ soruya kadar statik veya dinamik olarak genişletilebilir.
const FALLBACK_QUESTIONS = [
  // BİLİM (30 Soru Altyapısı)
  { id: 1, category: 'bilim', question: "Gökyüzünün mavi görünmesinin temel sebebi nedir?", options: ["Işığın kırılması", "Rayleigh saçılması", "Bulutların yansıması", "Ozon tabakası"], answer: "Rayleigh saçılması", difficulty: "kolay", difficultyLevel: 20, globalRate: 85, explanation: "Güneş ışığı atmosfere girdiğinde, mavi ışık hava molekülleri tarafından her yöne saçılır.", puan: 1000 },
  { id: 2, category: 'bilim', question: "Atomun çekirdeğinde hangi parçacıklar bulunur?", options: ["Proton ve Elektron", "Proton ve Nötron", "Elektron ve Nötron", "Sadece Proton"], answer: "Proton ve Nötron", difficulty: "orta", difficultyLevel: 45, globalRate: 60, explanation: "Elektronlar çekirdek etrafındaki katmanlarda döner.", puan: 5000 },
  { id: 3, category: 'bilim', question: "Sıvı haldeki tek metal hangisidir?", options: ["Cıva", "Kurşun", "Çinko", "Kalay"], answer: "Cıva", difficulty: "orta", difficultyLevel: 50, globalRate: 58, explanation: "Cıva, oda sıcaklığında sıvı halde bulunur.", puan: 15000 },
  { id: 4, category: 'bilim', question: "Schrödinger'in Kedisi deneyi hangi fizik alanıyla ilgilidir?", options: ["Termodinamik", "Klasik Mekanik", "Kuantum Mekaniği", "Optik"], answer: "Kuantum Mekaniği", difficulty: "uzman", difficultyLevel: 95, globalRate: 12, explanation: "Bu deney kuantum süperpozisyon ilkesini açıklar.", puan: 1000000 },
  // GENEL KÜLTÜR
  { id: 31, category: 'genel', question: "Dünyanın en derin noktası Mariana Çukuru hangi okyanustadır?", options: ["Hint", "Atlantik", "Büyük Okyanus", "Arktik"], answer: "Büyük Okyanus", difficulty: "zor", difficultyLevel: 80, globalRate: 28, explanation: "Pasifik Okyanusu'nun (Büyük Okyanus) batısındadır.", puan: 100000 },
  { id: 32, category: 'genel', question: "Hangi ülke en çok adaya sahiptir?", options: ["Endonezya", "Filipinler", "İsveç", "Yunanistan"], answer: "İsveç", difficulty: "uzman", difficultyLevel: 95, globalRate: 15, explanation: "İsveç'in 220.000'den fazla adası vardır.", puan: 1000000 },
  { id: 33, category: 'genel', question: "Eyfel Kulesi hangi şehirdedir?", options: ["Londra", "Roma", "Paris", "Berlin"], answer: "Paris", difficulty: "kolay", difficultyLevel: 5, globalRate: 98, explanation: "Paris'in sembolüdür.", puan: 1000 },
  // SANAT
  { id: 61, category: 'sanat', question: "Kaplumbağa Terbiyecisi tablosu kime aittir?", options: ["Osman Hamdi Bey", "Şeker Ahmet Paşa", "İbrahim Çallı", "Bedri Rahmi"], answer: "Osman Hamdi Bey", difficulty: "orta", difficultyLevel: 55, globalRate: 45, explanation: "Osman Hamdi Bey'in 1906 yapımı başyapıtıdır.", puan: 15000 },
  { id: 62, category: 'sanat', question: "Guernica tablosu kime aittir?", options: ["Picasso", "Matisse", "Warhol", "Pollock"], answer: "Picasso", difficulty: "zor", difficultyLevel: 75, globalRate: 35, explanation: "İspanya İç Savaşı'nı anlatan dev bir tablodur.", puan: 100000 }
];

const CATEGORIES = [
  { id: 'all', name: 'Karışık', icon: <Globe2 size={20} /> },
  { id: 'genel', name: 'Genel Kültür', icon: <Star size={20} /> },
  { id: 'bilim', name: 'Bilim', icon: <Zap size={20} /> },
  { id: 'sanat', name: 'Sanat', icon: <Award size={20} /> }
];

const REWARDS = [
  { amount: "1.000", isSafe: false },
  { amount: "5.000", isSafe: true },
  { amount: "15.000", isSafe: false },
  { amount: "100.000", isSafe: true },
  { amount: "1.000.000", isSafe: false }
];

const TITLES = [
  { minLevel: 1, name: "Çaylak" },
  { minLevel: 5, name: "Bilge" },
  { minLevel: 10, name: "Üstat" },
  { minLevel: 15, name: "Ordinaryüs" }
];

const AVATARS = ["👤", "🧙‍♂️", "👩‍🚀", "🦸‍♀️", "🧐", "🧠", "🔥", "💎", "👾", "🤖"];

export default function App() {
  // --- STATES ---
  const [screen, setScreen] = useState('home');
  const [showStats, setShowStats] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [showAiGen, setShowAiGen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [gameQuestions, setGameQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [streakMsg, setStreakMsg] = useState("");
  const [guaranteedScore, setGuaranteedScore] = useState(0);
  const [timer, setTimer] = useState(20);
  const [maxTime, setMaxTime] = useState(20);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [usedJokers, setUsedJokers] = useState([]);
  const [hiddenOptions, setHiddenOptions] = useState([]);
  const [audiencePoll, setAudiencePoll] = useState(null);
  const [aiHint, setAiHint] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDoubleDipActive, setIsDoubleDipActive] = useState(false);
  const [firstWrongSelection, setFirstWrongSelection] = useState(null);

  const [stats, setStats] = useState({
    username: "Oyuncu",
    avatar: "👤",
    highScore: 0,
    totalGames: 0,
    totalPoints: 0,
    level: 1,
    xp: 0,
    correctAnswers: 0,
    achievements: [],
    balance: 5000,
    hearts: 3,
    lastDailyReward: null,
    lastSpin: null,
    inventory: { ai_joker: 2, double_dip: 2, heart: 0 },
    gameHistory: [],
    mastery: { bilim: 0, genel: 0, sanat: 0 }
  });

  const [tempUsername, setTempUsername] = useState("");

  // Verileri Yükle
  useEffect(() => {
    const savedStats = localStorage.getItem('quiz_master_v13_stats');
    if (savedStats) {
      const parsed = JSON.parse(savedStats);
      setStats(parsed);
      setTempUsername(parsed.username);
    } else {
      setTempUsername("Oyuncu");
    }
  }, []);

  const saveStats = (newStats) => {
    setStats(newStats);
    localStorage.setItem('quiz_master_v13_stats', JSON.stringify(newStats));
  };

  const currentQuestion = gameQuestions[currentQuestionIndex];
  const userTitle = TITLES.filter(t => stats.level >= t.minLevel).pop()?.name || "Yolcu";

  // --- TIMER ---
  useEffect(() => {
    let interval;
    if (isTimerActive && timer > 0 && !isAnswered) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0 && !isAnswered) {
      handleAnswer(null);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer, isAnswered]);

  // --- ŞANS ÇARKI MANTIĞI ---
  const handleSpin = () => {
    if (isSpinning) return;
    const today = new Date().toDateString();
    if (stats.lastSpin === today) {
      setSpinResult({ msg: "Bugün zaten çevirdin! Yarın gel.", isError: true });
      return;
    }

    setIsSpinning(true);
    setSpinResult(null);

    // 2 saniye animasyon simülasyonu
    setTimeout(() => {
      const outcomes = [
        { name: "500 Coin", type: "coin", val: 500, icon: <Coins className="text-yellow-500" /> },
        { name: "1 Can", type: "heart", val: 1, icon: <Heart className="text-red-500" /> },
        { name: "AI Joker", type: "joker", val: "ai_joker", icon: <Sparkles className="text-blue-500" /> },
        { name: "2000 Coin", type: "coin", val: 2000, icon: <Coins className="text-yellow-400" /> },
        { name: "Çift Hak", type: "joker", val: "double_dip", icon: <Repeat2 className="text-orange-500" /> }
      ];
      
      const win = outcomes[Math.floor(Math.random() * outcomes.length)];
      setSpinResult(win);

      let ns = { ...stats, lastSpin: today };
      if (win.type === 'coin') ns.balance += win.val;
      if (win.type === 'heart') ns.hearts = Math.min(5, ns.hearts + 1);
      if (win.type === 'joker') ns.inventory[win.val]++;
      
      saveStats(ns);
      setIsSpinning(false);
    }, 2000);
  };

  // --- AI SORU ÜRETİCİ ---
  const generateCustomQuiz = async () => {
    if (!customTopic || isAiGenerating) return;
    setIsAiGenerating(true);
    const apiKey = ""; 
    const prompt = `Create 5 multiple choice questions about "${customTopic}" in Turkish. Output ONLY JSON array of objects with question, options, answer, explanation, difficulty, puan. Ensure difficulty increases.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const data = await response.json();
      const parsed = JSON.parse(data.candidates[0].content.parts[0].text);
      setGameQuestions(parsed);
      startQuizLogic(parsed);
      setShowAiGen(false);
    } catch (err) { console.error(err); }
    finally { setIsAiGenerating(false); }
  };

  // --- AI JOKER ---
  const callGeminiAI = async () => {
    if (!currentQuestion || usedJokers.includes('ai') || isAnswered || isAiLoading) return;
    if (stats.inventory.ai_joker <= 0) return;

    setIsAiLoading(true);
    const apiKey = "";
    const systemPrompt = "Sorunun cevabını söylemeden bilgece bir ipucu ver.";
    const userPrompt = `Soru: ${currentQuestion.question}\nŞıklar: ${currentQuestion.options.join(", ")}`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] }
        })
      });
      const data = await response.json();
      setAiHint(data.candidates[0].content.parts[0].text);
      setUsedJokers([...usedJokers, 'ai']);
      saveStats({...stats, inventory: {...stats.inventory, ai_joker: stats.inventory.ai_joker - 1}});
    } catch (err) { setAiHint("AI bağlantı hatası!"); }
    finally { setIsAiLoading(false); }
  };

  // --- OYUN MANTIĞI ---
  const startQuiz = () => {
    if (stats.hearts <= 0) return;
    let pool = selectedCategory === 'all' ? FALLBACK_QUESTIONS : FALLBACK_QUESTIONS.filter(q => q.category === selectedCategory);
    const selected = pool.sort(() => 0.5 - Math.random()).slice(0, 5).sort((a, b) => a.puan - b.puan);
    setGameQuestions(selected);
    startQuizLogic(selected);
  };

  const startQuizLogic = (questions) => {
    setScreen('quiz');
    setStreak(0);
    resetQuestionState(0, questions[0]);
    setScore(0);
    setGuaranteedScore(0);
    setUsedJokers([]);
  };

  const resetQuestionState = (index, questionData) => {
    const q = questionData || gameQuestions[index];
    if (!q) return;
    setCurrentQuestionIndex(index);
    setTimer(q.difficulty === 'uzman' ? 10 : 20);
    setMaxTime(q.difficulty === 'uzman' ? 10 : 20);
    setIsTimerActive(true);
    setSelectedOption(null);
    setIsAnswered(false);
    setHiddenOptions([]);
    setAudiencePoll(null);
    setAiHint(null);
    setFirstWrongSelection(null);
    setStreakMsg("");
  };

  const handleAnswer = (option) => {
    if (isAnswered && !isDoubleDipActive) return;
    if (!currentQuestion) return;
    const isCorrect = option === currentQuestion.answer;

    if (isDoubleDipActive && !isCorrect && !firstWrongSelection && option !== null) {
      setFirstWrongSelection(option);
      return;
    }

    setSelectedOption(option);
    setIsAnswered(true);
    setIsTimerActive(false);

    setTimeout(() => {
      if (isCorrect) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak >= 3) setStreakMsg("MÜKEMMEL!");
        const currentPuan = Math.floor(currentQuestion.puan * (1 + (newStreak * 0.1)));
        setScore(currentPuan);
        if (REWARDS[currentQuestionIndex]?.isSafe) setGuaranteedScore(currentPuan);
        if (currentQuestionIndex === gameQuestions.length - 1) endGame(currentPuan, true);
        else setTimeout(() => resetQuestionState(currentQuestionIndex + 1), 1500);
      } else {
        endGame(guaranteedScore, false);
      }
    }, 1500);
  };

  // --- ÇEKİLME ---
  const handleWithdraw = () => {
    if (isAnswered || currentQuestionIndex === 0) return;
    const withdrawAmount = gameQuestions[currentQuestionIndex - 1]?.puan || 0;
    endGame(withdrawAmount, true);
  };

  const endGame = (finalScore, isWin) => {
    const cat = currentQuestion?.category || 'genel';
    const newStats = {
      ...stats,
      highScore: Math.max(stats.highScore, finalScore),
      totalGames: stats.totalGames + 1,
      totalPoints: stats.totalPoints + finalScore,
      balance: stats.balance + (finalScore / 10),
      xp: stats.xp + (isWin ? 500 : 100),
      hearts: Math.max(0, stats.hearts - (isWin ? 0 : 1)),
      mastery: { ...stats.mastery, [cat]: Math.min(100, (stats.mastery[cat] || 0) + (isWin ? 5 : 1)) },
      gameHistory: [{ score: finalScore, isWin, date: new Date().toLocaleDateString() }, ...stats.gameHistory].slice(0, 5)
    };
    saveStats(newStats);
    setScreen('result');
  };

  const resetAllData = () => {
    localStorage.removeItem('quiz_master_v13_stats');
    window.location.reload();
  };

  const buyItem = (k, c) => {
    if (stats.balance >= c) {
      let ns = { ...stats, balance: stats.balance - c };
      if (k === 'heart') ns.hearts = Math.min(5, ns.hearts + 1);
      else ns.inventory[k]++;
      saveStats(ns);
    }
  };

  const useJoker5050 = () => {
    if (!currentQuestion || usedJokers.includes('5050') || isAnswered) return;
    const wrong = currentQuestion.options.filter(opt => opt !== currentQuestion.answer).sort(() => 0.5 - Math.random()).slice(0, 2);
    setHiddenOptions(wrong);
    setUsedJokers([...usedJokers, '5050']);
  };

  // --- UI RENDER: HOME ---
  if (screen === 'home') {
    const spinReady = stats.lastSpin !== new Date().toDateString();
    
    return (
      <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-yellow-500/10 blur-[150px] rounded-full animate-pulse"></div>

        <div className="w-full max-w-md space-y-6 z-10">
          {/* Üst Bar */}
          <div className="flex justify-between items-center bg-slate-900/40 backdrop-blur-md p-4 rounded-3xl border border-slate-800">
             <div className="flex gap-1">
                {[...Array(5)].map((_, i) => <Heart key={i} size={18} className={i < stats.hearts ? "text-red-500 fill-red-500" : "text-slate-700"} />)}
             </div>
             <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-yellow-500 font-black"><Coins size={16} /><span>{Math.floor(stats.balance).toLocaleString()}</span></div>
                <button onClick={() => setShowSpinWheel(true)} className={`p-2 rounded-xl transition-all ${spinReady ? 'bg-orange-500 animate-bounce' : 'bg-slate-800 opacity-50'}`}><RotateCw size={18} /></button>
                <button onClick={() => setShowSettings(true)} className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"><Settings2 size={18} /></button>
             </div>
          </div>

          {/* Profil ve Ustalık */}
          <div className="bg-slate-900/60 p-5 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center gap-4">
                <button className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-purple-500 flex items-center justify-center text-3xl shadow-lg border-2 border-slate-700">{stats.avatar}</button>
                <div className="flex-1">
                  <p className="text-sm font-black uppercase tracking-widest">{stats.username} <span className="text-yellow-500 text-[10px] ml-2">{userTitle}</span></p>
                  <div className="w-full h-2 bg-slate-800 rounded-full mt-2 overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${(stats.xp % 1000) / 10}%` }}></div></div>
                  <p className="text-[9px] text-slate-500 font-bold mt-1">Seviye {stats.level}</p>
                </div>
              </div>
              {/* Kategori Ustalığı */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                 {['bilim', 'genel', 'sanat'].map(k => (
                   <div key={k} className="space-y-1">
                      <p className="text-[8px] font-black uppercase text-slate-500 text-center">{k}</p>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500/50" style={{ width: `${stats.mastery[k] || 0}%` }}></div>
                      </div>
                   </div>
                 ))}
              </div>
          </div>

          <div className="text-center py-2"><h1 className="text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-400 to-yellow-800 leading-none">QUIZ<br/>MASTER</h1></div>

          <div className="grid grid-cols-4 gap-3">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all hover:scale-105 active:scale-95 ${selectedCategory === cat.id ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500 shadow-lg shadow-yellow-500/20' : 'bg-slate-900/50 border-slate-800 text-slate-500'}`}>{cat.icon}<span className="text-[8px] font-black uppercase tracking-widest">{cat.name}</span></button>
            ))}
          </div>

          <div className="space-y-3">
            <button onClick={startQuiz} disabled={stats.hearts <= 0} className={`w-full flex items-center justify-center gap-4 py-6 rounded-[2.5rem] font-black text-2xl shadow-xl transition-all ${stats.hearts > 0 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-slate-950 hover:scale-105 shadow-yellow-500/20 active:scale-95' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>{stats.hearts > 0 ? "YARIŞMAYA BAŞLA" : "CANIN BİTTİ"}</button>
            
            <button onClick={() => setShowAiGen(true)} className="w-full bg-blue-600/20 border-2 border-blue-500/50 text-blue-400 py-4 rounded-[2rem] font-black text-sm flex items-center justify-center gap-3 hover:bg-blue-600 hover:text-white transition-all active:scale-95"><Wand2 size={20} /> YAPAY ZEKA İLE SORU ÜRET</button>

            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => setShowStats(true)} className="flex flex-col items-center p-3 bg-slate-900/50 rounded-2xl border border-slate-800 hover:bg-slate-800 transition-all active:scale-95"><BarChart3 size={20} className="text-blue-400" /><span className="text-[8px] mt-1 font-bold">KARİYER</span></button>
              <button onClick={() => setShowShop(true)} className="flex flex-col items-center p-3 bg-slate-900/50 rounded-2xl border border-slate-800 hover:bg-slate-800 transition-all active:scale-95"><ShoppingBag size={20} className="text-purple-400" /><span className="text-[8px] mt-1 font-bold">MARKET</span></button>
              <button onClick={() => setShowHistory(true)} className="flex flex-col items-center p-3 bg-slate-900/50 rounded-2xl border border-slate-800 hover:bg-slate-800 transition-all active:scale-95"><History size={20} className="text-green-400" /><span className="text-[8px] mt-1 font-bold">GEÇMİŞ</span></button>
            </div>
          </div>
        </div>

        {/* --- MODALLAR --- */}
        
        {/* ŞANS ÇARKİ */}
        {showSpinWheel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
             <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[3rem] p-8 text-center space-y-6 relative overflow-hidden">
                <Trophy size={48} className="mx-auto text-yellow-500" />
                <h3 className="text-2xl font-black italic uppercase">Günlük Şans Çarkı</h3>
                <div className={`w-48 h-48 mx-auto rounded-full border-8 border-slate-800 flex items-center justify-center relative ${isSpinning ? 'animate-spin' : ''}`}>
                   <RotateCw size={64} className="text-yellow-500/20" />
                   <div className="absolute inset-0 flex items-center justify-center font-black text-4xl">{spinResult ? spinResult.icon : "?"}</div>
                </div>
                {spinResult && <p className={`font-bold ${spinResult.isError ? 'text-red-400' : 'text-green-400 animate-bounce'}`}>{spinResult.name || spinResult.msg}</p>}
                <button onClick={handleSpin} disabled={isSpinning || !spinReady} className="w-full bg-yellow-500 text-slate-950 py-4 rounded-2xl font-black transition-all active:scale-95 disabled:opacity-50">{isSpinning ? "DÖNÜYOR..." : spinReady ? "ÇEVİR VE KAZAN" : "YARIN TEKRAR GEL"}</button>
                <button onClick={() => setShowSpinWheel(false)} className="text-slate-500 font-bold uppercase text-xs">Kapat</button>
             </div>
          </div>
        )}

        {/* AYARLAR */}
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
             <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[3rem] p-8 space-y-6 relative">
                <div className="flex justify-between items-center"><h3 className="text-xl font-black italic uppercase">Ayarlar</h3><X className="cursor-pointer" onClick={() => setShowSettings(false)} /></div>
                <div className="space-y-4">
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Kullanıcı Adı</p>
                      <input 
                        type="text" 
                        className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl focus:border-blue-500 outline-none font-bold"
                        value={tempUsername}
                        onChange={(e) => setTempUsername(e.target.value)}
                        onBlur={() => saveStats({...stats, username: tempUsername || "Oyuncu"})}
                      />
                   </div>
                   <div className="flex justify-between items-center p-4 bg-slate-950 rounded-2xl">
                      <p className="font-bold">Ses Efektleri</p>
                      <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-slate-800 rounded-lg">{isMuted ? <VolumeX /> : <Volume2 />}</button>
                   </div>
                   <button onClick={resetAllData} className="w-full py-4 text-red-500 font-bold border border-red-500/20 rounded-2xl hover:bg-red-500/10 flex items-center justify-center gap-2"><Trash2 size={18} /> VERİLERİ SIFIRLA</button>
                </div>
             </div>
          </div>
        )}

        {/* AI GEN MODAL */}
        {showAiGen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
             <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[3rem] p-8 space-y-6 relative shadow-2xl">
                <button onClick={() => setShowAiGen(false)} className="absolute top-6 right-6 text-slate-500"><X /></button>
                <div className="text-center space-y-2">
                   <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20"><Wand2 size={32} /></div>
                   <h3 className="text-2xl font-black italic uppercase">Özel Yarışma Üret</h3>
                   <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] font-bold">İstediğin konuyu yaz, AI hazırlasın!</p>
                </div>
                <div className="space-y-4">
                  <input type="text" placeholder="Örn: Marvel, Bilgisayar Tarihi, Uzay..." className="w-full bg-slate-950 border-2 border-slate-800 p-5 rounded-2xl focus:border-blue-500 outline-none transition-all font-bold" value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} />
                  <button onClick={generateCustomQuiz} disabled={isAiGenerating || !customTopic} className="w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-xl transition-all disabled:opacity-50 active:scale-95">{isAiGenerating ? <><Loader2 className="animate-spin" /> ÜRETİLİYOR...</> : "MACERAYI BAŞLAT"}</button>
                </div>
             </div>
          </div>
        )}

        {/* MARKET MODAL */}
        {showShop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
             <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[3rem] p-8 space-y-4 relative">
                <div className="flex justify-between items-center"><h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2"><ShoppingBag className="text-purple-400" /> JOKER MARKET</h3><X className="cursor-pointer" onClick={() => setShowShop(false)} /></div>
                <div className="space-y-3">
                  {[{ k: 'heart', n: 'Can Paketi (+1)', c: 3000, i: <Heart className="text-red-500" /> }, { k: 'ai_joker', n: 'AI İpucu Joker', c: 2500, i: <Sparkles className="text-blue-500" /> }, { k: 'double_dip', n: 'Çift Hak Joker', c: 1500, i: <Repeat2 className="text-orange-500" /> }].map(it => (
                    <div key={it.k} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center group transition-colors hover:border-slate-600">
                       <div className="flex items-center gap-3">
                          {it.i}
                          <div><p className="font-bold text-sm">{it.n}</p><p className="text-[10px] text-slate-500">Stok: {stats.inventory[it.k] || (it.k === 'heart' ? stats.hearts : 0)}</p></div>
                       </div>
                       <button onClick={() => buyItem(it.k, it.c)} disabled={stats.balance < it.c} className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 ${stats.balance >= it.c ? 'bg-yellow-500 text-slate-950' : 'bg-slate-800 text-slate-600'}`}>{it.c} PT</button>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  // --- UI RENDER: QUIZ ---
  if (screen === 'quiz') {
    return (
      <div className={`min-h-screen transition-all duration-1000 p-4 flex flex-col md:flex-row gap-6 relative ${currentQuestion?.difficulty === 'uzman' ? 'bg-[#0a001a]' : 'bg-[#020617]'}`}>
        
        {/* YAN PANEL (REWARDS & WITHDRAW) */}
        <div className="hidden md:flex flex-col justify-between w-72 bg-slate-900/40 p-6 rounded-[3rem] border border-slate-800/50 backdrop-blur-lg shadow-2xl">
          <div className="space-y-2">
            <h3 className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest text-center">İlerleme Basamakları</h3>
            {[...REWARDS].reverse().map((reward, idx) => {
              const actualIndex = REWARDS.length - 1 - idx;
              const isCurrent = actualIndex === currentQuestionIndex;
              const isPassed = actualIndex < currentQuestionIndex;
              
              return (
                <div key={idx} className={`flex items-center justify-between p-3.5 rounded-[1.25rem] border-2 font-bold text-sm transition-all ${
                  isCurrent ? 'bg-yellow-500 text-slate-950 border-yellow-400 scale-105 shadow-xl' : 
                  reward.isSafe ? 'border-blue-500/50 bg-blue-500/10 text-blue-400' : 
                  isPassed ? 'text-yellow-500/40 border-transparent' : 'text-slate-700 border-transparent'
                }`}>
                  <span className="text-[10px] opacity-50">{actualIndex + 1}</span>
                  <span>{reward.amount} PT</span>
                  {reward.isSafe && <ShieldCheck size={14} />}
                </div>
              );
            })}
          </div>
          <button onClick={handleWithdraw} disabled={currentQuestionIndex === 0} className={`bg-red-500/20 text-red-500 border border-red-500/50 py-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white active:scale-95 ${currentQuestionIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}>
             <DoorOpen size={16} /> ÇEKİL (PUANI AL)
          </button>
        </div>

        <div className="flex-1 flex flex-col">
          {/* Üst Bar */}
          <div className="flex justify-between items-center mb-6 bg-slate-900/50 p-4 rounded-[2rem] border border-slate-800 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl border-[3px] flex items-center justify-center text-2xl font-black bg-slate-950 shadow-inner ${timer < 5 ? 'border-red-500 text-red-500 animate-pulse' : 'border-yellow-500 text-yellow-500'}`}>{timer}</div>
              <div className="hidden sm:block">
                <p className="text-[9px] text-slate-500 font-black uppercase mb-1 tracking-widest">Kategori</p>
                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">{currentQuestion?.category || 'Genel'}</p>
              </div>
            </div>
            <div className="flex gap-2.5">
              {[
                { id: '5050', icon: <Scissors size={20} />, act: useJoker5050, title: '50:50' },
                { id: 'ai', icon: isAiLoading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />, act: callGeminiAI, isSpecial: true, title: 'AI' },
                { id: 'double', icon: <Repeat2 size={20} />, act: () => setIsDoubleDipActive(true), title: 'Çift' }
              ].map(joker => (
                <div key={joker.id} className="relative group/btn">
                  <button onClick={joker.act} disabled={usedJokers.includes(joker.id) || isAnswered || isAiLoading || (joker.id === 'ai' && stats.inventory.ai_joker <= 0)} className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center border-2 transition-all active:scale-90 ${
                    usedJokers.includes(joker.id) ? 'opacity-30 border-slate-800' : 
                    joker.isSpecial ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-900 border-yellow-600/50 text-yellow-500'
                  }`}>
                    {joker.icon}
                  </button>
                  {joker.id === 'ai' && <span className="absolute -top-2 -right-2 bg-blue-500 text-[8px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900">{stats.inventory.ai_joker}</span>}
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase opacity-0 group-hover/btn:opacity-100 text-slate-500 transition-opacity whitespace-nowrap">{joker.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center space-y-10">
            {isDoubleDipActive && <div className="bg-yellow-500 text-slate-950 px-8 py-1.5 rounded-full text-xs font-black animate-bounce shadow-2xl uppercase flex items-center gap-2"><Repeat2 size={16}/> Çift Cevap Hakkı Aktif</div>}
            
            <div className="w-full max-w-4xl relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/10 to-yellow-600/10 rounded-[3.5rem] blur-2xl opacity-50 transition-opacity group-hover:opacity-100"></div>
              <div className="relative bg-[#0f172a]/80 backdrop-blur-xl border-2 border-slate-800 p-8 md:p-12 rounded-[3.5rem] shadow-2xl text-center">
                <h2 className="text-3xl font-black leading-tight tracking-tight">{currentQuestion?.question}</h2>
                <div className="mt-6 flex justify-center gap-4">
                  <div className="bg-slate-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase text-blue-400 border border-blue-500/30 flex items-center gap-2"><Target size={12}/> {currentQuestion?.difficulty}</div>
                  <div className="bg-slate-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase text-yellow-500 border border-yellow-500/30 flex items-center gap-2"><Eye size={12}/> %{currentQuestion?.globalRate || 50} Başarı</div>
                </div>
              </div>
            </div>

            {aiHint && <div className="w-full max-w-2xl bg-blue-600/10 border-2 border-blue-500/20 p-5 rounded-3xl text-center text-blue-200 font-bold animate-in zoom-in-95 flex items-center justify-center gap-3 italic text-sm shadow-xl"><Sparkles className="shrink-0 text-blue-400" /> "{aiHint}"</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl px-4">
              {currentQuestion?.options.map((opt, idx) => {
                const isCorrect = isAnswered && opt === currentQuestion.answer;
                const isWrong = isAnswered && selectedOption === opt && opt !== currentQuestion.answer;
                const isFirstWrong = firstWrongSelection === opt;

                return (
                  <button key={idx} onClick={() => handleAnswer(opt)} disabled={(isAnswered && !isDoubleDipActive) || hiddenOptions.includes(opt) || isFirstWrong} className={`relative p-6 rounded-[2rem] border-[3px] text-left font-black transition-all group ${hiddenOptions.includes(opt) ? 'opacity-0 invisible' : 'opacity-100'} ${isCorrect ? 'bg-green-600 border-green-400 scale-105 z-20 shadow-green-500/30' : isWrong || isFirstWrong ? 'bg-red-600 border-red-400 animate-shake opacity-50' : 'bg-slate-900 border-slate-800 hover:border-yellow-500/50 hover:bg-slate-800 active:scale-95'}`}>
                    <span className="mr-4 text-yellow-500 opacity-50 group-hover:opacity-100 transition-opacity">{String.fromCharCode(65+idx)}:</span> {opt}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- UI RENDER: RESULT ---
  if (screen === 'result') {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-xl bg-slate-900 rounded-[3.5rem] border-2 border-slate-800 p-14 text-center shadow-2xl animate-in zoom-in-90">
            <Trophy size={100} className="mx-auto mb-6 text-yellow-400 drop-shadow-2xl animate-bounce" />
            <h2 className="text-4xl font-black uppercase italic tracking-tighter">Yarışma Bitti</h2>
            <div className="text-8xl font-black text-yellow-400 my-6 tracking-tighter">{score.toLocaleString()}<span className="text-2xl ml-2 font-bold opacity-50 uppercase">Pt</span></div>
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 mb-8">
              <p className="text-slate-400 text-sm italic leading-relaxed">"{currentQuestion?.explanation || 'Harika bir performanstı!'}"</p>
            </div>
            <button onClick={() => setScreen('home')} className="w-full bg-slate-800 hover:bg-slate-700 py-6 rounded-[1.5rem] font-black uppercase mb-4 transition-all active:scale-95 border border-slate-700">ANA MENÜ</button>
            <button onClick={startQuiz} className="w-full bg-gradient-to-r from-yellow-600 to-yellow-400 text-slate-950 py-6 rounded-[1.5rem] font-black uppercase shadow-lg transition-all active:scale-95 hover:from-yellow-500 hover:to-yellow-300">YENİDEN DENE</button>
        </div>
      </div>
    );
  }

  return null;
}