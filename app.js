// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAUKygXtzuE5Poj3rEdkhCRc1Wq_TCQpZA",
    authDomain: "collection-musicale-robin.firebaseapp.com",
    projectId: "collection-musicale-robin",
    storageBucket: "collection-musicale-robin.firebasestorage.app",
    messagingSenderId: "675404245370",
    appId: "1:675404245370:web:43b25c8987a311f1008ec3"
};

const ADMIN_UID = "4G0PWMNQuOhu1uWYmbVsQPYYDzd2";

// Initialisation Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// État global
let currentUser = null;
let currentAlbumKey = null;
let collectionData = [];

// ============================================
// AUTHENTIFICATION
// ============================================

function initAuth() {
    const authBtn = document.getElementById('authBtn');
    if (!authBtn) return;
    
    auth.onAuthStateChanged(user => {
        currentUser = user;
        if (user) {
            authBtn.textContent = '🔓 Déconnexion';
            authBtn.classList.add('logged-in');
            authBtn.onclick = () => auth.signOut();
            console.log('✅ Connecté:', user.uid);
        } else {
            authBtn.textContent = '🔑 Connexion';
            authBtn.classList.remove('logged-in');
            authBtn.onclick = () => {
                const email = prompt('Email:');
                if (email) {
                    const password = prompt('Mot de passe:');
                    if (password) {
                        auth.signInWithEmailAndPassword(email, password)
                            .catch(err => alert('Erreur: ' + err.message));
                    }
                }
            };
            console.log('👤 Déconnecté');
        }
    });
}

function isAdmin() {
    return currentUser && currentUser.uid === ADMIN_UID;
}

// ============================================
// CHARGEMENT DES DONNÉES
// ============================================

async function chargerCollection() {
    try {
        const response = await fetch('data/collection.json');
        collectionData = await response.json();
        return collectionData;
    } catch (error) {
        console.error('Erreur chargement collection:', error);
        return [];
    }
}

// ============================================
// PAGE ARTISTES
// ============================================

async function chargerArtistes() {
    const data = await chargerCollection();
    const grid = document.getElementById('artistesGrid');
    if (!grid) return;
    
    const artistes = {};
    data.forEach(album => {
        if (!artistes[album.artiste]) {
            artistes[album.artiste] = [];
        }
        artistes[album.artiste].push(album);
    });
    
    const artisteNames = Object.keys(artistes).sort();
    
    grid.innerHTML = artisteNames.map(nom => {
        const albums = artistes[nom];
        const cover = albums.find(a => a.image)?.image || '';
        return `
            <a href="discographie.html?artiste=${encodeURIComponent(nom)}" class="artiste-card">
                <img src="${cover}" alt="${nom}" class="artiste-cover" 
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22%3E%3Crect width=%22120%22 height=%22120%22 fill=%22%23ddd%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2240%22%3E🎵%3C/text%3E%3C/svg%3E'">
                <div class="artiste-name">${nom}</div>
                <div class="album-count">${albums.length} album${albums.length > 1 ? 's' : ''}</div>
            </a>
        `;
    }).join('');
}

// ============================================
// PAGE DISCOGRAPHIE
// ============================================

async function chargerDiscographie(artisteNom) {
    const data = await chargerCollection();
    const container = document.getElementById('discographieList');
    const titre = document.getElementById('artisteName');
    if (!container) return;
    
    titre.textContent = artisteNom;
    
    const albums = data.filter(a => a.artiste === artisteNom)
                       .sort((a, b) => (a.annee || '').localeCompare(b.annee || ''));
    
    container.innerHTML = albums.map(album => {
        const key = album.artiste + ' - ' + album.album;
        return `
            <div class="discographie-item" onclick="window.location.href='album.html?key=${encodeURIComponent(key)}'">
                <img src="${album.image || ''}" alt="${album.album}" 
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22%3E%3Crect width=%2280%22 height=%2280%22 fill=%22%23ddd%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2230%22%3E🎵%3C/text%3E%3C/svg%3E'">
                <div class="album-info">
                    <div class="album-title">${album.album}</div>
                    <div class="album-year">${album.annee || 'Année inconnue'}</div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// PAGE ALBUM
// ============================================

function getAlbumKey(artiste, album) {
    return artiste + ' - ' + album;
}

async function chargerAlbum() {
    const params = new URLSearchParams(window.location.search);
    const key = params.get('key');
    if (!key) {
        document.getElementById('albumContainer').innerHTML = '<p>Album non trouvé</p>';
        return;
    }
    
    currentAlbumKey = key;
    const data = await chargerCollection();
    
    // Trouver l'album
    const album = data.find(a => getAlbumKey(a.artiste, a.album) === key);
    if (!album) {
        document.getElementById('albumContainer').innerHTML = '<p>Album non trouvé</p>';
        return;
    }
    
    // Charger les notes Firebase
    const docRef = db.collection('albums').doc(key);
    let firebaseData = {};
    try {
        const doc = await docRef.get();
        if (doc.exists) {
            firebaseData = doc.data();
        }
    } catch (e) {
        console.error('Erreur Firebase:', e);
    }
    
    const ratings = firebaseData.ratings || {};
    const comment = firebaseData.comment || '';
    
    // Calculer note pondérée
    const coeffs = { creativite: 5, virtuosite: 4, qualite_prod: 2, note_coeur: 3 };
    let total = 0, totalCoeff = 0;
    for (const [key, coeff] of Object.entries(coeffs)) {
        if (ratings[key]) {
            total += ratings[key] * coeff;
            totalCoeff += coeff;
        }
    }
    const ponderee = totalCoeff > 0 ? (total / totalCoeff) : null;
    
    // Afficher
    const container = document.getElementById('albumContainer');
    const isAdminUser = isAdmin();
    
    container.innerHTML = `
        <div class="album-header">
            <img src="${album.image || ''}" alt="${album.album}" class="album-cover"
                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect width=%22300%22 height=%22300%22 fill=%22%23ddd%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2260%22%3E🎵%3C/text%3E%3C/svg%3E'">
            <div class="album-info">
                <h2>${album.album}</h2>
                <p style="font-size:1.2rem; color:#666;">${album.artiste}</p>
                <p style="color:#888;">${album.annee || 'Année inconnue'}</p>
                ${ponderee !== null ? `<div class="pondered-note">⭐ ${ponderee.toFixed(1)}/10</div>` : ''}
                ${isAdminUser ? '<div class="auth-message success">✅ Mode admin - Vous pouvez modifier</div>' : '<div class="auth-message info">👀 Mode lecture seule</div>'}
            </div>
        </div>
        
        <div class="rating-section">
            ${renderRatingAxis('Créativité', 'creativite', ratings, isAdminUser)}
            ${renderRatingAxis('Virtuosité', 'virtuosite', ratings, isAdminUser)}
            ${renderRatingAxis('Qualité Production', 'qualite_prod', ratings, isAdminUser)}
            ${renderRatingAxis('❤️ Cœur', 'note_coeur', ratings, isAdminUser)}
        </div>
        
        <div class="comment-section">
            <h3>Commentaire</h3>
            <textarea id="commentInput" ${!isAdminUser ? 'disabled' : ''} 
                      placeholder="${isAdminUser ? 'Écrire un commentaire...' : 'Connectez-vous en tant qu'admin pour commenter'}">${comment}</textarea>
            ${isAdminUser ? `<button onclick="saveAlbumData()" class="save-btn">💾 Sauvegarder</button>` : ''}
        </div>
    `;
}

function renderRatingAxis(label, key, ratings, isAdmin) {
    const value = ratings[key] || 0;
    const stars = Array.from({ length: 10 }, (_, i) => 
        `<span class="star ${i < value ? 'active' : ''}" data-axis="${key}" data-value="${i+1}" 
              onclick="${isAdmin ? `setRating('${key}', ${i+1})` : ''}"
              style="${!isAdmin ? 'cursor:default;' : ''}">★</span>`
    ).join('');
    
    return `
        <div class="rating-axis">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
                <strong>${label}</strong>
                <span class="rating-value">${value > 0 ? value : 'Non noté'}</span>
            </div>
            <div class="rating-stars">${stars}</div>
        </div>
    `;
}

let tempRatings = {};

function setRating(axis, value) {
    if (!isAdmin()) return;
    tempRatings[axis] = value;
    
    // Mettre à jour l'affichage
    const stars = document.querySelectorAll(`.star[data-axis="${axis}"]`);
    stars.forEach((star, i) => {
        star.classList.toggle('active', i < value);
    });
    
    const valueDisplay = stars[0].closest('.rating-axis').querySelector('.rating-value');
    if (valueDisplay) valueDisplay.textContent = value;
}

async function saveAlbumData() {
    if (!isAdmin() || !currentAlbumKey) {
        alert('Vous devez être connecté en tant qu'admin');
        return;
    }
    
    const comment = document.getElementById('commentInput')?.value || '';
    
    // Récupérer toutes les notes
    const ratings = {};
    document.querySelectorAll('.rating-axis').forEach(axis => {
        const stars = axis.querySelectorAll('.star.active');
        const axisName = axis.querySelector('.star')?.dataset.axis;
        if (axisName) {
            ratings[axisName] = stars.length;
        }
    });
    
    try {
        await db.collection('albums').doc(currentAlbumKey).set({
            artiste: currentAlbumKey.split(' - ')[0],
            album: currentAlbumKey.split(' - ')[1] || currentAlbumKey,
            ratings: ratings,
            comment: comment,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        alert('✅ Données sauvegardées !');
    } catch (error) {
        console.error('Erreur sauvegarde:', error);
        alert('❌ Erreur: ' + error.message);
    }
}

// ============================================
// PAGE CLASSEMENT
// ============================================

async function chargerClassement(filter) {
    const data = await chargerCollection();
    const container = document.getElementById('classementList');
    if (!container) return;
    
    // Charger toutes les notes Firebase
    const albumsWithRatings = [];
    for (const album of data) {
        const key = getAlbumKey(album.artiste, album.album);
        try {
            const doc = await db.collection('albums').doc(key).get();
            let ratings = {};
            if (doc.exists) {
                const d = doc.data();
                ratings = d.ratings || {};
            }
            
            // Calculer note pondérée
            const coeffs = { creativite: 5, virtuosite: 4, qualite_prod: 2, note_coeur: 3 };
            let total = 0, totalCoeff = 0;
            for (const [k, coeff] of Object.entries(coeffs)) {
                if (ratings[k]) {
                    total += ratings[k] * coeff;
                    totalCoeff += coeff;
                }
            }
            const ponderee = totalCoeff > 0 ? (total / totalCoeff) : 0;
            
            albumsWithRatings.push({
                ...album,
                ratings,
                ponderee,
                key
            });
        } catch (e) {
            console.error('Erreur:', e);
            albumsWithRatings.push({ ...album, ratings: {}, ponderee: 0, key });
        }
    }
    
    // Trier
    const sorted = albumsWithRatings.sort((a, b) => b.ponderee - a.ponderee);
    
    let filtered = sorted;
    if (filter === 'top10') filtered = sorted.slice(0, 10);
    else if (filter === 'top50') filtered = sorted.slice(0, 50);
    
    container.innerHTML = filtered.map((album, index) => `
        <a href="album.html?key=${encodeURIComponent(album.key)}" class="classement-item">
            <div class="rank">#${index + 1}</div>
            <img src="${album.image || ''}" alt="${album.album}" class="cover"
                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22%3E%3Crect width=%2260%22 height=%2260%22 fill=%22%23ddd%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2230%22%3E🎵%3C/text%3E%3C/svg%3E'">
            <div class="info">
                <div class="title">${album.album}</div>
                <div class="artist">${album.artiste}</div>
                <div class="details">
                    ${album.ratings.creativite ? `C:${album.ratings.creativite}` : '?'} | 
                    ${album.ratings.virtuosite ? `V:${album.ratings.virtuosite}` : '?'} | 
                    ${album.ratings.qualite_prod ? `P:${album.ratings.qualite_prod}` : '?'} | 
                    ❤️:${album.ratings.note_coeur || '?'}
                </div>
            </div>
            <div class="score">${album.ponderee > 0 ? album.ponderee.toFixed(1) : 'Non noté'}</div>
        </a>
    `).join('');
}

// ============================================
// PAGE RECOMMANDATION
// ============================================

async function chargerRecommandation() {
    const container = document.getElementById('recommandationContainer');
    if (!container) return;
    
    try {
        const doc = await db.collection('settings').doc('recommandation').get();
        if (doc.exists) {
            const data = doc.data();
            const key = data.albumNom;
            const collection = await chargerCollection();
            const album = collection.find(a => getAlbumKey(a.artiste, a.album) === key);
            
            if (album) {
                container.innerHTML = `
                    <div style="display:flex; gap:2rem; align-items:center; flex-wrap:wrap; background:white; padding:2rem; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.1);">
                        <img src="${album.image || ''}" alt="${album.album}" style="max-width:200px; border-radius:8px;"
                             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect width=%22200%22 height=%22200%22 fill=%22%23ddd%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2250%22%3E🎵%3C/text%3E%3C/svg%3E'">
                        <div>
                            <h2>${album.album}</h2>
                            <p style="font-size:1.2rem; color:#666;">${album.artiste}</p>
                            <p style="color:#888;">${album.annee || ''}</p>
                            <p style="margin-top:1rem; color:#FF6B35;">📅 ${data.date || ''}</p>
                            <a href="album.html?key=${encodeURIComponent(key)}" class="home-btn home-btn-primary" style="display:inline-block; margin-top:1rem;">Voir l'album</a>
                        </div>
                    </div>
                `;
                return;
            }
        }
    } catch (e) {
        console.error('Erreur:', e);
    }
    
    container.innerHTML = `
        <div style="text-align:center; padding:3rem; background:white; border-radius:12px;">
            <p style="font-size:2rem;">🎵</p>
            <h3>Aucune recommandation pour aujourd'hui</h3>
            <p style="color:#888;">Revenez plus tard !</p>
        </div>
    `;
}

async function chargerAlbumsPourAdmin() {
    const adminZone = document.getElementById('adminZone');
    if (!adminZone) return;
    
    const isAdminUser = isAdmin();
    adminZone.style.display = isAdminUser ? 'block' : 'none';
    
    if (!isAdminUser) return;
    
    const data = await chargerCollection();
    const select = document.getElementById('albumSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">Choisir un album...</option>' + 
        data.map(album => {
            const key = getAlbumKey(album.artiste, album.album);
            return `<option value="${key}">${album.artiste} - ${album.album}</option>`;
        }).join('');
    
    document.getElementById('setRecommandationBtn')?.addEventListener('click', async () => {
        const key = select.value;
        if (!key) {
            alert('Choisissez un album');
            return;
        }
        
        try {
            await db.collection('settings').doc('recommandation').set({
                albumNom: key,
                artiste: key.split(' - ')[0],
                date: new Date().toLocaleDateString('fr-FR')
            });
            alert('✅ Recommandation mise à jour !');
            chargerRecommandation();
        } catch (error) {
            alert('❌ Erreur: ' + error.message);
        }
    });
}

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    
    // Recharger les données admin quand l'utilisateur change
    auth.onAuthStateChanged(() => {
        if (window.location.pathname.includes('recommandation.html')) {
            chargerAlbumsPourAdmin();
        }
        if (window.location.pathname.includes('album.html')) {
            chargerAlbum();
        }
    });
});

console.log('🚀 Application Collection Robin chargée');
