/* =========================================
   CONFIGURACIÓN Y ESTADO
   ========================================= */
const state = {
    isPaused: false,
    isMuted: false,
    currentScene: 0,
    timers: [],
    audioContext: null,
    oscillators: []
};

const bgMusic = document.getElementById('miMusica');

const ALERTS = [
    "WARNING: DEADLINE APPROACHING",
    "SERVER HAS BEEN CONQUERED",
    "CSS OVERRIDE DETECTED",
    "GHA EMPIRE EXPANSION: 100%",
    "NEW ASSIGNMENT DEPLOYED",
    "FINAL BOSS DETECTED"
];

/* =========================================
   SISTEMA DE AUDIO (Web Audio API)
   ========================================= */
function initAudio() {
    if (!state.audioContext) {
        state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (state.audioContext.state === 'suspended') {
        state.audioContext.resume();
    }
}

function playEngineRumble() {
    if (state.isMuted || !state.audioContext) return;
    const osc = state.audioContext.createOscillator();
    const gain = state.audioContext.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(40, state.audioContext.currentTime);
    
    gain.gain.setValueAtTime(0, state.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, state.audioContext.currentTime + 3);
    
    osc.connect(gain);
    gain.connect(state.audioContext.destination);
    osc.start();
    state.oscillators.push({ osc, gain });
}

function playDramaticHit() {
    if (state.isMuted || !state.audioContext) return;
    const osc = state.audioContext.createOscillator();
    const gain = state.audioContext.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, state.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, state.audioContext.currentTime + 1);
    
    gain.gain.setValueAtTime(0.5, state.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, state.audioContext.currentTime + 2);
    
    osc.connect(gain);
    gain.connect(state.audioContext.destination);
    osc.start();
    osc.stop(state.audioContext.currentTime + 2);
}

function playGlitchSound() {
    if (state.isMuted || !state.audioContext) return;
    const osc = state.audioContext.createOscillator();
    const gain = state.audioContext.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, state.audioContext.currentTime);
    osc.frequency.setValueAtTime(400, state.audioContext.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.2, state.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, state.audioContext.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(state.audioContext.destination);
    osc.start();
    osc.stop(state.audioContext.currentTime + 0.2);
}

/* =========================================
   CAMPO ESTELAR (Canvas)
   ========================================= */
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
let stars = [];
let animationFrameId;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);

function createStars() {
    stars = [];
    for (let i = 0; i < 400; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2,
            speed: (Math.random() * 0.5) + 0.1,
            opacity: Math.random()
        });
    }
}

function drawStars() {
    if (state.isPaused) {
        animationFrameId = requestAnimationFrame(drawStars);
        return;
    }
    
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--space-black');
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });
    
    animationFrameId = requestAnimationFrame(drawStars);
}

/* =========================================
   MOTOR DE SECUENCIAS (A PRUEBA DE FALLOS)
   ========================================= */
class ResumableTimeout {
    constructor(callback, delay) {
        this.callback = callback;
        this.initialDelay = delay;
        this.remaining = delay;
        this.hasFired = false;
        this.isCurrentlyPaused = false;
        this.resume();
    }
    
    pause() {
        if (this.hasFired || this.isCurrentlyPaused) return;
        window.clearTimeout(this.timerId);
        this.remaining -= Date.now() - this.start;
        this.isCurrentlyPaused = true;
    }
    
    resume() {
        if (this.hasFired) return;
        this.isCurrentlyPaused = false;
        this.start = Date.now();
        window.clearTimeout(this.timerId);
        this.timerId = window.setTimeout(() => {
            this.hasFired = true;
            this.callback();
        }, this.remaining);
    }
    
    skip(ms) {
        if (this.hasFired) return;
        
        const wasPaused = this.isCurrentlyPaused;
        if (!wasPaused) this.pause();
        
        this.remaining -= ms; 
        
        // Evitar que el botón de regresar cree esperas infinitas
        if (this.remaining > this.initialDelay) {
            this.remaining = this.initialDelay;
        }
        
        if (this.remaining <= 0) {
            this.hasFired = true;
            this.callback(); 
        } else {
            if (!wasPaused && !state.isPaused) {
                this.resume();
            }
        }
    }
}

function wait(ms) {
    return new Promise(resolve => {
        const timer = new ResumableTimeout(() => {
            state.timers = state.timers.filter(t => t !== timer);
            resolve();
        }, ms);
        state.timers.push(timer);
    });
}

function switchScene(oldSceneId, newSceneId) {
    if (oldSceneId) {
        const oldEl = document.getElementById(oldSceneId);
        if (oldEl) oldEl.classList.remove('active');
    }
    if (newSceneId) {
        const newEl = document.getElementById(newSceneId);
        if (newEl) newEl.classList.add('active');
    }
}

/* =========================================
   EVENTOS VISUALES ALEATORIOS
   ========================================= */
function triggerGlitch() {
    if (state.isPaused || state.currentScene !== 3) return;
    
    const overlay = document.getElementById('glitch-overlay');
    const alertBox = document.getElementById('imperial-alert');
    
    overlay.classList.add('glitch-active');
    alertBox.innerText = ALERTS[Math.floor(Math.random() * ALERTS.length)];
    alertBox.classList.remove('hidden');
    playGlitchSound();
    
    setTimeout(() => {
        overlay.classList.remove('glitch-active');
        alertBox.classList.add('hidden');
    }, 600);
    
    const nextGlitch = Math.random() * 10000 + 8000;
    const timer = new ResumableTimeout(() => {
        state.timers = state.timers.filter(t => t !== timer);
        triggerGlitch();
    }, nextGlitch);
    state.timers.push(timer);
}

/* =========================================
   CORE NARRATIVO (SOLO UN CRAWL CONTINUO)
   ========================================= */
async function runCinematic() {
    try {
        // Escena 1: El Vacío
        state.currentScene = 1;
        switchScene('scene-start', 'scene-void');
        playEngineRumble();
        await wait(1500);
        document.getElementById('text-long-ago').classList.add('show');
        await wait(5000);
        document.getElementById('text-long-ago').classList.remove('show');
        await wait(2000);
        
        // Escena 2: El Título
        state.currentScene = 2;
        switchScene('scene-void', 'scene-title');
        playDramaticHit();
        document.querySelector('.epic-title').classList.add('zoom');
        await wait(8000); 
        
        // Escena 3: Crawl 1 (Todo el texto junto)
        state.currentScene = 3;
        switchScene('scene-title', 'scene-crawl');
        const crawl1 = document.getElementById('crawl-content');
        const crawlExitDistance = crawl1.scrollHeight + window.innerHeight * 2;
        crawl1.style.setProperty('--crawl-exit-position', `${-crawlExitDistance}px`);
        crawl1.classList.add('scroll-1');
        
        const timerGlitch = new ResumableTimeout(triggerGlitch, 5000);
        state.timers.push(timerGlitch);
        
        const crawlDuration = window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 130000
            : 170000;
        await wait(crawlDuration);
        await wait(4000);
        
        // Escena 4: Final
        state.currentScene = 4;
        switchScene('scene-crawl', 'scene-ending');
        await wait(2000);
        
        const titles = document.getElementById('ending-titles');
        titles.classList.remove('hidden');
        const lines = titles.querySelectorAll('p');
        for (let line of lines) {
            line.style.opacity = 1;
            playGlitchSound();
            await wait(1500);
        }
        
        await wait(2000);
        titles.classList.add('hidden');
        await wait(1000);
        
        playGlitchSound();
        document.getElementById('hologram-transmission').classList.remove('hidden');
        await wait(4000);
        
        playGlitchSound();
        document.getElementById('glitch-overlay').classList.add('glitch-active');
        document.getElementById('hologram-transmission').classList.add('hidden');
        await wait(200);
        document.getElementById('glitch-overlay').classList.remove('glitch-active');
        
        await wait(1500);
        const theEnd = document.getElementById('the-end');
        theEnd.classList.remove('hidden');
        theEnd.style.opacity = 1;

    } catch (e) {
        console.error("Error en cinemática:", e);
    }
}

/* =========================================
   CONTROLES, UI Y SALTO EN EL TIEMPO
   ========================================= */
document.getElementById('btn-start').addEventListener('click', () => {
    initAudio();
    document.getElementById('controls').classList.remove('hidden');
    resizeCanvas();
    createStars();
    drawStars();
    runCinematic();

    // Reproducir la música MP3 con retraso exacto de 6 segundos tras iniciar
    const musicTimer = new ResumableTimeout(() => {
        if (bgMusic) {
            bgMusic.play().catch(e => console.log("Audio bloqueado:", e));
        }
    }, 7700);
    state.timers.push(musicTimer);
});

document.getElementById('btn-pause').addEventListener('click', (e) => {
    state.isPaused = !state.isPaused;
    if (state.isPaused) {
        document.body.classList.add('is-paused');
        state.timers.forEach(t => t.pause());
        e.target.innerText = '▶️';
        if (bgMusic) bgMusic.pause();
    } else {
        document.body.classList.remove('is-paused');
        state.timers.forEach(t => t.resume());
        e.target.innerText = '⏸️';
        if (bgMusic && bgMusic.currentTime > 0) bgMusic.play();
    }
});

document.getElementById('btn-mute').addEventListener('click', (e) => {
    state.isMuted = !state.isMuted;
    e.target.innerText = state.isMuted ? '🔇' : '🔊';
    
    if (bgMusic) bgMusic.muted = state.isMuted;

    if (state.isMuted && state.audioContext) {
        state.audioContext.suspend();
    } else if (!state.isMuted && state.audioContext) {
        state.audioContext.resume();
    }
});

document.getElementById('btn-restart').addEventListener('click', () => {
    location.reload(); 
});

// Función para sincronizar la manipulación de CSS y JavaScript
function jumpTime(ms) {
    try {
        document.getAnimations().forEach(anim => {
            if (anim.playState === 'running' || anim.playState === 'paused') {
                anim.currentTime = Math.max(0, anim.currentTime + ms);
            }
        });
    } catch(e) {
        console.warn("Navegador bloqueó manipulación de animación", e);
    }
    
    // Adelantar música de fondo MP3 (si ya está reproduciendo)
    if (bgMusic && !bgMusic.paused) {
        bgMusic.currentTime = Math.max(0, bgMusic.currentTime + (ms / 1000));
    }
    
    state.timers.forEach(timer => timer.skip(ms));
}

document.getElementById('btn-rewind').addEventListener('click', () => {
    jumpTime(-10000); 
});

document.getElementById('btn-forward').addEventListener('click', () => {
    jumpTime(10000);
});