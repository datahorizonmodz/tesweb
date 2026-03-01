const audioElem = new Audio();
const dynamicIsland = document.getElementById('dynamic-island');
const diPlayPause = document.getElementById('di-play-pause');
const diIconPlay = document.getElementById('di-icon-play');
const diIconPause = document.getElementById('di-icon-pause');
const diVisualizer = document.getElementById('di-visualizer');

let playlist = [];
let currentTrackIndex = 0;
let playAllMode = false;

export function initMusicSystem() {
    diPlayPause.addEventListener('click', toggleMusicPlayPause);

    audioElem.addEventListener('ended', () => {
        if (playAllMode) {
            playTrackByIndex(currentTrackIndex + 1);
        } else {
            dynamicIsland.classList.remove('active');
            diVisualizer.classList.add('paused');
        }
    });
}

export function executeMusicCommand(command) {
    const cmd = command.trim().toLowerCase();
    
    if (cmd === '/stopmusic') {
        playAllMode = false;
        audioElem.pause();
        audioElem.currentTime = 0;
        audioElem.src = '';
        dynamicIsland.classList.remove('active');
        diVisualizer.classList.add('paused');
        return true;
    }
    
    if (cmd === '/playallmusic') {
        playAllMode = true;
        generatePlaylist(20);
        playTrackByIndex(0);
        return true;
    }
    
    const musicMatch = cmd.match(/^\/music(\d+)$/);
    if (musicMatch) {
        const trackNumber = musicMatch[1];
        const fileName = `music${trackNumber}.mp3`;
        audioElem.src = fileName;
        
        const diTitle = document.querySelector('.di-title');
        if (diTitle) diTitle.textContent = fileName;
        
        audioElem.play().then(() => {
            dynamicIsland.classList.add('active');
            diIconPlay.style.display = 'none';
            diIconPause.style.display = 'block';
            diVisualizer.classList.remove('paused');
        }).catch(err => {
            console.log('Audio error:', err);
            alert(`File ${fileName} tidak ditemukan`);
        });
        return true;
    }
    return false;
}

// Local Helper Functions
function toggleMusicPlayPause() {
    if (!audioElem.src) return;
    if (audioElem.paused) {
        audioElem.play();
        diIconPlay.style.display = 'none';
        diIconPause.style.display = 'block';
        diVisualizer.classList.remove('paused');
    } else {
        audioElem.pause();
        diIconPlay.style.display = 'block';
        diIconPause.style.display = 'none';
        diVisualizer.classList.add('paused');
    }
}

function generatePlaylist(max = 20) {
    playlist = [];
    for (let i = 1; i <= max; i++) playlist.push(`music${i}.mp3`);
}

function playTrackByIndex(index) {
    if (playlist.length === 0) return;
    currentTrackIndex = index % playlist.length;
    const fileName = playlist[currentTrackIndex];
    audioElem.src = fileName;
    
    const diTitle = document.querySelector('.di-title');
    if (diTitle) diTitle.textContent = fileName;
    
    audioElem.play().then(() => {
        dynamicIsland.classList.add('active');
        diIconPlay.style.display = 'none';
        diIconPause.style.display = 'block';
        diVisualizer.classList.remove('paused');
    }).catch(err => console.log('Audio error:', err));
}
