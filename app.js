let albums = [];
let currentFilter = 'all';
let currentAlbumIndex = -1;
const STORAGE_KEY = 'music_collection_notes';

async function loadAlbums() {
    try {
        const response = await fetch('data/collection.json');
        albums = await response.json();
        document.getElementById('total-albums').textContent = albums.length;
        renderAlbums();
        document.getElementById('update-date').textContent = new Date().toLocaleDateString('fr-FR');
    } catch (error) {
        document.getElementById('album-grid').innerHTML = '<div class="loading">❌ Erreur de chargement</div>';
    }
}

function renderAlbums() {
    const grid = document.getElementById('album-grid');
    const search = document.getElementById('search-input').value.toLowerCase();
    let filtered = albums.filter(a => a.artiste.toLowerCase().includes(search) || a.album.toLowerCase().includes(search));
    if (currentFilter === 'favorites') {
        filtered = filtered.filter(a => { const n = getNote(a); return n && n >= 4; });
    }
    if (filtered.length === 0) {
        grid.innerHTML = '<div class="loading">Aucun album trouvé</div>';
        return;
    }
    grid.innerHTML = filtered.map((album, index) => {
        const note = getNote(album);
        const isFavorite = note && note >= 4;
        const imagePath = album.image ? `images/${album.image}` : '';
        return `
            <div class="album-card" onclick="openAlbum(${albums.indexOf(album)})">
                <img class="cover" src="${imagePath}" alt="${album.album}" loading="lazy">
                <div class="info">
                    <span class="artiste">${escapeHtml(album.artiste)}</span>
                    <span class="album-title">${escapeHtml(album.album)}</span>
                    <span class="annee">${album.annee} ${isFavorite ? '⭐' : ''}</span>
                </div>
            </div>
        `;
    }).join('');
}

function openAlbum(index) {
    currentAlbumIndex = index;
    const album = albums[index];
    const modal = document.getElementById('album-modal');
    const body = document.getElementById('modal-body');
    const note = getNote(album) || 0;
    const comment = getComment(album) || '';
    const imagePath = album.image ? `images/${album.image}` : '';
    
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<span class="star ${i <= note ? 'active' : ''}" onclick="setNote(${i})">⭐</span>`;
    }
    
    let pistesHtml = '';
    if (album.pistes && album.pistes.length > 0) {
        pistesHtml = '<ul class="modal-pistes-list">' + 
            album.pistes.map(p => `<li><span class="piste-num">${p.numero}</span>${escapeHtml(p.titre)}</li>`).join('') +
            '</ul>';
    }
    
    body.innerHTML = `
        <img class="modal-cover" src="${imagePath}" alt="${album.album}">
        <div class="modal-artiste">${escapeHtml(album.artiste)}</div>
        <div class="modal-album">${escapeHtml(album.album)}</div>
        <div class="modal-annee">${album.annee} · ${album.nb_pistes || 0} pistes</div>
        <div class="modal-rating">
            <span>Ma note :</span>
            ${stars}
            <span style="font-size:13px;color:#888" id="note-text">${note > 0 ? note + '/5' : 'Non noté'}</span>
        </div>
        <div class="modal-commentaire">
            <label style="color:#888;font-size:14px;display:block;margin-bottom:4px;">💬 Mon commentaire</label>
            <textarea id="comment-input" placeholder="Votre avis sur cet album...">${escapeHtml(comment)}</textarea>
        </div>
        <button class="save-btn" onclick="saveNoteAndComment()">💾 Sauvegarder</button>
        ${pistesHtml ? `<div class="modal-pistes"><strong>Pistes :</strong> ${pistesHtml}</div>` : ''}
    `;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('album-modal').classList.remove('open');
    document.body.style.overflow = '';
}

document.addEventListener('click', function(event) {
    if (event.target === document.getElementById('album-modal')) closeModal();
});
document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeModal(); });

function getStorage() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}

function getNote(album) {
    const key = album.nom || `${album.artiste}-${album.album}`;
    return getStorage()[key]?.note || 0;
}

function getComment(album) {
    const key = album.nom || `${album.artiste}-${album.album}`;
    return getStorage()[key]?.comment || '';
}

function setNote(note) {
    document.querySelectorAll('.star').forEach((el, i) => {
        el.classList.toggle('active', i < note);
    });
    document.getElementById('note-text').textContent = note + '/5';
    const album = albums[currentAlbumIndex];
    const key = album.nom || `${album.artiste}-${album.album}`;
    const storage = getStorage();
    if (!storage[key]) storage[key] = {};
    storage[key].note = note;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
}

function saveNoteAndComment() {
    const album = albums[currentAlbumIndex];
    const key = album.nom || `${album.artiste}-${album.album}`;
    const comment = document.getElementById('comment-input')?.value || '';
    const storage = getStorage();
    if (!storage[key]) storage[key] = {};
    storage[key].comment = comment;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    alert('✅ Note et commentaire sauvegardés !');
    renderAlbums();
}

function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    renderAlbums();
}

function filterAlbums() { renderAlbums(); }

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', loadAlbums);