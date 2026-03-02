import { auth, db } from "./firebase.js";
import { signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { handleDocChanges } from "./render.js";
import { hideGlobalLoader } from "./ui.js";

let dataLoaded = false;

// Cek apakah load awal sudah selesai
let appsLoaded = false;
let productsLoaded = false;
let profilesLoaded = false;

function checkInitialLoadComplete() {
    if (appsLoaded && productsLoaded && profilesLoaded) {
        // Berikan waktu sejenak agar DOM diffing di render.js selesai sebelum nutup loader
        setTimeout(() => hideGlobalLoader(), 200);
    }
}

export const loadData = () => {
    if (dataLoaded) return;
    dataLoaded = true;

    // OPTIMASI: Memanfaatkan difing docChanges untuk performa real-time, menghindari perombakan full DOM
    onSnapshot(collection(db, 'apps'), snapshot => {
        handleDocChanges('apps', snapshot.docChanges());
        if (!appsLoaded) { appsLoaded = true; checkInitialLoadComplete(); }
    }, err => console.error("Error loading Apps:", err));

    onSnapshot(collection(db, 'products'), snapshot => {
        handleDocChanges('products', snapshot.docChanges());
        if (!productsLoaded) { productsLoaded = true; checkInitialLoadComplete(); }
    }, err => console.error("Error loading Products:", err));

    onSnapshot(collection(db, 'profiles'), snapshot => {
        handleDocChanges('profiles', snapshot.docChanges());
        if (!profilesLoaded) { profilesLoaded = true; checkInitialLoadComplete(); }
    }, err => console.error("Error loading Socials:", err));
};

export const initAuth = async () => {
    try {
        await signInAnonymously(auth);
        loadData();
    } catch (err) {
        console.warn("Auth Warning:", err.message);
        loadData();
    }
};

// Initial listener
onAuthStateChanged(auth, user => {
    if (user) loadData();
});
