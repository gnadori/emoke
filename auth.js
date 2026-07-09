import { auth, db, googleProvider, signInWithPopup, onAuthStateChanged, signOut, doc, getDoc, setDoc } from './firebase-config.js';

// DOM elemek
const loginScreen = document.getElementById('login-screen');
const profileSetupScreen = document.getElementById('profile-setup-screen');
const appScreen = document.getElementById('app-screen');

const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const btnSaveProfile = document.getElementById('btn-save-profile');

const colorOptions = document.querySelectorAll('.color-option');
const nicknameInput = document.getElementById('nickname');
const currentUserNameSpan = document.getElementById('current-user-name');

// Globális változó az aktuális felhasználó adatainak (mások is elérhetik majd)
export let currentUserProfile = null;
let selectedColor = '#EF4444'; // Alapértelmezett szín

// Képernyőváltás logika
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// Színválasztó logika
colorOptions.forEach(option => {
    option.addEventListener('click', () => {
        colorOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        selectedColor = option.dataset.color;
    });
});
// Alapértelmezett kiválasztása
if(colorOptions.length > 0) colorOptions[0].classList.add('selected');


// Google Bejelentkezés
btnLogin.addEventListener('click', async () => {
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (error) {
        console.error("Bejelentkezési hiba:", error);
        alert("Hiba történt a bejelentkezés során.");
    }
});

// Kijelentkezés
btnLogout.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Kijelentkezési hiba:", error);
    }
});

// Profil Mentése
btnSaveProfile.addEventListener('click', async () => {
    const nickname = nicknameInput.value.trim();
    if (!nickname) {
        alert("Kérlek, adj meg egy becenevet!");
        return;
    }

    const user = auth.currentUser;
    if (user) {
        try {
            const profileData = {
                nickname: nickname,
                color: selectedColor,
                email: user.email,
                uid: user.uid
            };
            await setDoc(doc(db, "users", user.uid), profileData);
            currentUserProfile = profileData;
            
            // UI frissítés
            currentUserNameSpan.textContent = nickname;
            showScreen('app-screen');
            
            // Értesítjük a többi modult, hogy kész a profil
            window.dispatchEvent(new Event('profileReady'));
        } catch (error) {
            console.error("Profil mentési hiba:", error);
            alert("Hiba történt a profil mentésekor.");
        }
    }
});

// Auth Állapot Figyelése
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Ellenőrizzük, hogy van-e már profilja az adatbázisban
        try {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                // Már van profilja, irány a fő alkalmazás
                currentUserProfile = docSnap.data();
                currentUserNameSpan.textContent = currentUserProfile.nickname;
                showScreen('app-screen');
                window.dispatchEvent(new Event('profileReady'));
            } else {
                // Nincs profilja, mutassuk a profil beállítás képernyőt
                showScreen('profile-setup-screen');
            }
        } catch (error) {
            console.error("Hiba a profil lekérdezésekor:", error);
        }
    } else {
        // Nincs bejelentkezve
        currentUserProfile = null;
        showScreen('login-screen');
    }
});
