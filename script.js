import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// === 1. FIREBASE CONFIGURATION ===
const firebaseConfig = {
  apiKey: "AIzaSyDWYaqYonuwnMW8XQaEjToOAZWK73XFMkM",
  authDomain: "zeeeportfolio.firebaseapp.com",
  databaseURL: "https://zeeeportfolio-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "zeeeportfolio",
  storageBucket: "zeeeportfolio.firebasestorage.app",
  messagingSenderId: "412725535731",
  appId: "1:412725535731:web:45cbb37a27ae9bfc5be886",
  measurementId: "G-MPC3T64158"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// === 2. UI/UX LOGIC (SEAMLESS PORTFOLIO) ===
const themeToggle = document.getElementById('theme-toggle');
const htmlEl = document.documentElement;
const themeIcon = themeToggle?.querySelector('i');
const profilePic = document.getElementById('profile-pic'); // Ambil elemen gambar

// Toggle Theme Light/Dark
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        if (htmlEl.getAttribute('data-theme') === 'dark') {
            htmlEl.setAttribute('data-theme', 'light');
            themeIcon.classList.replace('fa-moon', 'fa-sun');
            
            // Ubah gambar ke versi Light Mode
            if (profilePic) profilePic.src = "./img/pfp/light.jpg"; 
        } else {
            htmlEl.setAttribute('data-theme', 'dark');
            themeIcon.classList.replace('fa-sun', 'fa-moon');
            
            // Ubah gambar ke versi Dark Mode
            if (profilePic) profilePic.src = "./img/pfp/dark.jpg";
        }
    });
}


// Sidebar Logic
const menuBtn = document.getElementById('menu-btn');
const closeBtn = document.getElementById('close-sidebar');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');

if (menuBtn) {
    menuBtn.addEventListener('click', () => { sidebar.classList.add('active'); overlay.classList.add('active'); });
    closeBtn.addEventListener('click', () => { sidebar.classList.remove('active'); overlay.classList.remove('active'); });
    overlay.addEventListener('click', () => { sidebar.classList.remove('active'); overlay.classList.remove('active'); });
}

// Scroll to Top Logic
const scrollTopBtn = document.getElementById('scroll-top');
if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) scrollTopBtn.style.display = 'flex';
        else scrollTopBtn.style.display = 'none';
    });
    scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// === 3. FIRESTORE DATA FETCHING LOGIC ===
let allSkillsArray = []; 

// Fungsi untuk me-render Peringkat Skill Pills
function renderSkillsRanking() {
    const skillCounts = {};
    allSkillsArray.forEach(skill => { skillCounts[skill] = (skillCounts[skill] || 0) + 1; });
    
    // Urutkan berdasarkan kemunculan terbanyak
    const sortedSkills = Object.keys(skillCounts).sort((a, b) => skillCounts[b] - skillCounts[a]);
    const skillsContainer = document.getElementById('skills-container');
    
    if (skillsContainer) {
        skillsContainer.innerHTML = ''; // Bersihkan kontainer
        sortedSkills.forEach(skill => {
            skillsContainer.innerHTML += `<span class="pill">${skill} (${skillCounts[skill]})</span>`;
        });
    }
}

// Fungsi utama untuk menarik data portfolio
async function loadPortfolioData() {
    const eduContainer = document.getElementById('edu-container');
    const expContainer = document.getElementById('exp-container');
    const projContainer = document.getElementById('proj-container');
    const skillsContainer = document.getElementById('skills-container');

    // Jika kita tidak berada di halaman index.html, hentikan fungsi ini
    if (!eduContainer) return;

    // --- 1. TAMPILKAN STATUS LOADING ---
    const loadingText = '<p style="text-align: center; opacity: 0.6; font-style: italic;">Loading data...</p>';
    eduContainer.innerHTML = loadingText;
    expContainer.innerHTML = loadingText;
    projContainer.innerHTML = loadingText;
    if (skillsContainer) skillsContainer.innerHTML = loadingText;

        try {
                // A. Fetch & Sort Data Education (Menjadi Timeline)
        const eduSnapshot = await getDocs(collection(db, "education"));
        let eduDataArr = [];
        eduSnapshot.forEach(doc => eduDataArr.push(doc.data()));
        eduDataArr.sort((a, b) => (a.order || 0) - (b.order || 0)); 
        
        eduContainer.innerHTML = '';
        eduContainer.className = 'data-container timeline-container'; // Terapkan class timeline
        
        eduDataArr.forEach(data => {
            if (data.skills) allSkillsArray.push(...data.skills);
            
            let formattedDesc = (data.desc || '').replace(/\n/g, '<br>');
            let achievementsHTML = (data.achievements || []).map(ach => `<li><i class="fa-solid fa-trophy"></i> <span>${ach}</span></li>`).join('');
            let skillsHTML = (data.skills || []).map(s => `<span class="pill">${s}</span>`).join('');
            
            // Render menggunakan div class="timeline-item"
            eduContainer.innerHTML += `
                <div class="timeline-item">
                    <div class="card-header" style="margin-bottom: 15px;">
                        <img src="${data.logoUrl || 'default-logo.png'}" class="card-logo" alt="${data.school} Logo" style="border: 2px solid var(--accent-color);">
                        <div>
                            <h3 class="card-title font-avalance" style="font-size: 1.8rem;">${data.school}</h3>
                            <p class="card-subtitle" style="font-weight: 600;">${data.duration}</p>
                        </div>
                    </div>
                    <p class="card-desc" style="line-height: 1.8;">${formattedDesc}</p>
                    <ul class="achievements-list">${achievementsHTML}</ul>
                    <div class="pill-container">${skillsHTML}</div>
                </div>
            `;
        });
        if (eduDataArr.length === 0) {
            eduContainer.innerHTML = '<p style="opacity: 0.5;">Belum ada data education.</p>';
            eduContainer.classList.remove('timeline-container');
        }

        // B. Fetch & Sort Data Experience (Kembali Menjadi Timeline)
        const expSnapshot = await getDocs(collection(db, "experience"));
        let expDataArr = [];
        expSnapshot.forEach(doc => expDataArr.push(doc.data()));
        expDataArr.sort((a, b) => (a.order || 0) - (b.order || 0)); 

        expContainer.innerHTML = '';
        expContainer.className = 'data-container'; // Terapkan class timeline
        
        expDataArr.forEach((data) => {
            if (data.skills) allSkillsArray.push(...data.skills);
            let skillsHTML = (data.skills || []).map(s => `<span class="pill">${s}</span>`).join('');
            
            expContainer.innerHTML += `
                <div class="card">
                    <h3 class="card-title font-avalance" style="font-size: 1.8rem;">${data.title}</h3>
                    <p class="card-subtitle" style="font-size: 1rem; opacity: 0.9; margin-bottom: 15px;">
                        ${data.position} | <span style="color: var(--accent-color); font-weight: 600;">${data.duration}</span>
                    </p>
                    <p class="card-desc" style="line-height: 1.8;">${(data.desc || '').replace(/\n/g, '<br>')}</p>
                    <div class="pill-container">${skillsHTML}</div>
                    <a href="${data.blogLink || '#'}" class="btn" style="border-color: var(--accent-color); color: var(--text-color);">Read More</a>
                </div>
            `;
        });
        if (expDataArr.length === 0) {
            expContainer.innerHTML = '<p style="opacity: 0.5;">Belum ada data experience.</p>';
            expContainer.classList.remove('timeline-container'); // Hapus garis jika kosong
        }

        // C. Fetch & Sort Data Projects (Diubah Menjadi Timeline)
        const projSnapshot = await getDocs(collection(db, "projects"));
        let projDataArr = [];
        projSnapshot.forEach(doc => projDataArr.push(doc.data()));
        projDataArr.sort((a, b) => (a.order || 0) - (b.order || 0)); 

        projContainer.innerHTML = ''; 
        projContainer.className = 'data-container'; // Terapkan class timeline

        projDataArr.forEach((data) => {
            if (data.skills) allSkillsArray.push(...data.skills);
            let skillsHTML = (data.skills || []).map(s => `<span class="pill">${s}</span>`).join('');
            
            projContainer.innerHTML += `
                <div class="card">
                    <h3 class="card-title font-avalance" style="font-size: 1.8rem;">${data.projectName}</h3>
                    <p class="card-desc" style="line-height: 1.8;">${(data.desc || '').replace(/\n/g, '<br>')}</p>
                    <div class="pill-container">${skillsHTML}</div>
                    <a href="${data.blogLink || '#'}" class="btn" style="border-color: var(--accent-color); color: var(--text-color);">Read More</a>
                </div>
            `;
        });
        if (projDataArr.length === 0) {
            projContainer.innerHTML = '<p style="opacity: 0.5;">Belum ada data projects.</p>';
            projContainer.classList.remove('timeline-container'); // Hapus garis jika kosong
        }

        renderSkillsRanking();

    } catch (error) {
        console.error("Gagal menarik data dari Firestore: ", error);
        const errorText = '<p style="color: red; text-align: center;">Gagal memuat data. Periksa koneksi internetmu.</p>';
        eduContainer.innerHTML = errorText;
        expContainer.innerHTML = errorText;
        projContainer.innerHTML = errorText;
    }
}


// Jalankan fetch data saat script dimuat
loadPortfolioData();


// === 4. ADMIN AUTHENTICATION LOGIC (ADMIN.HTML) ===
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn'); // Opsional jika kamu membuat tombol logout
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');

// Blok ini hanya berjalan jika script mendeteksi ia berada di admin.html
if (loginSection && dashboardSection) {
    
    // Observer: Memantau apakah User sedang Login atau Logout
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Jika terautentikasi, sembunyikan login, tampilkan dashboard
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
        } else {
            // Jika tidak, paksa ke halaman login
            loginSection.style.display = 'block';
            dashboardSection.style.display = 'none';
        }
    });

    // Event Listener Login
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = emailInput.value;
            const password = passwordInput.value;
            
            if(!email || !password) {
                alert("Email dan Password tidak boleh kosong!");
                return;
            }

            try {
                await signInWithEmailAndPassword(auth, email, password);
                alert("Login berhasil! Selamat datang Admin.");
            } catch (error) {
                alert("Login gagal: " + error.message);
            }
        });
    }

    // Event Listener Logout (Opsional)
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await signOut(auth);
            alert("Berhasil Logout.");
        });
    }
}
