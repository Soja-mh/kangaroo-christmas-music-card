// --- 配置：目标歌曲列表  ---
const TARGET_SONGS = [
    { title: "Puccini - Musettas Waltz", filename: "puccini-la-boheme-musettas-waltz.mp3" },
    { title: "Franz Liszt - Un Sospiro", filename: "franz-liszt-un-sospiro.mp3" },
    { title: "Franz Liszt - Liebestraum", filename: "franz-liszt-liebestraum-love-dream.mp3" },
    { title: "Dark is the Night", filename: "dark-is-the-night-soviet-ww2-song.mp3" },
];

// --- 配置：背景音乐 ---
const BGM_CONFIG = {
    day: "bgm_day.mp3", 
    night: "bgm_night.mp3" 
};

// --- 配置：NPC 状态 ---
// 一个场景固定只有一个 Finn 和一个 Jake，但每次刷新的造型不同，对应不同歌曲
const NPC_CONFIG = [
    { 
        name: 'finn', 
        states: [
            { image: '/images/finn-sword.png', songIndex: 0 }, // Puccini
            { image: '/images/finn-piano.png', songIndex: 1 }  // Liszt - Un Sospiro
        ]
    },
    { 
        name: 'jake', 
        states: [
            { image: '/images/jake-violin.png', songIndex: 2 },    // Liszt - Liebestraum
            { image: '/images/jake-sandwich.png', songIndex: 3 }   // Dark is the Night
        ]
    }
];

// --- 全局音频状态 ---
let backgroundAudio = null;
let targetAudio = null;
let currentSongIndex = 0;
let isTargetAudioPlaying = false; 
let currentMode = 'day'; 

// --- DOM 元素引用 ---
const currentSongInfo = document.getElementById('current-song-info');
const playPauseButton = document.getElementById('play-pause-button');
const nextSongButton = document.getElementById('next-song-button');
const mainApp = document.getElementById('main-app');


// --- 背景音乐控制 ---

/**
 * 启动或恢复背景音乐。
 */
function startBackgroundMusic(mode = currentMode) {
    // 如果目标歌曲正在播放，则不启动 BGM
    if (isTargetAudioPlaying) {
        return;
    }
    
    // 检查是否需要切换 BGM 文件
    const bgmFile = BGM_CONFIG[mode];
    const isBgmSwitched = !backgroundAudio || backgroundAudio.src.indexOf(bgmFile) === -1;

    if (isBgmSwitched) {
        if (backgroundAudio) {
            backgroundAudio.pause();
        }
        backgroundAudio = new Audio(`/audio/${bgmFile}`);
        backgroundAudio.loop = true; 
    }
    
    backgroundAudio.volume = 1.0; 
    backgroundAudio.play().catch(e => console.log("BGM 恢复失败，等待用户交互...", e));
}

/**
 * 暂停背景音乐。
 */
function pauseBackgroundMusic() {
    if (backgroundAudio) {
        backgroundAudio.pause();
    }
}


// --- 目标歌曲播放控制 ---

/**
 * 切换目标歌曲的播放/暂停状态
 */
function toggleTargetAudio() {
    if (!targetAudio) {
        // 如果未初始化，则从当前索引开始播放
        playTargetSong(currentSongIndex);
        return;
    }

    if (isTargetAudioPlaying) {
        // 暂停目标歌曲
        targetAudio.pause();
        isTargetAudioPlaying = false;
        playPauseButton.textContent = '▶';
        currentSongInfo.textContent = `Paused: ${TARGET_SONGS[currentSongIndex].title}`;
        
        // 目标歌曲暂停时，恢复 BGM
        startBackgroundMusic(); 
    } else {
        // 播放目标歌曲
        
        // 暂停 BGM
        pauseBackgroundMusic(); 

        targetAudio.play().catch(e => console.error("目标歌曲播放失败:", e));
        isTargetAudioPlaying = true;
        playPauseButton.textContent = '⏸';
        currentSongInfo.textContent = `Playing: ${TARGET_SONGS[currentSongIndex].title}`;
    }
}

/**
 * 播放指定索引的歌曲
 * @param {number} index - 歌曲索引
 */
function playTargetSong(index) {
    // 暂停 BGM
    pauseBackgroundMusic(); 

    // 确保索引在范围内
    currentSongIndex = index % TARGET_SONGS.length; 
    const song = TARGET_SONGS[currentSongIndex];

    // 停止当前目标歌曲（如果有）
    if (targetAudio) {
        targetAudio.pause();
        targetAudio = null;
    }
    
    // 创建新的音频元素
    const audioPath = `/audio/${song.filename}`;
    targetAudio = new Audio(audioPath);
    targetAudio.loop = false; // 不循环
    targetAudio.volume = 1.0; // 设置音量为最大

    // 更新UI显示加载状态
    currentSongInfo.textContent = `Loading: ${song.title}`;
    playPauseButton.textContent = '⏸';

    // 添加加载和错误处理
    targetAudio.addEventListener('loadeddata', () => {
        console.log("音频加载成功:", audioPath);
    });

    targetAudio.addEventListener('error', (e) => {
        console.error("目标歌曲加载失败:", e);
        console.error("尝试加载的文件:", audioPath);
        console.error("音频元素状态:", targetAudio.readyState);
        isTargetAudioPlaying = false;
        currentSongInfo.textContent = `Load Failed: ${song.title}`;
        playPauseButton.textContent = '▶';
    });

    // 定义播放函数
    const tryPlay = () => {
        targetAudio.play().then(() => {
            console.log("音频播放成功:", audioPath);
            isTargetAudioPlaying = true;
            playPauseButton.textContent = '⏸';
            currentSongInfo.textContent = `Playing: ${song.title}`;
        }).catch(e => {
            console.error("目标歌曲播放失败:", e);
            console.error("尝试播放的文件:", audioPath);
            isTargetAudioPlaying = false;
            currentSongInfo.textContent = `Play Failed: ${song.title}`;
            playPauseButton.textContent = '▶';
        });
    };

    // 等待音频可以播放后再播放
    targetAudio.addEventListener('canplaythrough', tryPlay, { once: true });

    // 如果已经可以播放，直接播放
    if (targetAudio.readyState >= 2) {
        tryPlay();
    }

    // 目标歌曲播放结束后
    targetAudio.onended = () => {
        isTargetAudioPlaying = false;
        
        // 恢复 BGM
        startBackgroundMusic();

        // 自动切换到下一首
        playTargetSong(currentSongIndex + 1); 
    };
}


// --- 模式切换函数 ---
function toggleMode() {
    const toggleButton = document.getElementById('mode-toggle');
    const isDay = mainApp.classList.contains('day');
    currentMode = isDay ? 'night' : 'day';

    if (isDay) {
        mainApp.classList.remove('day');
        mainApp.classList.add('night');
        toggleButton.textContent = '🌙';
    } else {
        mainApp.classList.remove('night');
        mainApp.classList.add('day');
        toggleButton.textContent = '☀';
    }
    
    // 切换背景音乐
    startBackgroundMusic(currentMode);
    // 刷新 NPC 位置
    placeNpcs(); 
}


// --- NPC 随机定位和动作选择函数 ---
function placeNpcs() {
    const container = document.getElementById('npc-container');
    container.innerHTML = ''; 

    // 定义 NPC 刷新的区域 (靠近场景中部，避免过低)
    const minX = 5; const maxX = 90; 
    const minY = 35; const maxY = 70; 

    NPC_CONFIG.forEach(npc => {
        // 随机选择一个造型状态
        const randomIndex = Math.floor(Math.random() * npc.states.length);
        const selectedState = npc.states[randomIndex]; 

        // 随机位置计算
        const randomX = Math.random() * (maxX - minX) + minX;
        const randomY = Math.random() * (maxY - minY) + minY;

        // 创建 NPC 元素
        const npcEl = document.createElement('img');
        npcEl.className = 'npc'; 
        npcEl.src = selectedState.image; 
        npcEl.alt = `${npc.name}-${randomIndex + 1}`;
        npcEl.dataset.songIndex = selectedState.songIndex; // 存储对应的歌曲索引
        npcEl.style.left = `${randomX}vw`;
        npcEl.style.top = `${randomY}vh`;
        
        container.appendChild(npcEl);
    });
}


// --- 初始化函数 ---
function initApp() {
    const splashScreen = document.getElementById('splash-screen');
    const kangaroo = document.getElementById('kangaroo');
    const skipButton = document.getElementById('skip-button');
    const modeToggleButton = document.getElementById('mode-toggle');

    // 1. 开屏动画处理
    kangaroo.classList.add('animate-kangaroo');
    
    const endSplash = () => {
        splashScreen.style.opacity = '0';
        setTimeout(() => splashScreen.style.display = 'none', 500);
        
        // 动画结束后首次启动背景音乐和 NPC
        startBackgroundMusic('day');
        placeNpcs(); 
        
        // 显示目标歌曲控制 UI
        playPauseButton.classList.remove('hidden');
        nextSongButton.classList.remove('hidden');
    };

    kangaroo.addEventListener('animationend', endSplash, { once: true });
    skipButton.addEventListener('click', endSplash, { once: true });


    // 2. 事件监听
    modeToggleButton.addEventListener('click', toggleMode);
    
    // NPC 容器点击事件代理：点击NPC切换对应的歌曲
    document.getElementById('npc-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('npc')) {
            const songIndex = parseInt(e.target.dataset.songIndex);
            if (!isNaN(songIndex)) {
                // 如果点击的是当前正在播放的歌曲，则暂停/播放
                if (currentSongIndex === songIndex && targetAudio) {
                    toggleTargetAudio();
                } else {
                    // 否则切换到对应的歌曲
                    playTargetSong(songIndex);
                }
            }
        }
    });

    // UI 按钮事件
    playPauseButton.addEventListener('click', toggleTargetAudio);
    nextSongButton.addEventListener('click', () => {
        playTargetSong(currentSongIndex + 1);
    });
    
    // 首次用户交互后尝试播放背景音乐（解决浏览器对自动播放的限制）
    document.addEventListener('click', () => {
        if (backgroundAudio && backgroundAudio.paused) {
             startBackgroundMusic();
        }
    }, { once: true });
}

// 启动应用
document.addEventListener('DOMContentLoaded', initApp);