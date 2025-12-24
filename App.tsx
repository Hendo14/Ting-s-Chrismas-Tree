
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Experience from './components/Experience';
import GestureController from './components/GestureController';
import { TreeColors, HandGesture } from './types';

// Helper to shuffle array for random photo selection
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const App: React.FC = () => {
  const [targetMix, setTargetMix] = useState(1); 
  const [colors] = useState<TreeColors>({ bottom: '#022b1c', top: '#217a46' });
  const inputRef = useRef({ x: 0, y: 0, isDetected: false });
  
  // Counts Configuration
  const [ballCount, setBallCount] = useState(60);
  const [giftCount, setGiftCount] = useState(30);
  const [maxPhotoCount, setMaxPhotoCount] = useState(10);
  const [showConfig, setShowConfig] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Image Upload State
  const [userImages, setUserImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);

  // Randomly select a subset of images if they exceed maxPhotoCount
  const displayedPhotos = useMemo(() => {
    if (userImages.length <= maxPhotoCount) return userImages;
    // We shuffle a copy to pick random indices
    return shuffleArray(userImages).slice(0, maxPhotoCount);
  }, [userImages, maxPhotoCount]);

  // Signature Modal State
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [signatureText, setSignatureText] = useState("");
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  // Camera Gui Visibility
  const [showCamera, setShowCamera] = useState(true);

  // Audio State
  const [isMuted, setIsMuted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [bgmSource, setBgmSource] = useState<string>('https://www.chosic.com/wp-content/uploads/2021/11/We-Wish-You-A-Merry-Christmas.mp3');
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  // Initialize and update BGM
  useEffect(() => {
    if (!bgmRef.current) {
        bgmRef.current = new Audio(bgmSource);
        bgmRef.current.crossOrigin = "anonymous";
        bgmRef.current.loop = true;
        bgmRef.current.volume = 0.3;
    } else {
        const wasPlaying = !bgmRef.current.paused;
        bgmRef.current.src = bgmSource;
        if (wasPlaying && !isMuted) bgmRef.current.play().catch(() => {});
    }
  }, [bgmSource, isMuted]);

  useEffect(() => {
    if (hasInteracted && bgmRef.current) {
      if (isMuted) {
        bgmRef.current.pause();
      } else {
        bgmRef.current.play().catch(() => {});
      }
    }
  }, [isMuted, hasInteracted]);

  const handleUserInteraction = () => {
      if (!hasInteracted) setHasInteracted(true);
  };

  const toggleMute = () => {
      handleUserInteraction();
      setIsMuted(prev => !prev);
  };

  const handleGesture = useCallback((data: HandGesture) => {
    if (data.isDetected) {
        handleUserInteraction();
        const newTarget = data.isOpen ? 0 : 1;
        setTargetMix(prev => (prev !== newTarget ? newTarget : prev));
        inputRef.current = { x: data.position.x * 1.2, y: data.position.y, isDetected: true };
    } else {
        inputRef.current.isDetected = false;
    }
  }, []);

  const toggleState = () => {
      handleUserInteraction();
      setTargetMix(prev => prev === 1 ? 0 : 1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          setIsProcessing(true);
          setTargetMix(0);
          setTimeout(() => {
              const files = Array.from(e.target.files!).slice(0, 50);
              const urls = files.map(file => URL.createObjectURL(file));
              setUserImages(prev => [...prev, ...urls]);
              if (fileInputRef.current) fileInputRef.current.value = '';
              setTimeout(() => {
                  setIsProcessing(false);
                  setTimeout(() => setTargetMix(1), 800);
              }, 1200); 
          }, 50);
      }
  };

  const deletePhoto = (urlToDelete: string) => {
      if (urlToDelete.startsWith('blob:')) URL.revokeObjectURL(urlToDelete);
      setUserImages(prev => prev.filter(url => url !== urlToDelete));
  };

  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          const url = URL.createObjectURL(file);
          setBgmSource(url);
          setHasInteracted(true);
          setIsMuted(false);
      }
  };

  const iconButtonClass = `
    group relative w-10 h-10 md:w-12 md:h-12 rounded-full 
    bg-black/30 backdrop-blur-md border border-white/20 text-slate-300 
    transition-all duration-500 ease-out hover:border-white/60 hover:text-white 
    hover:bg-white/10 hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] 
    active:scale-90 active:bg-white/20 flex justify-center items-center cursor-pointer
  `;

  const sliderPanelClass = `
    absolute top-6 left-6 md:top-10 md:left-10 z-40 p-6 rounded-lg 
    bg-black/60 backdrop-blur-xl border border-white/10 
    transition-all duration-500 flex flex-col gap-4 text-white/80 font-luxury text-[10px] uppercase tracking-widest
  `;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden" onClick={handleUserInteraction}>
      
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
      <input type="file" ref={musicInputRef} onChange={handleMusicChange} accept="audio/*" className="hidden" />

      {isProcessing && (
          <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
              <div className="relative w-16 h-16 mb-6">
                  <div className="absolute inset-0 border-2 border-t-[#d4af37] border-r-transparent border-b-[#d4af37] border-l-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-[#d4af37] text-xl animate-pulse">✦</div>
              </div>
              <div className="text-[#d4af37] font-luxury tracking-[0.25em] text-xs uppercase animate-pulse">装饰中...</div>
          </div>
      )}

      {/* CONFIGURATION PANEL */}
      {showConfig && (
          <div className={sliderPanelClass}>
              <div className="flex justify-between items-center mb-2">
                  <span>Tree Settings</span>
                  <button onClick={() => setShowConfig(false)} className="hover:text-white">✕</button>
              </div>
              <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                      <div className="flex justify-between"><span>Balls</span><span>{ballCount}</span></div>
                      <input type="range" min="0" max="150" value={ballCount} onChange={(e) => setBallCount(parseInt(e.target.value))} className="accent-[#d4af37]" />
                  </div>
                  <div className="flex flex-col gap-1">
                      <div className="flex justify-between"><span>Gifts</span><span>{giftCount}</span></div>
                      <input type="range" min="0" max="80" value={giftCount} onChange={(e) => setGiftCount(parseInt(e.target.value))} className="accent-[#d4af37]" />
                  </div>
                  <div className="flex flex-col gap-1">
                      <div className="flex justify-between"><span>Max Photos</span><span>{maxPhotoCount}</span></div>
                      <input type="range" min="1" max="50" value={maxPhotoCount} onChange={(e) => setMaxPhotoCount(parseInt(e.target.value))} className="accent-[#d4af37]" />
                  </div>
              </div>
          </div>
      )}

      {/* PHOTO MANAGEMENT SYSTEM (GALLERY) */}
      {isGalleryOpen && (
          <div className="absolute inset-0 z-[80] bg-black/80 backdrop-blur-2xl flex flex-col items-center p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-full max-w-4xl flex flex-col h-full">
                  <div className="flex justify-between items-center mb-12 border-b border-white/10 pb-6">
                      <div className="flex flex-col">
                        <h2 className="font-luxury text-2xl text-white tracking-[0.2em] uppercase">Photo Management</h2>
                        <span className="text-white/40 text-[10px] tracking-widest mt-1">
                            {userImages.length} Total • {Math.min(userImages.length, maxPhotoCount)} Hanging on Tree
                        </span>
                      </div>
                      <button 
                        onClick={() => setIsGalleryOpen(false)}
                        className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
                      >✕</button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide">
                      {userImages.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-white/20 font-luxury tracking-widest italic">
                              No photos uploaded yet
                              <button onClick={() => fileInputRef.current?.click()} className="mt-4 text-[10px] text-[#d4af37] border-b border-[#d4af37]/40 pb-1 non-italic">Upload First Memory</button>
                          </div>
                      ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 pb-20">
                              {userImages.map((url, idx) => (
                                  <div key={url} className="group relative aspect-[3/4] bg-white/5 border border-white/10 rounded-sm overflow-hidden hover:border-[#d4af37]/60 transition-all duration-500">
                                      <img src={url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Memory" />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                                          <button 
                                            onClick={() => deletePhoto(url)}
                                            className="bg-red-500/80 hover:bg-red-600 text-white p-2 rounded-full backdrop-blur-md transition-all transform translate-y-4 group-hover:translate-y-0"
                                            title="Remove Memory"
                                          >
                                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                              </svg>
                                          </button>
                                      </div>
                                  </div>
                              ))}
                              <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="aspect-[3/4] border-2 border-dashed border-white/10 rounded-sm flex flex-col items-center justify-center text-white/20 hover:text-white/60 hover:border-white/30 transition-all gap-2"
                              >
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-8 h-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                  </svg>
                                  <span className="font-luxury text-[8px] tracking-[0.2em] uppercase">Add More</span>
                              </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      <div className={`absolute top-[5%] left-0 w-full flex justify-center pointer-events-none z-0 transition-opacity duration-700 ${isSignatureOpen || isGalleryOpen ? 'opacity-0' : 'opacity-100'}`}>
        <h1 className="font-script text-6xl md:text-9xl text-center leading-[1.5] py-10" style={{ background: 'linear-gradient(to bottom, #ffffff 20%, #e8e8e8 50%, #b0b0b0 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0px 5px 5px rgba(0,0,0,0.8))' }}>
            Merry Christmas
        </h1>
      </div>

      <div className={`absolute inset-0 z-10 transition-all duration-700 ${isSignatureOpen || isGalleryOpen ? 'blur-sm scale-95 opacity-50' : 'blur-0 scale-100 opacity-100'}`}>
        <Experience 
            mixFactor={targetMix}
            colors={colors} 
            inputRef={inputRef} 
            userImages={displayedPhotos}
            signatureText={signatureText}
            ballCount={ballCount}
            giftCount={giftCount}
        />
      </div>

      {isSignatureOpen && (
          <div className="absolute inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity duration-500 animate-in fade-in">
              <div className="relative bg-[#f8f8f8] p-4 pb-12 shadow-2xl transform transition-transform duration-700 scale-100 rotate-[-2deg]" style={{ width: 'min(80vw, 320px)', aspectRatio: '3.5/4.2' }}>
                  <button onClick={() => setIsSignatureOpen(false)} className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-black border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black z-50">✕</button>
                  <div className="w-full h-[75%] bg-[#1a1a1a] overflow-hidden relative shadow-inner">
                      {activePhotoUrl ? <img src={activePhotoUrl} alt="Memory" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/40 font-body text-lg italic tracking-widest text-center px-4">Memories...</div>}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20 pointer-events-none" />
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-[25%] flex items-center justify-center px-4">
                      <input autoFocus type="text" placeholder="Sign..." value={signatureText} onChange={(e) => setSignatureText(e.target.value)} className="w-full text-center bg-transparent border-none outline-none font-script text-3xl md:text-4xl text-[#1a1a1a]" style={{ transform: 'translateY(-5px) rotate(-1deg)' }} maxLength={20} />
                  </div>
              </div>
          </div>
      )}

      {/* TOP RIGHT - CONTROLS */}
      <div className={`absolute top-6 right-6 md:top-10 md:right-10 z-[70] pointer-events-auto flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-4 transition-opacity duration-500 ${isSignatureOpen || isProcessing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          
          <button onClick={() => { handleUserInteraction(); setIsGalleryOpen(true); }} className={`${iconButtonClass} ${isGalleryOpen ? 'text-white border-white/60 bg-white/10' : ''}`} title="管理照片">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3c.235.083.487.128.75.128H20.25a2.25 2.25 0 012.25 2.25v1.378m-2.25-1.378a2.25 2.25 0 00-2.25-2.25H18m0 0V18a2.25 2.25 0 01-2.25 2.25H8.25A2.25 2.25 0 016 18V6.878" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75h3m0 0V21m0-8.25c0-1.242 1.008-2.25 2.25-2.25h10.5c1.242 0 2.25 1.008 2.25 2.25m-15 0v8.25m15 0V12.75m0 8.25c0 1.242-1.008 2.25-2.25 2.25H8.25a2.25 2.25 0 01-2.25-2.25m15 0h3" />
              </svg>
          </button>

          <button onClick={() => setShowConfig(!showConfig)} className={`${iconButtonClass} ${showConfig ? 'text-white border-white/60 bg-white/10' : ''}`} title="调节数量">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 18H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 12h7.5" />
              </svg>
          </button>

          <button onClick={toggleMute} className={`${iconButtonClass} ${!isMuted ? 'text-white border-white/60 bg-white/10' : ''}`} title={isMuted ? "取消静音" : "静音"}>
              {isMuted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.5a2.25 2.25 0 01-2.25-2.25V9.75A2.25 2.25 0 014.5 7.5h2.25z" />
                  </svg>
              ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.5a2.25 2.25 0 01-2.25-2.25V9.75a2.25 2.25 0 012.25-2.25h2.25z" />
                  </svg>
              )}
          </button>

          <button onClick={() => musicInputRef.current?.click()} className={iconButtonClass} title="更换音乐">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163V5.504a.75.75 0 01.592-.738L18.75 4.125a.75.75 0 01.908.733v2.585M9 9v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66A2.25 2.25 0 009 10.913V9z" />
              </svg>
          </button>

          <button onClick={() => setShowCamera(prev => !prev)} className={`${iconButtonClass} ${showCamera ? 'text-white border-white/60 bg-white/10' : ''}`} title="摄像头控制">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
          </button>

          <button onClick={() => fileInputRef.current?.click()} className={iconButtonClass} title="上传照片">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
          </button>

          <button onClick={() => { if(userImages.length > 0) setActivePhotoUrl(userImages[Math.floor(Math.random() * userImages.length)]); setIsSignatureOpen(true); }} className={iconButtonClass} title="拍立得签名">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
          </button>

          <button onClick={toggleState} className={iconButtonClass} title={targetMix === 1 ? "散开" : "聚拢"}>
            {targetMix === 1 ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
            )}
          </button>
      </div>

      <div className={`absolute bottom-6 left-6 z-20 pointer-events-none transition-opacity duration-500 ${isSignatureOpen || isGalleryOpen ? 'opacity-0' : 'opacity-100'}`}>
            <div className="text-white/20 text-[20px] uppercase tracking-widest font-luxury">
                <div>送给小婷婷的圣诞树</div>
                <div className="text-slate-500">Made by Ziming</div>
            </div>
      </div>

      <GestureController onGesture={handleGesture} isGuiVisible={showCamera} />
    </div>
  );
};

export default App;
