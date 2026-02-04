import React, { useState, useEffect, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";

// --- Game Constants & Types ---
type Stage = 1 | 2 | 3 | 4;
type GameState = "MENU" | "PLAYING" | "PAUSED" | "GAME_OVER" | "STAGE_CLEAR" | "VICTORY";
type ControlMode = "NORMAL" | "INVERTED" | "SWAP";
type Language = "CN" | "EN";

// --- Logic Config (Independent of Language) ---
const STAGE_LOGIC = {
  1: { duration: 60, color: "#00d2ff", mode: "NORMAL" },
  2: { duration: 60, color: "#ff9900", mode: "INVERTED" },
  3: { duration: 60, color: "#ff0055", mode: "SWAP" },
  4: { duration: 180, color: "#9d00ff", mode: "RANDOM" }, 
};

// --- Localization System ---

const TRANSLATIONS = {
    CN: {
        ui: {
            titleMain: "深空逃逸", 
            titleSub: "规避协议", 
            start: "启动",
            startTouch: "启动引擎",
            startHint: "[ 点击启动 · 拖拽躲避 ]", 
            gameplayHint: "核心任务：拒绝撞击",
            achievements: "成就数据",
            manual: "操作指南", 
            faq: "常见问题",
            protocols: "基础协议",
            intel: "关卡情报",
            howToPlay: [
                "1. 拖动屏幕任意位置移动核心。",
                "2. 规避一切飞来的障碍体。",
                "3. 存活 60 秒以突破当前层级。",
                "警告: 密切监视左上角的控制状态。"
            ],
            paused: "系统挂起",
            resume: "恢复连接",
            restart: "重置模拟",
            quit: "断开连接",
            score: "同步率",
            stagePrefix: "阶段",
            stageComplete: "阶段完成",
            crash: "信号丢失",
            next: "下一阶段:",
            continue: "继续任务",
            replay: "重新校准",
            legend: "传说",
            finalScore: "最终同步率",
            playAgain: "再次挑战",
            controlSystem: "控制系统",
            achievementUnlocked: "成就解锁",
            close: "关闭终端",
            lockedDesc: "ACCESS DENIED",
            // Footer & Legal
            disclaimer: "条款",
            morePlatforms: "平台",
            icp: "ICP: 88888888",
            bgmOn: "声音: 开", 
            bgmOff: "声音: 关", 
            safeMode: "安全模式",
            version: "v1.6.0", 
            legal: {
                title: "用户协议与条款",
                tabs: ["条款接受", "知识产权", "免责声明", "变更终止"], 
                content: {
                    0: `**1. 条款接受**\n\n启动本模拟程序（以下简称“游戏”）即表示您完全同意以下所有条款。如果您不同意，请立即断开神经连接（关闭游戏）。`,
                    1: `**2. 知识产权声明**\n\n本游戏的所有代码、视觉设计、音频资产及“深空 (DEEP SPACE)”品牌标识均归 DEEP SPACE STUDIO 所有。\n\n未经授权，严禁对本程序进行逆向工程、反编译或提取资源用于商业用途。`,
                    2: `**3. 免责声明 (重要)**\n\n本软件按“现状”提供，不包含任何形式的保证。\n\n**[健康警告]**\n- 包含高频闪烁图像。光敏性癫痫患者请勿游玩。\n- 如感到头晕、恶心，请立即停止。\n\n**[设备免责]**\n- 游戏难度极高，旨在测试人类极限。\n- 开发者不对因玩家情绪失控（Rage Quit）导致的设备损坏（如摔手机）负责。\n- 亦不对因高强度操作导致的屏幕涂层磨损负责。`,
                    3: `**4. 服务变更与终止**\n\nDEEP SPACE STUDIO 保留随时修改、暂停或终止服务的权利，恕不另行通知。\n\n我们可能会更新游戏规则、关卡参数或控制逻辑（Nerf/Buff），您的历史高分可能会因此发生变动。`
                }
            },
            morePlatformsContent: [
                "即将登陆以下神经接口：",
                "- iOS App Store (审核中)",
                "- Google Play (预约中)",
                "- Steam (愿望单)",
                "- Neuralink (开发中)"
            ],
            faqContent: [
                { q: "存档会丢失吗？", a: "不会。系统采用本地神经记忆（LocalStorage），进度实时自动保存。但请勿清理浏览器缓存。" },
                { q: "为什么没有声音？", a: "请检查设备静音开关（尤其是 iOS 用户），或尝试点击屏幕任意位置以激活音频链路。" },
                { q: "画面卡顿？", a: "建议使用 Chrome 或 Safari 浏览器，并关闭“省电模式”以确保渲染引擎全功率运行。" },
                { q: "会有新模式吗？", a: "绝境规避协议正在持续进化，更多异常状态即将上线。" }
            ]
        },
        stages: {
            1: { name: "共鸣", tag: "神经连接建立", desc: "保持直觉。这是最初的试炼，躲避一切。" },
            2: { name: "镜像", tag: "视觉信号反转", desc: "上下左右全部反转。你的肌肉记忆是最大的敌人。" },
            3: { name: "错位", tag: "空间坐标崩坏", desc: "X 轴与 Y 轴互换。向上的指令会让你向左，向右的指令让你向下。" },
            4: { name: "熵增", tag: "系统完全接管", desc: "控制模式随时间随机切换。真正的地狱，只有最强的大脑才能存活。" }
        },
        modes: {
            "NORMAL": { label: "正常连接", sub: "标准控制" },
            "INVERTED": { label: "反转模式", sub: "输入反向" },
            "SWAP": { label: "轴向互换", sub: "X / Y Interchanged" }
        },
        flavor: {
            start: ["神经链路连接中...", "准备好接管控制权了吗？", "系统自检完成。开始。"],
            earlyDeath: ["你的手指是刚借来的吗？", "这就结束了？我还没开始计时。", "重力是个无情的对手。", "这也是一种天赋... 速死的天赋。"],
            midGameDeath: ["差点就成功了。", "你的大脑打结了吗？", "即使是 AI 也会对此感到遗憾。", "反直觉，这就是我们要的。"],
            stageClear: ["还不错，对于人类来说。", "这只是热身。", "你的小脑正在进化。", "下一关会让你想摔设备。"],
            victory: ["你是个传说！", "甚至我都无法计算出这条路径。", "测试结束。你自由了。"]
        },
        achievements: {
            'first_blood': { title: '第一滴血', desc: '首次死亡。一切的开始。' },
            'inverse_thinker': { title: '逆向思维', desc: '抵达阶段 2。' },
            'brain_twisted': { title: '脑力扭曲', desc: '抵达阶段 3。' },
            'hell_survivor': { title: '混沌行者', desc: '在熵增模式存活 30 秒。' },
            'legend': { title: '深空传说', desc: '通关所有阶段。' },
            'persistence': { title: '毅力', desc: '累计死亡 20 次。' }
        }
    },
    EN: {
        ui: {
            titleMain: "DEEP SPACE",
            titleSub: "EVASION PROTOCOL",
            start: "INITIATE",
            startTouch: "ENGAGE",
            startHint: "[ TAP TO START · DRAG TO DODGE ]",
            gameplayHint: "CORE OBJECTIVE: AVOID IMPACT",
            achievements: "ACHIEVEMENTS",
            manual: "MANUAL", 
            faq: "FAQ",
            protocols: "PROTOCOLS",
            intel: "INTEL",
            howToPlay: [
                "1. DRAG anywhere to move the ball.",
                "2. AVOID the incoming spheres.",
                "3. SURVIVE 60s to unlock next stage.",
                "WARNING: Observe the control HUD."
            ],
            paused: "SYSTEM PAUSED",
            resume: "RESUME",
            restart: "RESET",
            quit: "QUIT",
            score: "SYNC RATE",
            stagePrefix: "PHASE",
            stageComplete: "SEQUENCE COMPLETE",
            crash: "SIGNAL LOST",
            next: "NEXT:",
            continue: "PROCEED",
            replay: "RETRY",
            legend: "LEGEND",
            finalScore: "FINAL SYNC",
            playAgain: "RE-INITIATE",
            controlSystem: "CONTROL SYSTEM",
            achievementUnlocked: "ACHIEVEMENT UNLOCKED",
            close: "CLOSE",
            lockedDesc: "ACCESS DENIED",
            // Footer & Legal
            disclaimer: "TERMS",
            morePlatforms: "PLATFORMS",
            icp: "ICP: 88888888",
            bgmOn: "AUDIO: ON",
            bgmOff: "AUDIO: OFF",
            safeMode: "SAFE MODE",
            version: "v1.6.0",
            legal: {
                title: "Terms & Conditions",
                tabs: ["ACCEPTANCE", "IP RIGHTS", "DISCLAIMER", "CHANGES"],
                content: {
                    0: `**1. ACCEPTANCE OF TERMS**\n\nBy initiating this simulation program (hereinafter "The Game"), you fully agree to all terms below. If you do not agree, please disconnect immediately.`,
                    1: `**2. INTELLECTUAL PROPERTY**\n\nAll code, visual assets, audio, and the "DEEP SPACE" brand are the property of DEEP SPACE STUDIO.\n\nReverse engineering, decompiling, or extracting assets for commercial use is strictly prohibited without authorization.`,
                    2: `**3. DISCLAIMER (IMPORTANT)**\n\nThis software is provided "AS IS" without warranty.\n\n**[HEALTH WARNING]**\n- Contains flashing images. Not safe for photosensitive epilepsy.\n- Stop immediately if you feel dizzy or nauseous.\n\n**[LIABILITY]**\n- This game is designed to be difficult.\n- The developer is NOT responsible for device damage caused by rage-quitting.\n- We are not liable for finger cramps or screen wear from intense gameplay.`,
                    3: `**4. CHANGES & TERMINATION**\n\nDEEP SPACE STUDIO reserves the right to modify, suspend, or terminate the service at any time without notice.\n\nWe may update game rules or parameters (Nerf/Buff), which may affect your historical high scores.`
                }
            },
            morePlatformsContent: [
                "INCOMING TRANSMISSION:",
                "- iOS App Store (Reviewing)",
                "- Google Play (Pre-register)",
                "- Steam (Wishlist)",
                "- Neuralink (In Dev)"
            ],
            faqContent: [
                { q: "Will I lose my save?", a: "No. The system uses local neural memory (LocalStorage). Progress is saved automatically. Do not clear browser cache." },
                { q: "Why is there no sound?", a: "Check your device mute switch (especially iOS). Tap anywhere to engage the audio link." },
                { q: "Laggy graphics?", a: "Use Chrome or Safari. Disable 'Low Power Mode' to ensure full rendering engine power." },
                { q: "New modes coming?", a: "The Evasion Protocol is evolving. More anomalies are approaching." }
            ]
        },
        stages: {
            1: { name: "RESONANCE", tag: "NEURAL LINK ESTABLISHED", desc: "Trust your instincts. Dodge everything. The baseline test." },
            2: { name: "MIRROR", tag: "VISUAL INPUT INVERTED", desc: "Up is Down. Left is Right. Your muscle memory is the enemy." },
            3: { name: "GLITCH", tag: "SPATIAL COORDS CORRUPTED", desc: "X and Y inputs are swapped. Up moves Left. Right moves Down." },
            4: { name: "ENTROPY", tag: "SYSTEM OVERRIDE", desc: "Control modes shift randomly over time. True hell awaits." }
        },
        modes: {
            "NORMAL": { label: "NORMAL LINK", sub: "Standard Controls" },
            "INVERTED": { label: "INVERTED", sub: "Inputs Reversed" },
            "SWAP": { label: "AXIS SWAP", sub: "X / Y Interchanged" }
        },
        flavor: {
            start: ["Establishing neural link...", "Breathe. This is the easy part.", "System ready. Initiate."],
            earlyDeath: ["Did you just borrow those fingers?", "Over already? I haven't started counting.", "Gravity is a heartless mistress.", "A talent for dying quickly."],
            midGameDeath: ["Almost made it.", "Is your brain knotted yet?", "Even an AI feels pity for this.", "Counter-intuitive. That's the point."],
            stageClear: ["Not bad, for a human.", "Just a warm-up.", "Your cerebellum is evolving.", "The next one will hurt."],
            victory: ["You are a LEGEND!", "Even I couldn't calculate that path.", "Simulation complete. You are free."]
        },
        achievements: {
            'first_blood': { title: 'First Blood', desc: 'First death. It begins.' },
            'inverse_thinker': { title: 'Inverse Thinker', desc: 'Reach Stage 2.' },
            'brain_twisted': { title: 'Brain Twisted', desc: 'Reach Stage 3.' },
            'hell_survivor': { title: 'Chaos Walker', desc: 'Survive 30s in Chaos Mode.' },
            'legend': { title: 'Legend', desc: 'Clear all stages.' },
            'persistence': { title: 'Persistence', desc: 'Die 20 times total.' }
        }
    }
};

const MODE_COLORS: Record<ControlMode, string> = {
    "NORMAL": "#00d2ff",
    "INVERTED": "#ff9900",
    "SWAP": "#ff0055"
};

// ... (Audio Logic Remains the Same)
let AudioCtx: AudioContext | null = null;
const getAudioCtx = () => {
    if (!AudioCtx) {
        AudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (AudioCtx.state === 'suspended') {
        AudioCtx.resume();
    }
    return AudioCtx;
};
class AmbientMusic {
    private ctx: AudioContext | null = null;
    private nodes: AudioNode[] = [];
    private isPlaying: boolean = false;
    start() {
        if (this.isPlaying) return;
        this.ctx = getAudioCtx();
        this.isPlaying = true;
        const masterGain = this.ctx.createGain();
        masterGain.gain.value = 0;
        masterGain.connect(this.ctx.destination);
        this.nodes.push(masterGain);
        masterGain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 3);
        this.createOsc(35, 'sine', 0.6, masterGain);
        const drone = this.createOsc(110, 'triangle', 0.1, masterGain);
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.2; 
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 0.3; 
        lfo.connect(lfoGain);
        const pulseOsc = this.ctx.createOscillator();
        pulseOsc.type = 'sine';
        pulseOsc.frequency.value = 220;
        const pulseGain = this.ctx.createGain();
        pulseGain.gain.value = 0; 
        pulseOsc.connect(pulseGain);
        pulseGain.connect(masterGain);
        pulseOsc.start();
        lfo.connect(pulseGain.gain); 
        lfo.start();
        this.nodes.push(lfo, lfoGain, pulseOsc, pulseGain);
    }
    createOsc(freq: number, type: OscillatorType, vol: number, dest: AudioNode) {
        if (!this.ctx) return null;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = vol;
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        this.nodes.push(osc, gain);
        return gain;
    }
    stop() {
        if (!this.isPlaying || !this.ctx) return;
        const master = this.nodes[0] as GainNode;
        if (master && master.gain) {
             master.gain.cancelScheduledValues(this.ctx.currentTime);
             master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2);
        }
        setTimeout(() => {
            this.nodes.forEach(n => {
                try { (n as any).stop && (n as any).stop(); } catch(e){}
                n.disconnect();
            });
            this.nodes = [];
            this.isPlaying = false;
        }, 2100);
    }
}
const BGM = new AmbientMusic();
const Sound = {
  playTone: (freq: number, type: OscillatorType, duration: number, vol: number = 0.1, slide: boolean = false) => {
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (slide) {
          osc.frequency.exponentialRampToValueAtTime(freq / 2, ctx.currentTime + duration);
      }
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
    }
  },
  playCrash: () => {
    Sound.playTone(150, 'sawtooth', 0.6, 0.4, true);
    Sound.playTone(100, 'square', 0.8, 0.4, true);
  },
  playStart: () => {
    Sound.playTone(400, 'sine', 0.2, 0.1);
    setTimeout(() => Sound.playTone(600, 'sine', 0.4, 0.1), 150);
  },
  playLevelClear: () => {
    Sound.playTone(600, 'sine', 0.2, 0.1);
    setTimeout(() => Sound.playTone(800, 'sine', 0.2, 0.1), 150);
    setTimeout(() => Sound.playTone(1200, 'sine', 0.6, 0.1), 300);
  },
  playUnlock: () => {
    Sound.playTone(1200, 'triangle', 0.3, 0.1);
    setTimeout(() => Sound.playTone(1800, 'triangle', 0.6, 0.1), 100);
  },
  playModeSwitch: () => {
    Sound.playTone(300, 'square', 0.1, 0.1);
    setTimeout(() => Sound.playTone(150, 'square', 0.4, 0.2, true), 100);
  }
};

// ... (Achievement & Game Logic Remains the Same)
type AchievementDef = { id: string; check: (stats: GameStats) => boolean };
type GameStats = {
    totalDeaths: number;
    maxStage: number;
    hellModeTime: number;
    totalPlayTime: number;
};
const ACHIEVEMENTS_LOGIC: AchievementDef[] = [
    { id: 'first_blood', check: (s) => s.totalDeaths >= 1 },
    { id: 'inverse_thinker', check: (s) => s.maxStage >= 2 },
    { id: 'brain_twisted', check: (s) => s.maxStage >= 3 },
    { id: 'hell_survivor', check: (s) => s.hellModeTime >= 30 },
    { id: 'legend', check: (s) => s.maxStage > 4 }, 
    { id: 'persistence', check: (s) => s.totalDeaths >= 20 },
];
type EngineMode = "GAME" | "MENU_BG";
class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number = 0;
  height: number = 0;
  mode: EngineMode = "MENU_BG";
  player = { x: 0, y: 0, vx: 0, vy: 0, radius: 12, trail: [] as {x: number, y: number, alpha: number}[] };
  obstacles: { x: number; y: number; vx: number; vy: number; radius: number; color: string }[] = [];
  particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];
  warpStars: { x: number; y: number; z: number; pz: number }[] = [];
  menuStage: Stage = 1;
  stage: Stage = 1;
  controlMode: ControlMode = "NORMAL";
  hellModeTimer: number = 0;
  safeMode: boolean = false;
  input = { active: false, x: 0, y: 0, lastX: 0, lastY: 0 };
  
  running = false;
  paused = false;
  isLooping = false; // New flag to track RAF
  
  timeElapsed = 0;
  score = 0;
  animationFrameId: number = 0;
  callbacks: {
    onGameOver: (score: number, time: number) => void;
    onTimeUp: () => void;
    onScoreUpdate: (score: number) => void;
    onModeChange: (mode: ControlMode) => void;
  };
  private boundResize: () => void;
  private boundHandleStart: (e: TouchEvent | MouseEvent) => void;
  private boundHandleMove: (e: TouchEvent | MouseEvent) => void;
  private boundHandleEnd: () => void;
  constructor(canvas: HTMLCanvasElement, callbacks: any) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.callbacks = callbacks;
    this.boundResize = this.resize.bind(this);
    this.boundHandleStart = this.handleStart.bind(this);
    this.boundHandleMove = this.handleMove.bind(this);
    this.boundHandleEnd = this.handleEnd.bind(this);
    this.resize();
    this.initWarpStars();
    window.addEventListener('resize', this.boundResize);
    canvas.addEventListener('touchstart', this.boundHandleStart, { passive: false });
    canvas.addEventListener('touchmove', this.boundHandleMove, { passive: false });
    canvas.addEventListener('touchend', this.boundHandleEnd);
    canvas.addEventListener('mousedown', this.boundHandleStart);
    canvas.addEventListener('mousemove', this.boundHandleMove);
    canvas.addEventListener('mouseup', this.boundHandleEnd);
    
    // Initial start
    this.running = true;
    this.loop();
  }
  initWarpStars() {
      this.warpStars = [];
      const numStars = 600;
      for (let i = 0; i < numStars; i++) {
          this.warpStars.push(this.createWarpStar());
      }
  }
  createWarpStar() {
      const x = (Math.random() - 0.5) * this.width * 2;
      const y = (Math.random() - 0.5) * this.height * 2;
      const z = Math.random() * this.width;
      return { x, y, z, pz: z };
  }
  setSafeMode(enabled: boolean) {
      this.safeMode = enabled;
  }
  setMenuStage(s: Stage) {
      this.menuStage = s;
  }
  setMode(mode: EngineMode) {
      this.mode = mode;
  }
  destroy() {
    this.running = false;
    this.isLooping = false;
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.boundResize);
    this.canvas.removeEventListener('touchstart', this.boundHandleStart);
    this.canvas.removeEventListener('touchmove', this.boundHandleMove);
    this.canvas.removeEventListener('touchend', this.boundHandleEnd);
    this.canvas.removeEventListener('mousedown', this.boundHandleStart);
    this.canvas.removeEventListener('mousemove', this.boundHandleMove);
    this.canvas.removeEventListener('mouseup', this.boundHandleEnd);
  }
  resize() {
    this.width = window.innerWidth || document.documentElement.clientWidth || 0;
    this.height = window.innerHeight || document.documentElement.clientHeight || 0;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    if (this.mode === "MENU_BG") {
        this.initWarpStars();
    }
    if (this.mode === "GAME" && !this.running) {
        this.player.x = this.width / 2;
        this.player.y = this.height / 2;
        this.drawGame();
    }
  }
  
  start(stage: Stage) {
    this.mode = "GAME";
    this.stage = stage;
    this.running = true;
    this.paused = false;
    this.timeElapsed = 0;
    this.score = 0;
    this.obstacles = [];
    this.particles = [];
    this.player.x = this.width / 2;
    this.player.y = this.height * 0.8;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.trail = [];
    this.hellModeTimer = 0;
    this.setControlModeForStage(stage);
    this.callbacks.onModeChange(this.controlMode);
    Sound.playStart();

    // Force restart loop if it's dead
    if (!this.isLooping) {
        this.loop();
    }
  }

  pause() { this.paused = true; }
  resume() { if (this.paused) this.paused = false; }
  
  setControlModeForStage(stage: Stage) {
    if (stage === 1) this.controlMode = "NORMAL";
    else if (stage === 2) this.controlMode = "INVERTED";
    else if (stage === 3) this.controlMode = "SWAP";
    else if (stage === 4) {
      this.controlMode = "NORMAL";
    }
  }
  
  stop() {
    this.mode = "MENU_BG";
    this.paused = false;
    this.running = true; // IMPORTANT: Set to true so loop continues/restarts
    
    // Force restart loop if it's dead
    if (!this.isLooping) {
        this.loop();
    }
  }

  handleStart(e: TouchEvent | MouseEvent) {
    if (this.paused || this.mode === "MENU_BG") return;
    e.preventDefault();
    this.input.active = true;
    const { x, y } = this.getPos(e);
    this.input.lastX = x;
    this.input.lastY = y;
  }
  handleMove(e: TouchEvent | MouseEvent) {
    if (this.paused || this.mode === "MENU_BG") return;
    e.preventDefault();
    if (!this.input.active) return;
    const { x, y } = this.getPos(e);
    let dx = x - this.input.lastX;
    let dy = y - this.input.lastY;
    let forceMultiplier = 1.8; 
    if (this.controlMode === "INVERTED") {
      dx = -dx;
      dy = -dy;
    } else if (this.controlMode === "SWAP") {
      const temp = dx;
      dx = dy; 
      dy = temp; 
    }
    this.player.vx += dx * 0.15 * forceMultiplier;
    this.player.vy += dy * 0.15 * forceMultiplier;
    this.input.lastX = x;
    this.input.lastY = y;
  }
  handleEnd() { this.input.active = false; }
  getPos(e: any) {
    if (e.touches) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  loop() {
    if (!this.running) {
        this.isLooping = false;
        return;
    }
    
    this.isLooping = true;

    if (!this.paused) {
        if (this.mode === "GAME") {
            this.updateGame();
            this.drawGame();
        } else {
            this.updateMenuBg();
            this.drawMenuBg();
        }
    }
    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
  }

  updateMenuBg() {
      const speed = 2; 
      this.warpStars.forEach(s => {
          s.pz = s.z; 
          s.z -= speed;
          if (s.z < 1) {
              s.z = this.width;
              s.pz = this.width;
              s.x = (Math.random() - 0.5) * this.width * 2;
              s.y = (Math.random() - 0.5) * this.height * 2;
          }
      });
  }
  drawMenuBg() {
      if (this.width === 0 || this.height === 0) return;
      const cx = this.width / 2;
      const cy = this.height / 2;
      const stageColor = STAGE_LOGIC[this.menuStage].color;
      const grad = this.ctx.createRadialGradient(cx, this.height, 0, cx, this.height, this.height);
      grad.addColorStop(0, `${stageColor}22`); 
      grad.addColorStop(0.6, "#050508"); 
      grad.addColorStop(1, "#000"); 
      this.ctx.fillStyle = "#000";
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.lineWidth = 1;
      this.warpStars.forEach(s => {
          const sx = cx + (s.x / s.z) * 100;
          const sy = cy + (s.y / s.z) * 100;
          const px = cx + (s.x / s.pz) * 100;
          const py = cy + (s.y / s.pz) * 100;
          if (sx < 0 || sx > this.width || sy < 0 || sy > this.height) return;
          const alpha = 1 - (s.z / this.width);
          this.ctx.beginPath();
          this.ctx.moveTo(px, py);
          this.ctx.lineTo(sx, sy);
          if (alpha > 0.8) {
             this.ctx.strokeStyle = stageColor;
          } else {
             this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          }
          this.ctx.stroke();
      });
      const vignette = this.ctx.createRadialGradient(cx, cy, this.width * 0.3, cx, cy, this.width * 0.8);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.6)");
      this.ctx.fillStyle = vignette;
      this.ctx.fillRect(0, 0, this.width, this.height);
  }
  updateGame() {
    const dt = 1/60;
    this.timeElapsed += dt;
    this.score = Math.floor(this.timeElapsed * 100);
    this.callbacks.onScoreUpdate(this.score);
    if (this.stage === 4) {
      this.hellModeTimer += dt;
      if (this.hellModeTimer > 10) { 
        this.hellModeTimer = 0;
        const modes: ControlMode[] = ["NORMAL", "INVERTED", "SWAP"];
        const nextMode = modes[Math.floor(Math.random() * modes.length)];
        if (nextMode !== this.controlMode) {
             this.controlMode = nextMode;
             this.callbacks.onModeChange(this.controlMode);
             Sound.playModeSwitch();
             this.createExplosion(this.width/2, this.height/2, "#9d00ff", 30, 20);
        }
      }
    }
    const maxTime = STAGE_LOGIC[this.stage].duration;
    if (this.timeElapsed >= maxTime) {
      this.running = false;
      this.callbacks.onTimeUp();
      return;
    }
    this.player.x += this.player.vx;
    this.player.y += this.player.vy;
    this.player.vx *= 0.92;
    this.player.vy *= 0.92;
    if (this.player.x < this.player.radius) { this.player.x = this.player.radius; this.player.vx *= -0.5; }
    if (this.player.x > this.width - this.player.radius) { this.player.x = this.width - this.player.radius; this.player.vx *= -0.5; }
    if (this.player.y < this.player.radius) { this.player.y = this.player.radius; this.player.vy *= -0.5; }
    if (this.player.y > this.height - this.player.radius) { this.player.y = this.height - this.player.radius; this.player.vy *= -0.5; }
    this.player.trail.push({ x: this.player.x, y: this.player.y, alpha: 1.0 });
    if (this.player.trail.length > 15) this.player.trail.shift();
    this.player.trail.forEach(t => t.alpha -= 0.08);
    const difficultyMultiplier = 1 + (this.timeElapsed / 40); 
    const spawnChance = 0.06 * difficultyMultiplier; 
    if (Math.random() < spawnChance && this.obstacles.length < 60) {
      const size = Math.random() * 25 + 10;
      const speed = Math.random() * 3 + 2;
      const angle = Math.random() * Math.PI * 2;
      let sx, sy;
      if (Math.random() < 0.5) {
        sx = Math.random() < 0.5 ? -50 : this.width + 50;
        sy = Math.random() * this.height;
      } else {
        sx = Math.random() * this.width;
        sy = Math.random() < 0.5 ? -50 : this.height + 50;
      }
      this.obstacles.push({
        x: sx,
        y: sy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: size,
        color: this.stage === 4 ? `hsl(${Math.random() * 360}, 70%, 60%)` : '#fff'
      });
    }
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x += obs.vx;
      obs.y += obs.vy;
      if (obs.x < -100 || obs.x > this.width + 100 || obs.y < -100 || obs.y > this.height + 100) {
        this.obstacles.splice(i, 1);
        continue;
      }
      const dx = this.player.x - obs.x;
      const dy = this.player.y - obs.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.player.radius + obs.radius - 2) {
        if (this.safeMode) {
             const angle = Math.atan2(obs.y - this.player.y, obs.x - this.player.x);
             const pushForce = 5;
             obs.vx = Math.cos(angle) * pushForce;
             obs.vy = Math.sin(angle) * pushForce;
             this.createExplosion(
                (this.player.x + obs.x)/2, 
                (this.player.y + obs.y)/2, 
                "#00ff00", 
                10, 
                0.5
             );
             continue; 
        }
        this.createExplosion(this.player.x, this.player.y, "#fff", 50);
        this.running = false; 
        Sound.playCrash();
        this.callbacks.onGameOver(this.score, this.timeElapsed);
      }
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.04;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }
  createExplosion(x: number, y: number, color: string, count: number = 20, speedMult: number = 1) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 * speedMult;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color
      });
    }
  }
  drawGame() {
    this.ctx.fillStyle = 'rgba(5, 5, 8, 0.25)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.globalCompositeOperation = 'lighter';
    if (this.safeMode) {
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        this.ctx.rotate(this.timeElapsed * 3);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.player.radius + 6, 0, Math.PI * 1.5);
        this.ctx.strokeStyle = "rgba(0, 255, 0, 0.6)";
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.player.radius + 10, Math.PI, Math.PI * 2.5);
        this.ctx.strokeStyle = "rgba(0, 255, 0, 0.3)";
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        this.ctx.restore();
    }
    this.ctx.beginPath();
    for (let i = 0; i < this.player.trail.length - 1; i++) {
      const p1 = this.player.trail[i];
      const p2 = this.player.trail[i+1];
      this.ctx.strokeStyle = `rgba(0, 210, 255, ${p1.alpha * 0.5})`;
      this.ctx.lineWidth = this.player.radius * (i / this.player.trail.length);
      this.ctx.lineTo(p2.x, p2.y);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(p2.x, p2.y);
    }
    const playerColor = MODE_COLORS[this.controlMode];
    const pGrad = this.ctx.createRadialGradient(this.player.x, this.player.y, 0, this.player.x, this.player.y, this.player.radius);
    pGrad.addColorStop(0, "#fff");
    pGrad.addColorStop(0.4, playerColor);
    pGrad.addColorStop(1, "rgba(0,0,0,0)");
    this.ctx.beginPath();
    this.ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = pGrad;
    this.ctx.fill();
    this.ctx.fillStyle = "rgba(255,255,255,0.8)";
    this.ctx.beginPath();
    this.ctx.arc(this.player.x + this.player.vx * 3, this.player.y + this.player.vy * 3, 3, 0, Math.PI * 2);
    this.ctx.fill();
    this.obstacles.forEach(obs => {
      const grad = this.ctx.createRadialGradient(obs.x - obs.radius*0.3, obs.y - obs.radius*0.3, 0, obs.x, obs.y, obs.radius);
      grad.addColorStop(0, "#fff");
      grad.addColorStop(0.5, obs.color);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      this.ctx.beginPath();
      this.ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = grad;
      this.ctx.fill();
    });
    this.particles.forEach(p => {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life;
      this.ctx.fill();
      this.ctx.globalAlpha = 1;
    });
    this.ctx.globalCompositeOperation = 'source-over';
  }
}

// --- React Components ---

// --- NEW UNIFIED MODAL COMPONENT (Terminal Style) ---
const TerminalModal = ({ title, onClose, children, color = "cyan" }: any) => {
  // Map color to tailwind classes
  const borderColor = color === 'red' ? 'border-red-500' : color === 'yellow' ? 'border-yellow-500' : 'border-cyan-500';
  const textColor = color === 'red' ? 'text-red-500' : color === 'yellow' ? 'text-yellow-500' : 'text-cyan-500';

  return (
    <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-gray-900/90 border border-white/10 shadow-2xl flex flex-col max-h-[80vh] overflow-hidden group">
        
        {/* Decorative Corners */}
        <div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 ${borderColor}`}></div>
        <div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 ${borderColor}`}></div>
        <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 ${borderColor}`}></div>
        <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 ${borderColor}`}></div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
          <h2 className={`text-xl font-bold tracking-[0.2em] uppercase ${textColor} font-sans`}>
            {title}
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center border border-white/20 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Area (Monospace for data feel) */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent font-mono text-sm">
          {children}
        </div>

        {/* Footer Decoration */}
        <div className="p-2 border-t border-white/5 bg-black/20 flex justify-between items-center text-[10px] text-gray-600 font-mono uppercase tracking-widest">
           <span>SYST.OS.v1.6.0</span>
           <span>CONNECTED</span>
        </div>
      </div>
    </div>
  );
}

const FlashWarning = ({ mode, lang }: { mode: ControlMode | null, lang: Language }) => {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        if (mode) {
            setVisible(true);
            const timer = setTimeout(() => setVisible(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [mode]);
    if (!mode || !visible) return null;
    const config = TRANSLATIONS[lang].modes[mode];
    const color = MODE_COLORS[mode];
    return (
        <>
            <div className="absolute inset-0 pointer-events-none z-30 animate-pulse-border" style={{ '--color': color } as React.CSSProperties}></div>
            <div className="absolute top-24 left-0 w-full flex justify-center pointer-events-none z-40 animate-fade-in-out">
                 <div className="text-center opacity-80 backdrop-blur-sm bg-black/20 p-2 rounded">
                     <h1 className="text-3xl font-black italic tracking-widest" style={{ color: color }}>
                         {config.label}
                     </h1>
                     <p className="text-white text-sm font-bold uppercase tracking-[0.3em]">
                         {config.sub}
                     </p>
                 </div>
            </div>
        </>
    );
}

const LangToggle = ({ lang, toggleLang }: { lang: Language, toggleLang: () => void }) => (
    <button 
        onClick={toggleLang}
        className="text-xs font-bold tracking-widest text-gray-500 hover:text-white transition-colors border border-gray-700 px-2 py-1 rounded bg-black/50"
    >
        <span className={lang === 'CN' ? 'text-white' : 'text-gray-600'}>CN</span> / <span className={lang === 'EN' ? 'text-white' : 'text-gray-600'}>EN</span>
    </button>
);

const LegalModal = ({ onClose, lang }: { onClose: () => void, lang: Language }) => {
    const t = TRANSLATIONS[lang];
    const [activeTab, setActiveTab] = useState(0);

    const parseContent = (text: string) => {
        return text.split('\n').map((line, i) => {
            if (line.startsWith('**')) {
                return <h3 key={i} className="text-cyan-400 font-bold mt-4 mb-2 text-xs tracking-widest uppercase">{line.replace(/\*\*/g, '')}</h3>
            }
            if (line.trim().startsWith('-')) {
                 return <li key={i} className="ml-4 mb-1 text-gray-400 list-none flex gap-2 text-xs">
                    <span className="text-gray-600">›</span>
                    <span>{line.replace('-', '').trim()}</span>
                 </li>
            }
            if (line.trim() === "") return <br key={i}/>
            return <p key={i} className="text-gray-400 mb-1 leading-relaxed text-xs">{line}</p>
        })
    }
    
    return (
        <TerminalModal title={t.ui.legal.title} onClose={onClose} color="cyan">
             {/* Tabs within Terminal */}
             <div className="flex border-b border-white/10 mb-4 -mx-6 px-6 bg-white/5">
                 {t.ui.legal.tabs.map((tab: string, i: number) => (
                     <button 
                        key={i}
                        onClick={() => setActiveTab(i)}
                        className={`flex-1 py-2 text-[10px] font-bold tracking-wider uppercase transition-colors
                            ${activeTab === i ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-600 hover:text-gray-400 hover:bg-white/5'}
                        `}
                     >
                         {tab}
                     </button>
                 ))}
             </div>
             <div>
                 {parseContent(t.ui.legal.content[activeTab as keyof typeof t.ui.legal.content])}
             </div>
        </TerminalModal>
    );
}

const MorePlatformsModal = ({ onClose, lang }: { onClose: () => void, lang: Language }) => {
    const t = TRANSLATIONS[lang];
    return (
        <TerminalModal title={t.ui.morePlatforms} onClose={onClose} color="cyan">
             <div className="space-y-4">
                <div className="text-xs text-cyan-400 tracking-[0.2em] mb-4 animate-pulse border-b border-cyan-900/30 pb-2">{t.ui.morePlatformsContent[0]}</div>
                {t.ui.morePlatformsContent.slice(1).map((item, i) => (
                    <div key={i} className="p-3 border border-white/10 bg-white/5 text-sm text-gray-300 hover:bg-white/10 transition-colors flex justify-between items-center group">
                        <span>{item.split(' (')[0]}</span>
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 text-gray-500 group-hover:text-white transition-colors">
                            {item.split(' (')[1].replace(')', '')}
                        </span>
                    </div>
                ))}
             </div>
        </TerminalModal>
    );
}

const FAQModal = ({ onClose, lang }: { onClose: () => void, lang: Language }) => {
    const t = TRANSLATIONS[lang];
    return (
        <TerminalModal title={t.ui.faq} onClose={onClose} color="cyan">
             <div className="space-y-6">
                 {t.ui.faqContent.map((item, i) => (
                     <div key={i} className="border-b border-white/5 pb-4 last:border-0">
                         <h3 className="text-cyan-400 font-bold mb-2 tracking-wide text-xs">Q: {item.q}</h3>
                         <p className="text-gray-400 text-xs leading-relaxed">A: {item.a}</p>
                     </div>
                 ))}
             </div>
        </TerminalModal>
    );
}

const AchievementsModal = ({ stats, onClose, lang }: { stats: GameStats, onClose: () => void, lang: Language }) => {
    const t = TRANSLATIONS[lang];
    return (
        <TerminalModal title={t.ui.achievements} onClose={onClose} color="yellow">
            <div className="space-y-3">
                {ACHIEVEMENTS_LOGIC.map(achLogic => {
                    const unlocked = achLogic.check(stats);
                    const achText = t.achievements[achLogic.id as keyof typeof t.achievements];
                    return (
                        <div key={achLogic.id} className={`p-3 border flex justify-between items-center transition-all ${unlocked ? 'border-yellow-500/50 bg-yellow-900/10' : 'border-gray-800 bg-gray-900/30 grayscale opacity-60'}`}>
                            <div>
                                <h3 className={`font-bold text-xs ${unlocked ? 'text-yellow-100' : 'text-gray-500'}`}>{achText.title}</h3>
                                <p className="text-[10px] text-gray-400">{achText.desc}</p>
                            </div>
                            {unlocked && <span className="text-xl">🏆</span>}
                        </div>
                    )
                })}
            </div>
        </TerminalModal>
    );
};

const ManualModal = ({ onClose, lang }: { onClose: () => void, lang: Language }) => {
    const t = TRANSLATIONS[lang];
    const [tab, setTab] = useState<'PROTOCOLS' | 'INTEL'>('PROTOCOLS');

    return (
        <TerminalModal title={t.ui.manual} onClose={onClose} color="cyan">
            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-white/10 pb-2">
                <button 
                    onClick={() => setTab('PROTOCOLS')}
                    className={`text-xs font-bold tracking-widest transition-colors ${tab === 'PROTOCOLS' ? 'text-white underline decoration-cyan-400 underline-offset-4' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    {t.ui.protocols}
                </button>
                <button 
                    onClick={() => setTab('INTEL')}
                    className={`text-xs font-bold tracking-widest transition-colors ${tab === 'INTEL' ? 'text-white underline decoration-cyan-400 underline-offset-4' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    {t.ui.intel}
                </button>
            </div>

            <div className="space-y-6">
                {tab === 'PROTOCOLS' && (
                    <div className="space-y-4">
                        <div className="p-4 border border-dashed border-white/20 bg-white/5">
                             {t.ui.howToPlay.map((line: string, i: number) => (
                                <p key={i} className={`mb-2 text-xs ${i === t.ui.howToPlay.length - 1 ? "text-yellow-500 font-bold mt-4" : "text-gray-300"}`}>{line}</p>
                            ))}
                        </div>
                        <div className="text-[10px] text-gray-600 text-center italic mt-8 border-t border-white/10 pt-4">
                            <p>SYSTEM VERSION 1.6.0 // EVASION_CORE</p>
                        </div>
                    </div>
                )}

                {tab === 'INTEL' && (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((s) => {
                            const stageInfo = t.stages[s as Stage];
                            const config = STAGE_LOGIC[s as Stage];
                            return (
                                <div key={s} className="p-3 border-l-2 bg-white/5" style={{ borderColor: config.color }}>
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className="font-bold text-sm" style={{ color: config.color }}>{stageInfo.name}</h3>
                                        <span className="text-[10px] font-mono px-1 border border-white/10 text-gray-400">
                                            {config.duration}s
                                        </span>
                                    </div>
                                    <div className="text-[10px] font-bold text-gray-500 mb-1 tracking-wider uppercase">[{stageInfo.tag}]</div>
                                    <p className="text-xs text-gray-400">{stageInfo.desc}</p>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </TerminalModal>
    );
};


const UIOverlay = ({ 
  gameState, 
  stage, 
  score, 
  time, 
  onStart, 
  onNextStage, 
  unlockedStage,
  flavorText,
  stats,
  showAchievements,
  toggleAchievements,
  activeControlMode,
  selectedStage,
  setSelectedStage,
  flashMode,
  onResume,
  onRestart,
  onQuit,
  onPause,
  lang,
  toggleLang,
  bgmOn,
  toggleBgm,
  safeMode,
  toggleSafeMode
}: any) => {

  const t = TRANSLATIONS[lang as Language];
  const [showManual, setShowManual] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showMorePlatforms, setShowMorePlatforms] = useState(false);

  // Updated MenuButton to be more "Button-like" and less "Card-like"
  const MenuButton = ({ onClick, children, primary = false, disabled = false, active = false, className = "", fontSize = "text-sm" }: any) => (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`w-full mb-2 font-bold ${fontSize} tracking-[0.2em] uppercase transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border
        ${primary 
          ? 'py-4 px-6 bg-white text-black border-transparent shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:bg-gray-200' 
          : 'py-3 px-6 border-white/30 bg-black/40 text-gray-300 hover:text-white hover:border-white hover:bg-white/10'
        } ${className}`}
    >
      {children}
    </button>
  );

  if (showAchievements) return <AchievementsModal stats={stats} onClose={toggleAchievements} lang={lang} />;
  if (showManual) return <ManualModal onClose={() => setShowManual(false)} lang={lang} />;
  if (showLegal) return <LegalModal onClose={() => setShowLegal(false)} lang={lang} />;
  if (showFAQ) return <FAQModal onClose={() => setShowFAQ(false)} lang={lang} />;
  if (showMorePlatforms) return <MorePlatformsModal onClose={() => setShowMorePlatforms(false)} lang={lang} />;

  // --- PAUSE MENU ---
  if (gameState === "PAUSED") {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-8 text-center z-50 animate-fade-in">
             <div className="w-full max-w-sm border-t-2 border-b-2 border-white/10 py-12 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black px-4 text-xs font-bold tracking-[0.3em] text-gray-500">SYSTEM HALTED</div>
                <h2 className="text-4xl font-black text-white mb-8 tracking-[0.2em] font-sans">{t.ui.paused}</h2>
                <div className="space-y-4">
                    <MenuButton primary onClick={onResume}>{t.ui.resume}</MenuButton>
                    <MenuButton onClick={onRestart}>{t.ui.restart}</MenuButton>
                    <MenuButton onClick={onQuit}>{t.ui.quit}</MenuButton>
                </div>
            </div>
        </div>
      );
  }

  // --- PLAYING STATE ---
  if (gameState === "PLAYING") {
    const progress = Math.min(100, (time / STAGE_LOGIC[stage as Stage].duration) * 100);
    const modeInfo = t.modes[activeControlMode as ControlMode];
    const modeColor = MODE_COLORS[activeControlMode as ControlMode];
    const stageName = t.stages[stage as Stage].name;
    const isAbnormal = activeControlMode !== "NORMAL";

    return (
      <>
        <FlashWarning mode={flashMode} lang={lang} />
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none text-white select-none z-30">
          <div>
            <h1 className="text-4xl font-bold tracking-widest leading-none text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] font-sans">{score.toString().padStart(5, '0')}</h1>
            <div className="flex flex-col items-start gap-1 mt-2">
                 <div className="flex items-center gap-2">
                     <p className={`text-xs font-bold tracking-[0.2em] uppercase transition-colors duration-500 ${isAbnormal ? 'animate-text-blink' : ''}`} style={{ color: modeColor }}>
                        {stageName} // {modeInfo.label}
                     </p>
                 </div>
                 {safeMode && (
                    <div className="text-[9px] font-bold text-green-500 tracking-widest border border-green-500/30 px-2 py-0.5 bg-green-900/30 mt-1">
                        [ {t.ui.safeMode} ]
                    </div>
                 )}
            </div>
          </div>
          
          <div className="flex gap-4 items-center pointer-events-auto">
             <button onClick={onPause} className="w-10 h-10 border border-white/20 flex items-center justify-center backdrop-blur-sm transition-colors hover:bg-white/10 group">
                 <div className="w-3 h-3 border-l-2 border-r-2 border-white group-hover:scale-110 transition-transform"></div>
             </button>
             <div className="w-16 h-16 border-2 border-gray-800 flex items-center justify-center relative rounded-full">
                <svg className="absolute w-full h-full transform -rotate-90 pointer-events-none">
                <circle cx="30" cy="30" r="28" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-gray-900" />
                <circle cx="30" cy="30" r="28" stroke={STAGE_LOGIC[stage as Stage].color} strokeWidth="2" fill="transparent" strokeDasharray={175} strokeDashoffset={175 - (175 * progress) / 100} />
                </svg>
                <span className="text-lg font-bold font-mono">{Math.floor(Math.max(0, STAGE_LOGIC[stage as Stage].duration - time))}</span>
             </div>
          </div>
        </div>
      </>
    );
  }

  // --- MENU STATE (NEW WARP DESIGN) ---
  if (gameState === "MENU") {
    const isLocked = selectedStage > unlockedStage;
    const stageLogic = STAGE_LOGIC[selectedStage as Stage];
    const stageText = t.stages[selectedStage as Stage];
    
    return (
      <div 
        className="absolute inset-0 flex flex-col items-center justify-between bg-transparent p-6 text-center animate-fade-in z-50 overflow-hidden cursor-pointer"
        onClick={() => !isLocked && onStart(selectedStage)} 
      >
        
        {/* Top Bar Actions */}
        <div className="absolute top-6 right-6 z-20 flex gap-4 text-xs font-bold tracking-widest text-gray-500 items-center pointer-events-auto" onClick={e => e.stopPropagation()}>
             <button onClick={toggleBgm} className={`hover:text-white transition-colors uppercase ${bgmOn ? 'text-white' : ''}`}>
                 {bgmOn ? t.ui.bgmOn : t.ui.bgmOff}
             </button>
             <span className="text-gray-700">|</span>
             <LangToggle lang={lang} toggleLang={toggleLang} />
        </div>

        <div className="absolute top-6 left-6 z-20 flex gap-4 text-xs font-bold tracking-widest text-gray-500 pointer-events-auto" onClick={e => e.stopPropagation()}>
             <button onClick={toggleSafeMode} className={`transition-colors uppercase ${safeMode ? 'text-green-500 hover:text-green-400' : 'text-gray-600 hover:text-gray-400'}`}>
                {t.ui.version} {safeMode && `[${t.ui.safeMode}]`}
             </button>
        </div>

        {/* TOP: TITLE & SUBTITLE */}
        <div className="relative z-10 w-full max-w-2xl mt-16 pointer-events-none">
             <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] font-sans">
                {t.ui.titleMain}
             </h1>
             <div className="flex justify-center items-center gap-4 mt-2 opacity-70">
                <div className="h-[1px] w-12 bg-white/50"></div>
                <div className="text-xs md:text-sm font-bold text-cyan-200 tracking-[0.8em] uppercase shadow-cyan-500/50">
                    {t.ui.titleSub}
                </div>
                <div className="h-[1px] w-12 bg-white/50"></div>
             </div>
        </div>

        {/* CENTER: NEGATIVE SPACE TRIGGER */}
        <div className="flex-1 flex flex-col items-center justify-center w-full pointer-events-none">
            {isLocked ? (
                <div className="text-red-900 font-bold tracking-[0.3em] text-sm animate-pulse border border-red-900/50 px-4 py-2 bg-black/50">
                    {t.ui.lockedDesc}
                </div>
            ) : (
                <div className="flex flex-col items-center gap-4 animate-pulse">
                     <span className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-white/50 border-t border-b border-white/10 py-1 px-4">
                        {t.ui.startHint}
                     </span>
                     <div className="flex items-center gap-3 opacity-40">
                        <div className="w-1 h-1 bg-red-500"></div>
                        <span className="text-[8px] tracking-[0.4em] uppercase text-red-200">{t.ui.gameplayHint}</span>
                        <div className="w-1 h-1 bg-red-500"></div>
                     </div>
                </div>
            )}
        </div>
        
        {/* BOTTOM: STAGE & FOOTER */}
        <div className="relative z-10 w-full flex flex-col items-center gap-8 mb-6 pointer-events-auto" onClick={e => e.stopPropagation()}> 
            
            {/* Stage Selector */}
            <div className="w-full max-w-lg">
                <div className="text-center mb-6 h-6">
                     <h2 className="text-xl font-bold tracking-[0.2em] transition-colors duration-300 font-sans" style={{ color: isLocked ? '#374151' : stageLogic.color }}>
                         {stageText.name}
                     </h2>
                </div>
                <div className="flex items-center justify-center gap-8 relative px-4">
                     <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/10 -z-10"></div>
                     
                     {[1, 2, 3, 4].map((s) => {
                         const isSelected = selectedStage === s;
                         const isUnlocked = s <= unlockedStage;
                         return (
                            <button key={s} onClick={() => setSelectedStage(s)} className={`relative group transition-all duration-300 ${isSelected ? 'scale-125' : 'hover:scale-110'}`}>
                                <div className={`w-3 h-3 transition-all duration-300 transform rotate-45 ${isSelected ? 'bg-white shadow-[0_0_10px_white]' : isUnlocked ? 'bg-gray-600' : 'bg-gray-900 border border-gray-800'}`}></div>
                                <span className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-widest transition-colors duration-300 ${isSelected ? 'text-white' : 'text-gray-700'}`}>0{s}</span>
                            </button>
                         )
                     })}
                </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center gap-6 px-8 py-3 bg-black/40 backdrop-blur-sm border-t border-b border-white/5 shadow-2xl">
                 <button onClick={() => setShowManual(true)} className="text-[10px] font-bold text-gray-500 hover:text-white tracking-widest transition-colors uppercase">{t.ui.manual}</button>
                 <span className="text-gray-800 text-[10px]">/</span>
                 <button onClick={toggleAchievements} className="text-[10px] font-bold text-gray-500 hover:text-yellow-500 tracking-widest transition-colors uppercase">{t.ui.achievements}</button>
                 <span className="text-gray-800 text-[10px]">/</span>
                 <button onClick={() => setShowLegal(true)} className="text-[10px] font-bold text-gray-500 hover:text-cyan-400 tracking-widest transition-colors uppercase">{t.ui.disclaimer}</button>
            </div>
        </div>
      </div>
    );
  }

  // --- GAME OVER & CLEAR STATES (MISSION REPORT STYLE) ---
  if (gameState === "GAME_OVER") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/20 backdrop-blur-xl p-8 text-center animate-bounce-in z-50">
        <div className="w-full max-w-sm border border-red-500/30 bg-black/60 p-1 relative">
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-red-500"></div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-red-500"></div>
            
            <div className="bg-red-900/10 p-6 border border-red-500/10">
                <h2 className="text-4xl font-black text-red-500 mb-2 tracking-widest uppercase font-sans">{t.ui.crash}</h2>
                <div className="h-[1px] w-full bg-red-500/30 mb-4"></div>
                <p className="text-red-100 text-sm mb-6 italic opacity-80 font-mono leading-relaxed">"{flavorText}"</p>
                <div className="mb-8 p-4 bg-black/40 border border-red-500/20">
                    <div className="text-[10px] text-red-400 uppercase tracking-[0.3em] mb-1">{t.ui.score}</div>
                    <div className="text-4xl font-mono text-white">{score}</div>
                </div>
                <div className="space-y-3">
                    <MenuButton primary onClick={() => onStart(stage)}>{t.ui.replay}</MenuButton>
                    <MenuButton onClick={() => { setSelectedStage(stage); onNextStage("MENU"); }}>{t.ui.quit}</MenuButton>
                </div>
            </div>
        </div>
      </div>
    );
  }

  if (gameState === "STAGE_CLEAR") {
    const nextStageText = t.stages[(stage + 1) as Stage];
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-900/20 backdrop-blur-xl p-8 text-center z-50">
         <div className="w-full max-w-sm border border-blue-400/30 bg-black/60 p-1 relative">
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-blue-400"></div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-blue-400"></div>
            
            <div className="bg-blue-900/10 p-6 border border-blue-400/10">
                <h2 className="text-4xl font-black text-blue-400 mb-2 tracking-widest uppercase font-sans">{t.ui.stageComplete}</h2>
                <div className="h-[1px] w-full bg-blue-400/30 mb-4"></div>
                <p className="text-blue-100 text-sm mb-6 italic opacity-80 font-mono">"{flavorText}"</p>
                
                <div className="bg-black/40 p-4 border border-blue-400/20 mb-6 text-left relative overflow-hidden">
                    <div className="text-[9px] text-blue-500 tracking-widest mb-2 uppercase">Detected Next Phase:</div>
                    <div className="text-2xl font-bold text-white mb-1 font-sans">{nextStageText.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{nextStageText.desc}</div>
                    {/* Scanline decoration */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-blue-400/50 animate-slide-down-bounce opacity-20"></div>
                </div>
                
                <div className="space-y-3">
                    <MenuButton primary onClick={onNextStage}>{t.ui.continue}</MenuButton>
                    <MenuButton onClick={() => onStart(stage)}>{t.ui.replay}</MenuButton>
                </div>
            </div>
        </div>
      </div>
    );
  }
  
  if (gameState === "VICTORY") {
    return (
       <div className="absolute inset-0 flex flex-col items-center justify-center bg-purple-900/30 backdrop-blur-xl p-8 text-center z-50">
         <div className="w-full max-w-sm border border-purple-400/30 bg-black/60 p-1 relative">
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-purple-400"></div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-purple-400"></div>
            <div className="bg-purple-900/10 p-8 border border-purple-400/10">
                <h2 className="text-5xl font-black text-purple-400 mb-4 tracking-tighter uppercase font-sans">{t.ui.legend}</h2>
                <p className="text-purple-100 text-lg mb-8 italic font-mono">"{flavorText}"</p>
                <div className="text-sm tracking-widest text-purple-300 mb-2">{t.ui.finalScore}</div>
                <div className="text-4xl font-mono mb-8">{score}</div>
                <MenuButton primary onClick={() => onStart(1)}>{t.ui.playAgain}</MenuButton>
            </div>
         </div>
       </div>
    )
  }

  return null;
};

// ... (App Component Remains the Same)

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Persisted State
  const [stats, setStats] = useState<GameStats>(() => {
    try {
      const saved = localStorage.getItem('orbit_stats');
      return saved ? JSON.parse(saved) : { totalDeaths: 0, maxStage: 1, hellModeTime: 0, totalPlayTime: 0 };
    } catch {
      return { totalDeaths: 0, maxStage: 1, hellModeTime: 0, totalPlayTime: 0 };
    }
  });

  // UI/Game State
  const [gameState, setGameState] = useState<GameState>("MENU");
  const [stage, setStage] = useState<Stage>(1);
  const [selectedStage, setSelectedStage] = useState<number>(1);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [activeControlMode, setActiveControlMode] = useState<ControlMode>("NORMAL");
  const [flashMode, setFlashMode] = useState<ControlMode | null>(null);
  const [flavorText, setFlavorText] = useState("");
  const [showAchievements, setShowAchievements] = useState(false);
  const [achievementNotification, setAchievementNotification] = useState<string | null>(null);

  // Settings
  const [lang, setLang] = useState<Language>("CN");
  const [bgmOn, setBgmOn] = useState(false);
  
  // Dev
  const [safeMode, setSafeMode] = useState(false);

  // Refs for callbacks to avoid re-creating GameEngine
  const stageRef = useRef<Stage>(stage);
  const langRef = useRef<Language>(lang);

  useEffect(() => { stageRef.current = stage; }, [stage]);
  useEffect(() => { langRef.current = lang; }, [lang]);
  
  // Sync safe mode to engine
  useEffect(() => {
      if(engineRef.current) {
          engineRef.current.setSafeMode(safeMode);
      }
  }, [safeMode]);

  // Sync menu stage to engine for visual updates
  useEffect(() => {
    if (engineRef.current) {
        engineRef.current.setMenuStage(selectedStage as Stage);
    }
  }, [selectedStage]);

  useEffect(() => {
    localStorage.setItem('orbit_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    if (bgmOn && gameState === "PLAYING") {
      BGM.start();
    } else {
      BGM.stop();
    }
  }, [bgmOn, gameState]);

  const checkAchievements = useCallback((currentStats: GameStats) => {
      ACHIEVEMENTS_LOGIC.forEach(ach => {
          const isUnlockedAlready = localStorage.getItem(`ach_${ach.id}`);
          if (!isUnlockedAlready && ach.check(currentStats)) {
              localStorage.setItem(`ach_${ach.id}`, 'true');
              Sound.playUnlock();
              setAchievementNotification(ach.id);
              setTimeout(() => setAchievementNotification(null), 4000); // Show for 4s
          }
      });
  }, []);

  const handleGameOver = useCallback((finalScore: number, finalTime: number) => {
    setGameState("GAME_OVER");

    // Use Refs
    const currentStage = stageRef.current;
    const currentLang = langRef.current;

    setStats(prev => {
      const newStats = { ...prev };
      newStats.totalDeaths += 1;
      newStats.totalPlayTime += finalTime;
      if (currentStage === 4) {
        newStats.hellModeTime = Math.max(newStats.hellModeTime, finalTime);
      }
      checkAchievements(newStats);
      return newStats;
    });

    const t = TRANSLATIONS[currentLang];
    let flavor = "";
    if (finalTime < 10) flavor = t.flavor.earlyDeath[Math.floor(Math.random() * t.flavor.earlyDeath.length)];
    else flavor = t.flavor.midGameDeath[Math.floor(Math.random() * t.flavor.midGameDeath.length)];
    setFlavorText(flavor);
  }, [checkAchievements]); // Removed stage/lang from dependencies

  const handleTimeUp = useCallback(() => {
    const currentStage = stageRef.current;
    const currentLang = langRef.current;

    if (currentStage === 4) {
      setGameState("VICTORY");
      Sound.playLevelClear();
      setFlavorText(TRANSLATIONS[currentLang].flavor.victory[Math.floor(Math.random() * TRANSLATIONS[currentLang].flavor.victory.length)]);
      setStats(s => {
          const ns = { ...s, maxStage: 5 };
          checkAchievements(ns);
          return ns;
      });
    } else {
      setGameState("STAGE_CLEAR");
      Sound.playLevelClear();
      setFlavorText(TRANSLATIONS[currentLang].flavor.stageClear[Math.floor(Math.random() * TRANSLATIONS[currentLang].flavor.stageClear.length)]);
      setStats(s => {
          const ns = { ...s, maxStage: Math.max(s.maxStage, currentStage + 1) };
          checkAchievements(ns);
          return ns;
      });
    }
  }, [checkAchievements]); // Removed stage/lang from dependencies

  const handleScoreUpdate = useCallback((newScore: number) => {
    setScore(newScore);
    setTime(newScore / 100);
  }, []);

  const handleModeChange = useCallback((mode: ControlMode) => {
    setActiveControlMode(mode);
    setFlashMode(mode);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    // This effect should now only run ONCE on mount (and unmount) because dependencies are stable
    engineRef.current = new GameEngine(canvasRef.current, {
      onGameOver: handleGameOver,
      onTimeUp: handleTimeUp,
      onScoreUpdate: handleScoreUpdate,
      onModeChange: handleModeChange
    });
    
    // Initial sync
    engineRef.current.setSafeMode(safeMode);

    return () => {
      engineRef.current?.destroy();
    };
  }, [handleGameOver, handleTimeUp, handleScoreUpdate, handleModeChange]);

  const startGame = (s: Stage) => {
    setStage(s);
    setScore(0);
    setTime(0);
    setGameState("PLAYING");
    setFlashMode(null);
    // start() calls callbacks.onModeChange immediately.
    // If handleModeChange is stable, this is fine.
    engineRef.current?.start(s);
  };

  const nextStage = (override: any) => {
    if (override === "MENU") {
      setGameState("MENU");
      engineRef.current?.stop(); // Return to Menu Bg
      return;
    }
    const next = (stage + 1) as Stage;
    if (next <= 4) {
      startGame(next);
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden touch-none select-none font-sans text-white">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <UIOverlay
        gameState={gameState}
        stage={stage}
        score={score}
        time={time}
        onStart={startGame}
        onNextStage={nextStage}
        unlockedStage={stats.maxStage}
        flavorText={flavorText}
        stats={stats}
        showAchievements={showAchievements}
        toggleAchievements={() => setShowAchievements(!showAchievements)}
        activeControlMode={activeControlMode}
        selectedStage={selectedStage}
        setSelectedStage={setSelectedStage}
        flashMode={flashMode}
        onResume={() => {
          setGameState("PLAYING");
          engineRef.current?.resume();
        }}
        onRestart={() => {
          startGame(stage);
        }}
        onQuit={() => {
          setGameState("MENU");
          engineRef.current?.stop();
        }}
        onPause={() => {
          setGameState("PAUSED");
          engineRef.current?.pause();
        }}
        lang={lang}
        toggleLang={() => setLang(l => l === 'EN' ? 'CN' : 'EN')}
        bgmOn={bgmOn}
        toggleBgm={() => setBgmOn(b => !b)}
        safeMode={safeMode}
        toggleSafeMode={() => setSafeMode(s => !s)}
      />

       {/* Floating Cyber-Badge for Achievements */}
       {achievementNotification && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[100] pointer-events-none animate-slide-down-bounce">
              <div className="relative overflow-hidden bg-black/60 backdrop-blur-xl border border-yellow-500/50 rounded-lg shadow-[0_0_30px_rgba(234,179,8,0.3)] px-6 py-4 flex items-center gap-4 min-w-[280px]">
                  <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-yellow-400 rounded-tl-lg"></div>
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-yellow-400 rounded-br-lg"></div>
                  <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full border-2 border-yellow-400 flex items-center justify-center bg-yellow-900/30">
                          <span className="text-xl">🏆</span>
                      </div>
                      <div className="absolute inset-0 rounded-full border border-white/50 animate-ping opacity-50"></div>
                  </div>
                  <div className="flex-1">
                      <div className="text-[10px] font-black tracking-[0.2em] text-yellow-400 uppercase mb-0.5">
                          {TRANSLATIONS[lang].ui.achievementUnlocked}
                      </div>
                      <div className="text-lg font-bold text-white tracking-wide">
                          {TRANSLATIONS[lang].achievements[achievementNotification as keyof typeof TRANSLATIONS['CN']['achievements']].title}
                      </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-shine pointer-events-none"></div>
              </div>
          </div>
      )}

      <style>{`
              @keyframes pulse-border {
                  0% { box-shadow: inset 0 0 0 0px var(--color); }
                  50% { box-shadow: inset 0 0 50px 10px var(--color); }
                  100% { box-shadow: inset 0 0 0 0px var(--color); }
              }
              .animate-pulse-border {
                  animation: pulse-border 0.5s ease-out;
              }
              @keyframes fade-in-out {
                  0% { opacity: 0; transform: scale(1.5); }
                  20% { opacity: 1; transform: scale(1); }
                  80% { opacity: 1; transform: scale(1); }
                  100% { opacity: 0; transform: scale(0.9); }
              }
              .animate-fade-in-out {
                  animation: fade-in-out 2s forwards;
              }
               @keyframes fade-in {
                  from { opacity: 0; }
                  to { opacity: 1; }
              }
              .animate-fade-in {
                  animation: fade-in 0.3s ease-out;
              }
              @keyframes bounce-in {
                  0% { opacity: 0; transform: scale(0.8); }
                  50% { opacity: 1; transform: scale(1.05); }
                  100% { opacity: 1; transform: scale(1); }
              }
              .animate-bounce-in {
                  animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
              }
              
              /* Badge Animations */
              @keyframes slide-down-bounce {
                  0% { transform: translate(-50%, -200%); opacity: 0; }
                  60% { transform: translate(-50%, 10%); opacity: 1; }
                  80% { transform: translate(-50%, -5%); }
                  100% { transform: translate(-50%, 0); }
              }
              .animate-slide-down-bounce {
                  animation: slide-down-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
              }
              @keyframes shine {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(100%); }
              }
              .animate-shine {
                  animation: shine 1.5s ease-in-out infinite;
              }
              
              /* Star Ring Core Animations */
              @keyframes pulse-glow {
                  0%, 100% { transform: scale(1); opacity: 0.3; }
                  50% { transform: scale(1.05); opacity: 0.5; }
              }
              .animate-pulse-glow {
                  animation: pulse-glow 3s infinite ease-in-out;
              }
              @keyframes spin-slow {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
              }
              .animate-spin-slow {
                  animation: spin-slow 20s linear infinite;
              }
              @keyframes spin-reverse {
                  from { transform: rotate(360deg); }
                  to { transform: rotate(0deg); }
              }
              .animate-spin-reverse {
                  animation: spin-reverse 15s linear infinite;
              }
              @keyframes text-blink {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.5; }
              }
              .animate-text-blink {
                  animation: text-blink 1s ease-in-out infinite;
              }
          `}</style>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);