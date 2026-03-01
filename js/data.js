import { auth, db } from "./firebase.js";
import { signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { collection, getDocs, onSnapshot, query, limit } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { renderApps, renderProducts, renderSocials } from "./render.js";

let dataLoaded = false;

// Gunakan limit untuk performa awal jika data sangat banyak
export const loadData = async () => {
    if (dataLoaded) return;
    dataLoaded = true;

    try {
        // Ambil data Apps (Cukup sekali saja untuk menghemat bandwidth & beban)
        const appsSnapshot = await getDocs(query(collection(db, 'apps'), limit(50)));
        renderApps(appsSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));

        // Ambil data Products
        const productsSnapshot = await getDocs(query(collection(db, 'products'), limit(50)));
        renderProducts(productsSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));

        // Socials biasanya sedikit, boleh pakai onSnapshot jika ingin real-time
        onSnapshot(collection(db, 'profiles'), snapshot => {
            renderSocials(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
        }, err => console.error("Error loading Socials:", err));

    } catch (err) {
        console.error("Data Load Error:", err);
    }
};

export const initAuth = async () => {
    try {
        await signInAnonymously(auth);
        // loadData akan dipanggil oleh onAuthStateChanged
    } catch (err) {
        console.warn("Auth Warning:", err.message);
        loadData(); // Tetap coba load jika anonim gagal (bergantung rule firestore)
    }
};

onAuthStateChanged(auth, user => {
    if (user) loadData();
});