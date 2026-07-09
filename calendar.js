import { db, collection, query, onSnapshot, addDoc, deleteDoc, where, getDocs, doc } from './firebase-config.js';
import { currentUserProfile } from './auth.js';

const calendarGrid = document.getElementById('calendar-grid');
const currentMonthYearHeader = document.getElementById('current-month-year');
const btnPrevMonth = document.getElementById('prev-month');
const btnNextMonth = document.getElementById('next-month');

let currentDate = new Date(); // Aktuálisan megjelenített hónap/év
let allVisits = []; // Az adott hónaphoz tartozó látogatások
let unsubscribeVisits = null;

// Hónap nevek magyarul
const monthNames = ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"];

// Naptár inicializálása, ha a profil betöltött
window.addEventListener('profileReady', () => {
    renderCalendar();
    subscribeToVisits();
});

btnPrevMonth.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
    subscribeToVisits();
});

btnNextMonth.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    subscribeToVisits();
});

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function renderCalendar() {
    calendarGrid.innerHTML = '';
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    currentMonthYearHeader.textContent = `${monthNames[month]} ${year}`;
    
    // Melyik nappal kezdődik a hónap (0=vasárnap, de mi Hétfővel kezdünk)
    let firstDay = new Date(year, month, 1).getDay();
    // JS-ben 0=Vasárnap, alakítsuk át Hétfő=0 formátumra
    firstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    const daysInMonth = getDaysInMonth(year, month);
    
    // Üres helyek a hónap kezdete előtt
    for (let i = 0; i < firstDay; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('calendar-day', 'empty');
        calendarGrid.appendChild(emptyDiv);
    }
    
    // Napok kirajzolása
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('calendar-day');
        
        // Helyes dátum formátum (YYYY-MM-DD)
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dayDiv.dataset.date = dateString;
        
        const dayNumber = document.createElement('span');
        dayNumber.classList.add('day-number');
        dayNumber.textContent = day;
        dayDiv.appendChild(dayNumber);
        
        const markersContainer = document.createElement('div');
        markersContainer.classList.add('day-markers');
        markersContainer.id = `markers-${dateString}`;
        dayDiv.appendChild(markersContainer);
        
        // Kattintás esemény
        dayDiv.addEventListener('click', () => handleDayClick(dateString));
        
        calendarGrid.appendChild(dayDiv);
    }
    
    // Frissítsük a markereket, ha már van adatunk
    updateMarkers();
}

// Feliratkozás az adott hónap eseményeire
function subscribeToVisits() {
    if (!currentUserProfile) return;
    if (unsubscribeVisits) unsubscribeVisits();
    
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const prefix = `${year}-${month}`; // Keresés: YYYY-MM prefix alapján
    
    // Kérdezzük le az egész hónapot
    // (Mivel a Firestore nem tud prefix keresést, lekérdezzük a hónap első és utolsó napja közötti időszakot)
    const startDate = `${year}-${month}-01`;
    const endDate = `${year}-${month}-${getDaysInMonth(year, currentDate.getMonth())}`;
    
    const q = query(
        collection(db, "visits"),
        where("date", ">=", startDate),
        where("date", "<=", endDate)
    );
    
    unsubscribeVisits = onSnapshot(q, (snapshot) => {
        allVisits = [];
        snapshot.forEach((doc) => {
            allVisits.push({ id: doc.id, ...doc.data() });
        });
        updateMarkers();
    });
}

// Színes pöttyök frissítése a napokon
function updateMarkers() {
    // Töröljük a régi markereket a naptárból (amik látszanak)
    const allMarkerContainers = document.querySelectorAll('.day-markers');
    allMarkerContainers.forEach(container => container.innerHTML = '');
    
    allVisits.forEach(visit => {
        const container = document.getElementById(`markers-${visit.date}`);
        if (container) {
            const marker = document.createElement('div');
            marker.classList.add('day-marker');
            marker.style.backgroundColor = visit.color;
            marker.title = visit.nickname;
            container.appendChild(marker);
        }
    });
}

// Kattintás egy napra
async function handleDayClick(dateString) {
    if (!currentUserProfile) return;
    
    // Megnézzük, hogy a bejelentkezett felhasználó ezen a napon már be van-e jelölve
    const existingVisit = allVisits.find(v => v.date === dateString && v.uid === currentUserProfile.uid);
    
    try {
        if (existingVisit) {
            // Törlés
            await deleteDoc(doc(db, "visits", existingVisit.id));
        } else {
            // Hozzáadás
            await addDoc(collection(db, "visits"), {
                date: dateString,
                uid: currentUserProfile.uid,
                nickname: currentUserProfile.nickname,
                color: currentUserProfile.color,
                timestamp: new Date()
            });
        }
    } catch (error) {
        console.error("Hiba a látogatás módosításakor:", error);
    }
}
