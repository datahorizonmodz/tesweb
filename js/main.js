import { initAuth } from "./data.js";
import { initUI } from "./ui.js";
import { initMusicSystem } from "./music.js";

// Bootstrap the application
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize UI (themes, interactions, listeners)
    initUI();
    
    // 2. Initialize Music System
    initMusicSystem();
    
    // 3. Authenticate and start fetching Firebase data
    initAuth();
});
