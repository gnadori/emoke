import { db, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from './firebase-config.js';
import { currentUserProfile } from './auth.js';

const forumPostsContainer = document.getElementById('forum-posts');
const newPostForm = document.getElementById('new-post-form');
const postContentInput = document.getElementById('post-content');
const postTagSelect = document.getElementById('post-tag');
const tagFilters = document.querySelectorAll('.tag-filter');

let allPosts = [];
let currentFilter = 'all';

// Fórum inicializálása, ha a profil betöltött
window.addEventListener('profileReady', () => {
    subscribeToPosts();
});

// Szűrő gombok kezelése
tagFilters.forEach(btn => {
    btn.addEventListener('click', () => {
        tagFilters.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.tag;
        renderPosts();
    });
});

// Új bejegyzés küldése
newPostForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!currentUserProfile) return;
    
    const text = postContentInput.value.trim();
    const tag = postTagSelect.value;
    
    if (!text) return;
    
    try {
        await addDoc(collection(db, "posts"), {
            text: text,
            tag: tag,
            uid: currentUserProfile.uid,
            nickname: currentUserProfile.nickname,
            timestamp: serverTimestamp() // Szerver oldali idő
        });
        
        postContentInput.value = ''; // Űrlap ürítése
    } catch (error) {
        console.error("Hiba a bejegyzés küldésekor:", error);
        alert("Nem sikerült elküldeni a bejegyzést.");
    }
});

// Feliratkozás a bejegyzésekre (valós időben)
function subscribeToPosts() {
    const q = query(
        collection(db, "posts"), 
        orderBy("timestamp", "desc")
    );
    
    onSnapshot(q, (snapshot) => {
        allPosts = [];
        snapshot.forEach((doc) => {
            allPosts.push({ id: doc.id, ...doc.data() });
        });
        renderPosts();
    });
}

// Bejegyzések kirajzolása
function renderPosts() {
    forumPostsContainer.innerHTML = '';
    
    // Szűrés alkalmazása
    const filteredPosts = currentFilter === 'all' 
        ? allPosts 
        : allPosts.filter(p => p.tag === currentFilter);
        
    if (filteredPosts.length === 0) {
        forumPostsContainer.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Még nincs bejegyzés ebben a kategóriában.</p>';
        return;
    }
    
    filteredPosts.forEach(post => {
        const postDiv = document.createElement('div');
        postDiv.classList.add('post');
        
        // Idő formázása
        let timeString = '';
        if (post.timestamp) {
            const date = post.timestamp.toDate();
            timeString = date.toLocaleDateString('hu-HU') + ' ' + date.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
        } else {
            timeString = 'Épp most...';
        }
        
        postDiv.innerHTML = `
            <div class="post-header">
                <span class="post-author">${post.nickname}</span>
                <span class="post-time">${timeString}</span>
            </div>
            <div class="post-body">
                ${escapeHTML(post.text)}
            </div>
            <span class="post-tag-badge tag-${post.tag}">${post.tag.charAt(0).toUpperCase() + post.tag.slice(1)}</span>
        `;
        
        forumPostsContainer.appendChild(postDiv);
    });
}

// Egyszerű XSS védelem
function escapeHTML(str) {
    const p = document.createElement('p');
    p.appendChild(document.createTextNode(str));
    return p.innerHTML;
}
