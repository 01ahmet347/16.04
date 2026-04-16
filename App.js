import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Trophy, Users, Phone, Scissors, Timer, RefreshCcw, Settings, LayoutDashboard,
  X, CheckCircle2, AlertCircle, Play, Volume2, VolumeX, ArrowUpCircle, Zap,
  Repeat2, Globe2, Star, BarChart3, ShoppingBag, Award, Medal, Flame, Target,
  Sparkles, Loader2, Coins, Heart, User, Calendar, Wand2, Edit3, Check,
  Megaphone, Eye, Flag, History, TrendingUp, RotateCw, Gift, DoorOpen,
  Settings2, ShieldCheck, RotateCcw, Trash2, Compass, ChevronRight, ShoppingCart,
  List, Clock
} from 'lucide-react';

// --- SABİTLER ---
const MAX_HEARTS = 5;
const REGEN_TIME = 30 * 60 * 1000; // 30 Dakikada bir can (milisaniye)

// --- GENİŞLETİLMİŞ SORU HAVUZU ---
const FALLBACK_QUESTIONS = [
  { id: 1, category: 'bilim', question: "Gökyüzünün mavi görünmesinin temel sebebi nedir?", options: ["Işığın kırılması", "Rayleigh saçılması", "Bulutların yansıması", "Ozon tabakası"], answer: "Rayleigh saçılması", difficulty: "kolay", difficultyLevel: 20, globalRate: 85, explanation: "Kısa dalga boylu mavi ışık atmosferde daha fazla saçılır.", puan: 1000 },
  { id: 2, category: 'bilim', question: "Atomun çekirdeğinde hangi parçacıklar bulunur?", options: ["Proton ve Elektron", "Proton ve Nötron", "Elektron ve Nötron", "Sadece Proton"], answer: "Proton ve Nötron", difficulty: "orta", difficultyLevel: 45, globalRate: 60, explanation: "Proton ve Nötron merkezde bulunur.", puan: 2000 },
  { id: 3, category: 'bilim', question: "Sıvı haldeki tek metal hangisidir?", options: ["Cıva", "Kurşun", "Çinko", "Kalay"], answer: "Cıva", difficulty: "orta", difficultyLevel: 50, globalRate: 58, explanation: "Cıva oda sıcaklığında sıvıdır.", puan: 3000 },
  { id: 4, category: 'bilim', question: "DNA yapısını 1953'te kim modelledi?", options: ["Newton", "Watson ve Crick", "Tesla", "Einstein"], answer: "Watson ve Crick", difficulty: "zor", difficultyLevel: 65, globalRate: 40, explanation: "James Watson ve Francis Crick keşfetti.", puan: 4000 },
  { id: 5, category: 'bilim', question: "Güneş sistemindeki en büyük gezegen?", options: ["Satürn", "Neptün", "Jüpiter", "Uranüs"], answer: "Jüpiter", difficulty: "kolay", difficultyLevel: 10, globalRate: 92, explanation: "Jüpiter bir gaz devidir.", puan: 5000 },
  { id: 6, category: 'bilim', question: "Işık hızı saniyede yaklaşık kaç km'dir?", options: ["150.000", "300.000", "500.000", "1.000.000"], answer: "300.000", difficulty: "zor", difficultyLevel: 75, globalRate: 32, explanation: "Tam olarak 299.792 km/s.", puan: 6000 },
  { id: 7, category: 'bilim', question: "Suyun kimyasal formülü nedir?", options: ["H2O", "CO2", "NaCl", "CH4"], answer: "H2O", difficulty: "kolay", difficultyLevel: 0, globalRate: 100, explanation: "İki Hidrojen, bir Oksijen.", puan: 7000 },
  { id: 8, category: 'bilim', question: "Penisilini kim keşfetti?", options: ["Pasteur", "Fleming", "Koch", "Lister"], answer: "Fleming", difficulty: "zor", difficultyLevel: 80, globalRate: 25, explanation: "Alexander Fleming 1928'de buldu.", puan: 8000 },
  { id: 9, category: 'bilim', question: "Mutlak sıfır noktası kaç Kelvindir?", options: ["-273", "0", "100", "273"], answer: "0", difficulty: "uzman", difficultyLevel: 90, globalRate: 15, explanation: "0 Kelvin = -273.15 santigrat.", puan: 9000 },
  { id: 10, category: 'bilim', question: "Hangi kan grubu 'Genel Verici'dir?", options: ["A Rh+", "AB Rh-", "0 Rh-", "B Rh+"], answer: "0 Rh-", difficulty: "orta", difficultyLevel: 40, globalRate: 70, explanation: "0 Rh- herkese kan verebilir.", puan: 10000 },
  { id: 31, category: 'genel', question: "Türkiye'nin başkenti neresidir?", options: ["İstanbul", "Ankara", "İzmir", "Bursa"], answer: "Ankara", difficulty: "kolay", difficultyLevel: 0, globalRate: 100, explanation: "13 Ekim 1923.", puan: 1000 },
  { id: 32, category: 'genel', question: "Mariana Çukuru hangi okyanustadır?", options: ["Hint", "Atlantik", "Büyük Okyanus", "Arktik"], answer: "Büyük Okyanus", difficulty: "zor", difficultyLevel: 80, globalRate: 28, explanation: "Pasifik olarak da bilinir.", puan: 2000 },
  { id: 33, category: 'genel', question: "Hangi ülke en çok adaya sahiptir?", options: ["Endonezya", "Yunanistan", "İsveç", "Kanada"], answer: "İsveç", difficulty: "uzman", difficultyLevel: 95, globalRate: 12, explanation: "220.000'den fazla ada vardır.", puan: 1000000 },
  { id: 61, category: 'sanat', question: "Kaplumbağa Terbiyecisi tablosu kime aittir?", options: ["Osman Hamdi Bey", "Şeker Ahmet Paşa", "İbrahim Çallı", "Bedri Rahmi"], answer: "Osman Hamdi Bey", difficulty: "orta", difficultyLevel: 55, globalRate: 45, explanation: "1906 yapımı bir eserdir.", puan: 15000 },
  { id: 62, category: 'sanat', question: "Mona Lisa tablosunu kim çizmiştir?", options: ["Picasso", "Da Vinci", "Michelangelo", "Dali"], answer: "Da Vinci", difficulty: "kolay", difficultyLevel: 15, globalRate: 90, explanation: "Leonardo da Vinci eseri.", puan: 5000 }
];

// --- 30 ADIMLI ÖDÜL SİSTEMİ ---
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

const fetchGemini = async (payload, retries = 5) => {
  const apiKey = "";
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('API Error');
      return await response.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
};

export default function App() {
  // --- STATE INITIALIZATION (BELLEKTEN DOĞRUDAN OKUMA) ---
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
      correctAnswers: 0,
      balance: 5000,
      hearts: 5,
      lastHeartRegen: Date.now(),
      lastSpin: null,
      inventory: { ai_joker: 3, double_dip: 3 },
      gameHistory: []
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultStats, ...parsed };
      } catch (e) { return defaultStats; }
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
  const [streak, setStreak] = useState(0);
  const [usedJokers, setUsedJokers] = useState([]);
  const [hiddenOptions, setHiddenOptions] = useState([]);
  const [aiHint, setAiHint] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinReward, setSpinReward] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showShop, setShowShop] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAiGen, setShowAiGen] = useState(false);
  const [showFullRewards, setShowFullRewards] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [tempUsername, setTempUsername] = useState(stats.username);
  const [nextHeartTime, setNextHeartTime] = useState("");

  const scrollRef = useRef(null);
  const currentQuestion = gameQuestions && gameQuestions.length > 0 ? gameQuestions[currentQuestionIndex] : null;

  // --- SAVE LOGIC ---
  const saveStats = useCallback((newStats) => {
    setStats(newStats);
    localStorage.setItem('quiz_master_v3_state', JSON.stringify(newStats));
  }, []);

  // --- CAN YENİLEME MANTIĞI ---
  const updateHearts = useCallback(() => {
    setStats(prev => {
      if (prev.hearts >= MAX_HEARTS) {
        return { ...prev, lastHeartRegen: Date.now() };
      }

      const now = Date.now();
      const diff = now - prev.lastHeartRegen;
      const earnedHearts = Math.floor(diff / REGEN_TIME);

      if (earnedHearts > 0) {
        const newHearts = Math.min(MAX_HEARTS, prev.hearts + earnedHearts);
        // Eğer canlar dolduysa regen zamanını 'şimdi' yap, dolmadıysa kaldığı parçayı koru
        const newRegenTime = newHearts === MAX_HEARTS ? now : prev.lastHeartRegen + (earnedHearts * REGEN_TIME);
        
        const newState = { ...prev, hearts: newHearts, lastHeartRegen: newRegenTime };
        localStorage.setItem('quiz_master_v3_state', JSON.stringify(newState));
        return newState;
      }
      return prev;
    });
  }, []);

  // Kalıcı Timer Kontrolü
  useEffect(() => {
    const interval = setInterval(() => {
      updateHearts();
      
      if (stats.hearts < MAX_HEARTS) {
        const now = Date.now();
        const elapsedSinceLastRegen = now - stats.lastHeartRegen;
        const remaining = Math.max(0, REGEN_TIME - elapsedSinceLastRegen);
        
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setNextHeartTime(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      } else {
        setNextHeartTime("");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [stats.hearts, stats.lastHeartRegen, updateHearts]);

  // Quiz Timer
  useEffect(() => {
    let interval;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    } else if (timer === 0 && isTimerActive) {
      endGame(guaranteedScore, false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer, guaranteedScore]);

  // --- GAME FUNCTIONS ---
  const startQuiz = () => {
    if (stats.hearts <= 0) return;
    let pool = selectedCategory === 'all' ? FALLBACK_QUESTIONS : FALLBACK_QUESTIONS.filter(q => q.category === selectedCategory);
    if (!pool || pool.length === 0) pool = FALLBACK_QUESTIONS;
    
    const selected = [...pool].sort(() => 0.5 - Math.random()).slice(0, 30);
    setGameQuestions(selected);
    setCurrentQuestionIndex(0);
    setScore(0);
    setGuaranteedScore(0);
    setStreak(0);
    setUsedJokers([]);
    setScreen('quiz');
    resetQuestion(0, selected[0]);
  };

  const resetQuestion = (index, data) => {
    setCurrentQuestionIndex(index);
    setTimer(data?.difficulty === 'zor' ? 15 : 20);
    setIsTimerActive(true);
    setIsAnswered(false);
    setSelectedOption(null);
    setHiddenOptions([]);
    setAiHint(null);
  };

  const handleAnswer = (option) => {
    if (isAnswered || !currentQuestion) return;
    setSelectedOption(option);
    setIsAnswered(true);
    setIsTimerActive(false);
    const isCorrect = option === currentQuestion.answer;

    setTimeout(() => {
      if (isCorrect) {
        setStreak(s => s + 1);
        const nextScore = REWARDS_LIST[currentQuestionIndex]?.val || 0;
        setScore(nextScore);
        if (REWARDS_LIST[currentQuestionIndex]?.isSafe) setGuaranteedScore(nextScore);
        if (currentQuestionIndex === gameQuestions.length - 1) endGame(nextScore, true);
        else resetQuestion(currentQuestionIndex + 1, gameQuestions[currentQuestionIndex + 1]);
      } else endGame(guaranteedScore, false);
    }, 1500);
  };

  const endGame = (finalScore, isWin) => {
    setIsTimerActive(false);
    const earnedXp = (currentQuestionIndex + 1) * 100 + (isWin ? 1000 : 0);
    const newXp = stats.xp + earnedXp;
    const newLevel = Math.floor(newXp / 1000) + 1;
    if (newLevel > stats.level) setShowLevelUp(true);

    // İlk can kaybında regen zamanını başlat
    let newRegenTime = stats.lastHeartRegen;
    if (!isWin && stats.hearts === MAX_HEARTS) {
      newRegenTime = Date.now();
    }

    const newStats = {
      ...stats,
      highScore: Math.max(stats.highScore, finalScore),
      totalGames: stats.totalGames + 1,
      totalPoints: stats.totalPoints + finalScore,
      balance: stats.balance + Math.floor(finalScore / 10),
      xp: newXp,
      level: newLevel,
      hearts: Math.max(0, stats.hearts - (isWin ? 0 : 1)),
      lastHeartRegen: newRegenTime,
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
        contents: [{ parts: [{ text: `Soru şu: "${currentQuestion.question}". Bu soru için bir ipucu ver ama cevabı doğrudan söyleme.` }] }]
      });
      setAiHint(data.candidates[0].content.parts[0].text);
      setUsedJokers([...usedJokers, 'ai']);
      saveStats({ ...stats, inventory: { ...stats.inventory, ai_joker: (stats.inventory?.ai_joker || 1) - 1 } });
    } catch (e) { setAiHint("Zekâ Küpü meşgul!"); } finally { setIsAiLoading(false); }
  };

  const generateCustomQuiz = async () => {
    if (!customTopic || isAiGenerating) return;
    setIsAiGenerating(true);
    try {
      const data = await fetchGemini({
        contents: [{ parts: [{ text: `"${customTopic}" hakkında zorluk seviyesi artan 30 tane çoktan seçmeli Türkçe soru hazırla. Yanıtı JSON formatında şu yapıda ver: [{question, options: [4 tane], answer, explanation, difficulty: "kolay/orta/zor"}]` }] }],
        generationConfig: { responseMimeType: "application/json" }
      });
      const parsed = JSON.parse(data.candidates[0].content.parts[0].text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setGameQuestions(parsed);
        setScreen('quiz');
        resetQuestion(0, parsed[0]);
        setShowAiGen(false);
      }
    } catch (e) { console.error(e); } finally { setIsAiGenerating(false); }
  };

  const buyItem = (type, cost) => {
    if (stats.balance < cost) return;
    const newInventory = { ...(stats.inventory || { ai_joker: 0, double_dip: 0 }) };
    let newHearts = stats.hearts;
    if (type === 'ai_joker') newInventory.ai_joker += 1;
    if (type === 'heart') newHearts += 1;
    saveStats({ ...stats, balance: stats.balance - cost, inventory: newInventory, hearts: newHearts });
  };

  const handleSpin = () => {
    if (isSpinning) return;
    const today = new Date().toDateString();
    if (stats.lastSpin === today) { setSpinReward("Yarın tekrar gel!"); return; }
    setIsSpinning(true);
    setTimeout(() => {
      const prize = 1500;
      setSpinReward(`${prize} Altın Kazandın!`);
      saveStats({ ...stats, balance: (stats.balance || 0) + prize, lastSpin: today });
      setIsSpinning(false);
    }, 2000);
  };

  const Modal = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 className="text-xl font-black uppercase tracking-tighter text-yellow-500">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );

  // --- SCREENS ---
  if (screen === 'home') {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center p-6 font-sans relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-blue-600/10 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600/10 blur-[100px] rounded-full"></div>

        <div className="w-full max-w-md space-y-6 z-10">
          <div className="flex justify-between items-center bg-slate-900/60 backdrop-blur-xl p-4 rounded-3xl border border-slate-800/50 shadow-xl">
            <div className="flex flex-col gap-1">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Heart key={i} size={18} className={i < stats.hearts ? "text-red-500 fill-red-500" : "text-slate-700"} />
                ))}
              </div>
              {nextHeartTime && (
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold ml-1">
                  <Clock size={10} /> {nextHeartTime}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-yellow-500 font-black">
                <Coins size={18} />
                <span>{(stats.balance || 0).toLocaleString()}</span>
              </div>
              <button onClick={() => setShowSettings(true)} className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">
                <Settings2 size={18} />
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-500 to-orange-500 flex items-center justify-center text-4xl border-4 border-slate-800 shadow-xl">
                {stats.avatar}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-black uppercase tracking-tight">{stats.username}</h2>
                <p className="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-2">
                  {RANK_TITLES.filter(t => stats.level >= t.minLevel).pop()?.name || "Çaylak"}
                </p>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${(stats.xp % 1000) / 10}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center py-4">
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-400 to-yellow-600 leading-tight italic">
              QUIZ MASTER
            </h1>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {CATEGORIES_DATA.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${selectedCategory === cat.id ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500 shadow-lg' : 'bg-slate-900/50 border-slate-800 text-slate-500'}`}>
                {cat.icon}<span className="text-[8px] font-black uppercase">{cat.name}</span>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <button onClick={startQuiz} disabled={stats.hearts <= 0} className="w-full py-6 rounded-[2.5rem] bg-gradient-to-r from-yellow-600 to-yellow-400 text-slate-950 font-black text-2xl shadow-xl active:scale-95 disabled:opacity-50 transition-all">
              {stats.hearts > 0 ? 'BAŞLA' : 'CANIN BİTTİ'}
            </button>
            <button onClick={() => setShowAiGen(true)} className="w-full bg-blue-600/10 border-2 border-blue-500/30 text-blue-400 py-4 rounded-[2rem] font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95">
              <Wand2 size={20} /> AI ÖZEL YARIŞMA ÜRET
            </button>
            <div className="grid grid-cols-4 gap-3">
              <button onClick={() => setShowStats(true)} className="flex flex-col items-center p-4 bg-slate-900/50 rounded-2xl border border-slate-800 shadow-lg"><BarChart3 size={20} className="text-blue-400" /><span className="text-[8px] mt-1 font-bold">KARİYER</span></button>
              <button onClick={() => setShowShop(true)} className="flex flex-col items-center p-4 bg-slate-900/50 rounded-2xl border border-slate-800 shadow-lg"><ShoppingCart size={20} className="text-purple-400" /><span className="text-[8px] mt-1 font-bold">MARKET</span></button>
              <button onClick={() => setShowSpinWheel(true)} className="flex flex-col items-center p-4 bg-slate-900/50 rounded-2xl border border-slate-800 shadow-lg"><RotateCw size={20} className="text-orange-400" /><span className="text-[8px] mt-1 font-bold">ÇARK</span></button>
              <button onClick={() => setShowHistory(true)} className="flex flex-col items-center p-4 bg-slate-900/50 rounded-2xl border border-slate-800 shadow-lg"><History size={20} className="text-green-400" /><span className="text-[8px] mt-1 font-bold">GEÇMİŞ</span></button>
            </div>
          </div>
        </div>

        {/* MODALLAR */}
        {showShop && (
          <Modal title="Market" onClose={() => setShowShop(false)}>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl"><Sparkles /></div>
                  <div><p className="font-bold text-sm">AI İpucu</p><p className="text-[10px] text-slate-500">Zekâ Küpü'nden yardım al</p></div>
                </div>
                <button onClick={() => buyItem('ai_joker', 1000)} className="bg-yellow-500 text-slate-950 px-4 py-2 rounded-xl font-black text-xs">1.000 G</button>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-500/20 text-red-400 rounded-xl"><Heart /></div>
                  <div><p className="font-bold text-sm">Ekstra Can</p><p className="text-[10px] text-slate-500">Yarışmaya devam et</p></div>
                </div>
                <button onClick={() => buyItem('heart', 2500)} className="bg-yellow-500 text-slate-950 px-4 py-2 rounded-xl font-black text-xs">2.500 G</button>
              </div>
            </div>
          </Modal>
        )}
        {showStats && (
          <Modal title="İstatistikler" onClose={() => setShowStats(false)}>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center"><p className="text-[10px] text-slate-500 font-bold uppercase">En Yüksek</p><p className="text-2xl font-black text-yellow-500">{stats.highScore.toLocaleString()}</p></div>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center"><p className="text-[10px] text-slate-500 font-bold uppercase">Toplam Oyun</p><p className="text-2xl font-black text-blue-400">{stats.totalGames}</p></div>
            </div>
          </Modal>
        )}
        {showHistory && (
          <Modal title="Geçmiş" onClose={() => setShowHistory(false)}>
            <div className="space-y-3">
              {(stats.gameHistory || []).map((game, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <div><p className="font-bold text-sm text-yellow-500">{game.score.toLocaleString()} Puan</p><p className="text-[10px] text-slate-500 uppercase font-bold">{game.questions} Soru</p></div>
                  <p className="text-[10px] text-slate-600 font-bold">{game.date}</p>
                </div>
              ))}
            </div>
          </Modal>
        )}
        {showAiGen && (
          <Modal title="AI Maratonu" onClose={() => setShowAiGen(false)}>
            <div className="space-y-6">
              <input type="text" placeholder="Konu: Örn: Star Wars..." className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl font-bold text-white" value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} />
              <button onClick={generateCustomQuiz} disabled={isAiGenerating || !customTopic} className="w-full bg-blue-600 py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3">
                {isAiGenerating ? <Loader2 className="animate-spin" /> : <Play />} BAŞLAT
              </button>
            </div>
          </Modal>
        )}
        {showSpinWheel && (
          <Modal title="Şans Çarkı" onClose={() => setShowSpinWheel(false)}>
            <div className="text-center space-y-6">
              <div className={`w-40 h-40 mx-auto rounded-full border-8 border-slate-800 flex items-center justify-center relative ${isSpinning ? 'animate-spin' : ''}`}>🎁</div>
              {spinReward && <p className="font-black text-green-400 animate-bounce">{spinReward}</p>}
              <button onClick={handleSpin} disabled={isSpinning} className="w-full bg-yellow-500 text-slate-950 py-4 rounded-2xl font-black">ÇEVİR</button>
            </div>
          </Modal>
        )}
        {showSettings && (
          <Modal title="Ayarlar" onClose={() => setShowSettings(false)}>
            <input type="text" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl font-bold text-white mb-4" value={tempUsername} onChange={(e) => setTempUsername(e.target.value)} onBlur={() => saveStats({ ...stats, username: tempUsername || "Oyuncu" })} />
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full py-4 text-red-500 font-bold border border-red-500/20 rounded-2xl">VERİLERİ SIFIRLA</button>
          </Modal>
        )}
        {showLevelUp && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-blue-600/90 backdrop-blur-xl">
            <div className="text-center space-y-6">
               <Trophy size={120} className="text-yellow-400 mx-auto animate-bounce" />
               <h2 className="text-6xl font-black italic text-white">SEVİYE ATLADIN!</h2>
               <button onClick={() => setShowLevelUp(false)} className="bg-white text-blue-600 px-12 py-5 rounded-full font-black text-2xl">DEVAM ET</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (screen === 'quiz') {
    if (!currentQuestion) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white"><Loader2 className="animate-spin text-yellow-500" size={48} /></div>;

    return (
      <div className="min-h-screen bg-[#020617] text-white font-sans relative overflow-hidden flex flex-col">
        <div className="w-full bg-slate-900/60 backdrop-blur-2xl border-b border-white/5 py-4 z-20 shadow-2xl overflow-hidden">
          <div ref={scrollRef} className="flex gap-3 px-8 overflow-x-auto no-scrollbar items-center mask-fade-horizontal">
            {REWARDS_LIST.map((reward, idx) => {
              const isCurrent = idx === currentQuestionIndex;
              const isPassed = idx < currentQuestionIndex;
              return (
                <div key={idx} className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[100px] px-3 py-2 rounded-2xl border-2 transition-all duration-500 ${isCurrent ? 'active-step bg-yellow-500 text-slate-950 border-white/20 scale-110 shadow-lg' : isPassed ? 'bg-green-500/10 border-green-500/20 text-green-500' : reward.isSafe ? 'border-blue-500/40 bg-blue-500/5 text-blue-400' : 'text-slate-600 border-transparent opacity-30'}`}>
                  <span className="text-[8px] font-black uppercase">Soru {reward.step}</span>
                  <span className="text-[11px] font-black">{reward.amount} PT</span>
                  {reward.isSafe && <ShieldCheck size={10} className="mt-0.5" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center relative z-10 px-4 md:px-12 py-6">
          <div className="w-full max-w-6xl mx-auto flex justify-between items-center mb-10 bg-white/5 p-4 rounded-[2rem] border border-white/5 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center bg-slate-950 transition-all ${timer < 5 ? 'border-red-500 text-red-500 animate-pulse' : 'border-yellow-600/50 text-yellow-500'}`}>
                <span className="text-2xl font-black">{timer}</span>
                <span className="text-[7px] font-bold uppercase tracking-widest">Süre</span>
              </div>
              <div className="hidden sm:block">
                 <p className="text-[10px] text-slate-500 font-black uppercase mb-0.5">Hedef</p>
                 <span className="text-xl font-black italic uppercase text-white tracking-tight">{(REWARDS_LIST[currentQuestionIndex]?.amount || '0') + ' PT'}</span>
              </div>
            </div>

            <div className="flex gap-3 items-center">
              <button onClick={() => setShowFullRewards(true)} className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-800/50 border border-slate-700 text-slate-400"><List size={20} /></button>
              <button onClick={callAiJoker} disabled={usedJokers.includes('ai') || isAnswered || isAiLoading || (stats.inventory?.ai_joker || 0) <= 0} className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all relative ${usedJokers.includes('ai') ? 'opacity-20 border-slate-800' : 'bg-blue-600/10 border-blue-500/40 text-blue-400'}`}>
                {isAiLoading ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />}
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900 shadow-xl">{stats.inventory?.ai_joker || 0}</span>
              </button>
              <button onClick={() => { const wrong = currentQuestion?.options?.filter(o => o !== currentQuestion.answer).sort(() => 0.5 - Math.random()).slice(0, 2); setHiddenOptions(wrong || []); setUsedJokers([...usedJokers, '5050']); }} disabled={usedJokers.includes('5050') || isAnswered} className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all ${usedJokers.includes('5050') ? 'opacity-20 border-slate-800' : 'bg-white/5 border-yellow-600/40 text-yellow-500'}`}>
                <Scissors size={24} />
              </button>
            </div>
          </div>

          <div className="w-full max-w-5xl mx-auto space-y-12">
            <div className="relative bg-slate-900/60 backdrop-blur-3xl border border-white/10 p-10 md:p-14 rounded-[4rem] shadow-2xl text-center group">
              <h2 className="text-3xl md:text-5xl font-black leading-snug tracking-tight mb-8">{currentQuestion?.question}</h2>
              <div className="flex justify-center gap-3">
                <span className="bg-blue-500/10 px-4 py-2 rounded-2xl text-[9px] font-black uppercase text-blue-400 border border-blue-500/20">{currentQuestion?.difficulty || 'orta'}</span>
                <span className="bg-yellow-500/10 px-4 py-2 rounded-2xl text-[9px] font-black uppercase text-yellow-500 border border-yellow-500/20">%{currentQuestion?.globalRate || 50} Başarı</span>
              </div>
            </div>

            {aiHint && <div className="w-full max-w-2xl mx-auto bg-blue-600/10 border border-blue-500/30 p-6 rounded-3xl text-center text-blue-200 font-bold italic text-sm"><Sparkles size={18} className="inline mr-3" /> "{aiHint}"</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
              {currentQuestion?.options?.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                const isCorrect = isAnswered && opt === currentQuestion.answer;
                const isWrong = isAnswered && isSelected && !isCorrect;
                const isHidden = (hiddenOptions || []).includes(opt);
                return (
                  <button key={idx} onClick={() => handleAnswer(opt)} disabled={isAnswered || isHidden} className={`group relative p-6 md:p-8 rounded-[2.5rem] border-2 text-left transition-all duration-300 shadow-xl active:scale-[0.98] ${isHidden ? 'opacity-0 invisible' : 'opacity-100'} ${isCorrect ? 'bg-green-600 border-green-300 scale-[1.03] z-20' : isWrong ? 'bg-red-600 border-red-300 animate-shake' : isSelected ? 'bg-yellow-600 border-yellow-400' : 'bg-slate-900/60 border-white/5 hover:bg-slate-800'}`}>
                    <div className="flex items-center gap-5 relative z-10">
                      <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-lg ${isCorrect || isWrong || isSelected ? 'bg-white/20 text-white' : 'bg-white/5 text-yellow-500'}`}>{String.fromCharCode(65+idx)}</div>
                      <span className={`text-lg md:text-xl font-black ${isCorrect || isWrong || isSelected ? 'text-white' : 'text-slate-200'}`}>{opt}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-12 flex justify-center pb-4">
             <button onClick={() => endGame(currentQuestionIndex === 0 ? 0 : REWARDS_LIST[currentQuestionIndex-1].val, true)} className="group flex items-center gap-3 px-12 py-5 bg-white/5 border border-white/10 rounded-full text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] hover:text-red-500 active:scale-95 shadow-xl">
               <DoorOpen size={16} /> Çekiliyorum
             </button>
          </div>
        </div>

        {showFullRewards && (
          <Modal title="Para Ağacı" onClose={() => setShowFullRewards(false)}>
            <div className="space-y-2 p-2 bg-slate-950/50 rounded-3xl">
              {[...REWARDS_LIST].reverse().map((reward, idx) => {
                const actualIndex = REWARDS_LIST.length - 1 - idx;
                const isCurrent = actualIndex === currentQuestionIndex;
                const isPassed = actualIndex < currentQuestionIndex;
                return (
                  <div key={idx} className={`flex items-center justify-between p-3.5 rounded-2xl border-2 font-black text-[12px] transition-all duration-300 ${isCurrent ? 'bg-yellow-500 text-slate-950' : isPassed ? 'bg-white/5 text-slate-600' : reward.isSafe ? 'border-blue-500/40 text-blue-400' : 'text-slate-700 opacity-40'}`}>
                    <div className="flex items-center gap-4"><span>{reward.step}</span><span>{reward.amount} PT</span></div>
                    {reward.isSafe && <ShieldCheck size={14} />}
                  </div>
                );
              })}
            </div>
          </Modal>
        )}
      </div>
    );
  }

  if (screen === 'result') {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="w-full max-w-xl bg-slate-900 rounded-[4rem] border-2 border-slate-800 p-12 md:p-16 text-center shadow-2xl animate-in zoom-in-90 duration-500">
           <Trophy size={120} className="mx-auto mb-8 text-yellow-500 animate-bounce" />
           <h2 className="text-4xl font-black uppercase italic text-white mb-2">Oyun Bitti!</h2>
           <div className="text-8xl font-black text-yellow-400 tracking-tighter mb-8">{score.toLocaleString()} <span className="text-2xl opacity-50">Pt</span></div>
           <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 mb-10"><p className="text-slate-400 text-sm italic leading-relaxed">"{currentQuestion?.explanation || 'Harika bir performanstı!'}"</p></div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => setScreen('home')} className="w-full bg-slate-800 py-6 rounded-3xl font-black text-sm text-white">ANA MENÜ</button>
              <button onClick={startQuiz} className="w-full bg-gradient-to-r from-yellow-600 to-yellow-400 text-slate-950 py-6 rounded-3xl font-black text-sm">YENİDEN DENE</button>
           </div>
        </div>
      </div>
    );
  }

  return null;
}