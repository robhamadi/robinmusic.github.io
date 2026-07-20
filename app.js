// ============================================
// APPLICATION COLLECTION ROBIN
// ============================================

console.log('🚀 app.js chargé');

// ============================================
// PAGE ARTISTES
// ============================================

function chargerArtistes() {
    console.log('🎤 chargerArtistes appelé');
    var container = document.getElementById('artistesContainer');
    if (!container) {
        console.error('❌ Container artistesContainer non trouvé');
        return;
    }
    
    fetch('data/collection.json')
        .then(function(response) {
            console.log('📡 Réponse reçue');
            if (!response.ok) throw new Error('Erreur HTTP: ' + response.status);
            return response.json();
        })
        .then(function(data) {
            console.log('📊 Données chargées:', data.length, 'albums');
            
            if (!data || data.length === 0) {
                container.innerHTML = '<p style="text-align:center;padding:2rem;color:#666;">Aucun album trouvé</p>';
                return;
            }
            
            // Grouper par artiste
            var artistes = {};
            data.forEach(function(album) {
                if (!artistes[album.artiste]) {
                    artistes[album.artiste] = [];
                }
                artistes[album.artiste].push(album);
            });
            
            var artisteNames = Object.keys(artistes).sort();
            console.log('🎤 Artistes trouvés:', artisteNames.length);
            
            // Navigation alphabétique
            var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
            var nav = document.getElementById('alphabetNav');
            if (nav) {
                var navHtml = '';
                alphabet.forEach(function(letter) {
                    var hasLetter = artisteNames.some(function(name) {
                        return name.charAt(0).toUpperCase() === letter;
                    });
                    navHtml += '<a href="#" data-letter="' + letter + '" onclick="scrollToLetter(\'' + letter + '\'); return false;" class="' + (hasLetter ? '' : 'disabled') + '">' + letter + '</a>';
                });
                nav.innerHTML = navHtml;
            }
            
            // Grouper par première lettre
            var groups = {};
            artisteNames.forEach(function(nom) {
                var letter = nom.charAt(0).toUpperCase();
                if (!groups[letter]) groups[letter] = [];
                groups[letter].push(nom);
            });
            
            var html = '';
            var sortedLetters = Object.keys(groups).sort();
            sortedLetters.forEach(function(letter) {
                html += '<div class="artiste-section" id="section-' + letter + '">';
                html += '<h2>' + letter + '</h2>';
                html += '<div class="artistes-grid">';
                
                groups[letter].forEach(function(nom) {
                    var albums = artistes[nom];
                    var cover = '';
                    for (var i = 0; i < albums.length; i++) {
                        if (albums[i].image && albums[i].image !== '') {
                            cover = albums[i].image;
                            break;
                        }
                    }
                    html += '<a href="discographie.html?artiste=' + encodeURIComponent(nom) + '" class="artiste-card">';
                    html += '<img src="' + cover + '" alt="' + nom + '" class="artiste-cover" onerror="this.src=\'data:image/svg+xml,%253Csvg xmlns=%2522http://www.w3.org/2000/svg%2522 width=%2522120%2522 height=%2522120%2522%253E%253Crect width=%2522120%2522 height=%2522120%2522 fill=%2522%2523ddd%2522/%253E%253Ctext x=%252250%2525%2522 y=%252250%2525%2522 text-anchor=%2522middle%2522 dy=%2522.3em%2522 fill=%2522%2523999%2522 font-size=%252240%2522%253E%25F0%259F%258E%25B5%253C/text%253E%253C/svg%253E\'">';
                    html += '<div class="artiste-name">' + nom + '</div>';
                    html += '<div class="album-count">' + albums.length + ' album' + (albums.length > 1 ? 's' : '') + '</div>';
                    html += '</a>';
                });
                
                html += '</div></div>';
            });
            
            container.innerHTML = html;
            console.log('✅ Artistes affichés avec succès');
        })
        .catch(function(err) {
            console.error('❌ Erreur chargement artistes:', err);
            container.innerHTML = '<p style="text-align:center;padding:2rem;color:red;">❌ Erreur: ' + err.message + '</p>';
        });
}

function scrollToLetter(letter) {
    var section = document.getElementById('section-' + letter);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function filtrerArtistes(searchTerm) {
    console.log('🔍 Recherche:', searchTerm);
    var container = document.getElementById('artistesContainer');
    if (!container) return;
    
    if (!searchTerm || searchTerm.trim() === '') {
        chargerArtistes();
        return;
    }
    
    fetch('data/collection.json')
        .then(function(response) { return response.json(); })
        .then(function(data) {
            var artistes = {};
            data.forEach(function(album) {
                if (!artistes[album.artiste]) {
                    artistes[album.artiste] = [];
                }
                artistes[album.artiste].push(album);
            });
            
            var filtered = Object.keys(artistes)
                .filter(function(nom) {
                    return nom.toLowerCase().includes(searchTerm.toLowerCase());
                })
                .sort();
            
            if (filtered.length === 0) {
                container.innerHTML = '<p style="text-align:center;padding:2rem;color:#666;">Aucun artiste trouvé</p>';
                return;
            }
            
            // Afficher les résultats filtrés
            var html = '';
            var groups = {};
            filtered.forEach(function(nom) {
                var letter = nom.charAt(0).toUpperCase();
                if (!groups[letter]) groups[letter] = [];
                groups[letter].push(nom);
            });
            
            Object.keys(groups).sort().forEach(function(letter) {
                html += '<div class="artiste-section" id="section-' + letter + '">';
                html += '<h2>' + letter + '</h2>';
                html += '<div class="artistes-grid">';
                groups[letter].forEach(function(nom) {
                    var albums = artistes[nom];
                    var cover = '';
                    for (var i = 0; i < albums.length; i++) {
                        if (albums[i].image && albums[i].image !== '') {
                            cover = albums[i].image;
                            break;
                        }
                    }
                    html += '<a href="discographie.html?artiste=' + encodeURIComponent(nom) + '" class="artiste-card">';
                    html += '<img src="' + cover + '" alt="' + nom + '" class="artiste-cover" onerror="this.src=\'data:image/svg+xml,%253Csvg xmlns=%2522http://www.w3.org/2000/svg%2522 width=%2522120%2522 height=%2522120%2522%253E%253Crect width=%2522120%2522 height=%2522120%2522 fill=%2522%2523ddd%2522/%253E%253Ctext x=%252250%2525%2522 y=%252250%2525%2522 text-anchor=%2522middle%2522 dy=%2522.3em%2522 fill=%2522%2523999%2522 font-size=%252240%2522%253E%25F0%259F%258E%25B5%253C/text%253E%253C/svg%253E\'">';
                    html += '<div class="artiste-name">' + nom + '</div>';
                    html += '<div class="album-count">' + albums.length + ' album' + (albums.length > 1 ? 's' : '') + '</div>';
                    html += '</a>';
                });
                html += '</div></div>';
            });
            
            container.innerHTML = html;
        })
        .catch(function(err) {
            console.error('Erreur recherche:', err);
        });
}

// ============================================
// PAGE DISCOGRAPHIE
// ============================================

function getAlbumKey(artiste, album) {
    return artiste + ' - ' + album;
}

function chargerDiscographie(artisteNom, sortType) {
    console.log('📀 Discographie:', artisteNom, sortType);
    if (!sortType) sortType = 'chronologique';
    
    var container = document.getElementById('discographieList');
    var titre = document.getElementById('artisteName');
    if (!container) {
        console.error('❌ Container discographieList non trouvé');
        return;
    }
    if (titre) titre.textContent = artisteNom;
    
    fetch('data/collection.json')
        .then(function(response) { return response.json(); })
        .then(function(data) {
            var albums = data.filter(function(a) {
                return a.artiste === artisteNom;
            });
            
            console.log('📀 Albums trouvés:', albums.length);
            
            switch(sortType) {
                case 'chronologique':
                    albums.sort(function(a, b) {
                        return (a.annee || '0').localeCompare(b.annee || '0');
                    });
                    break;
                case 'chronologique-inverse':
                    albums.sort(function(a, b) {
                        return (b.annee || '0').localeCompare(a.annee || '0');
                    });
                    break;
                case 'alpha':
                    albums.sort(function(a, b) {
                        return a.album.localeCompare(b.album);
                    });
                    break;
            }
            
            if (albums.length === 0) {
                container.innerHTML = '<p style="text-align:center;padding:2rem;color:#666;">Aucun album trouvé pour cet artiste</p>';
                return;
            }
            
            var html = '';
            albums.forEach(function(album) {
                var key = getAlbumKey(album.artiste, album.album);
                html += '<div class="discographie-item" onclick="window.location.href=\'album.html?key=' + encodeURIComponent(key) + '\'">';
                html += '<img src="' + (album.image || '') + '" alt="' + album.album + '" onerror="this.src=\'data:image/svg+xml,%253Csvg xmlns=%2522http://www.w3.org/2000/svg%2522 width=%252280%2522 height=%252280%2522%253E%253Crect width=%252280%2522 height=%252280%2522 fill=%2522%2523ddd%2522/%253E%253Ctext x=%252250%2525%2522 y=%252250%2525%2522 text-anchor=%2522middle%2522 dy=%2522.3em%2522 fill=%2522%2523999%2522 font-size=%252230%2522%253E%25F0%259F%258E%25B5%253C/text%253E%253C/svg%253E\'" style="width:80px;height:80px;object-fit:cover;border-radius:8px;background:#eee;">';
                html += '<div class="album-info">';
                html += '<div class="album-title">' + album.album + '</div>';
                html += '<div class="album-year">' + (album.annee || 'Année inconnue') + '</div>';
                html += '</div></div>';
            });
            
            container.innerHTML = html;
            console.log('✅ Discographie affichée');
        })
        .catch(function(err) {
            console.error('❌ Erreur discographie:', err);
            container.innerHTML = '<p style="text-align:center;padding:2rem;color:red;">❌ Erreur: ' + err.message + '</p>';
        });
}

// ============================================
// PAGE ALBUM
// ============================================

function chargerAlbum() {
    console.log('💿 chargerAlbum appelé');
    var container = document.getElementById('albumContainer');
    if (!container) {
        console.error('❌ Container albumContainer non trouvé');
        return;
    }
    
    var params = new URLSearchParams(window.location.search);
    var key = params.get('key');
    if (!key) {
        container.innerHTML = '<p style="text-align:center;padding:2rem;">Album non trouvé</p>';
        return;
    }
    
    fetch('data/collection.json')
        .then(function(response) { return response.json(); })
        .then(function(data) {
            var album = null;
            for (var i = 0; i < data.length; i++) {
                if (getAlbumKey(data[i].artiste, data[i].album) === key) {
                    album = data[i];
                    break;
                }
            }
            
            if (!album) {
                container.innerHTML = '<p style="text-align:center;padding:2rem;">Album non trouvé</p>';
                return;
            }
            
            container.innerHTML = 
                '<div style="display:flex;gap:2rem;flex-wrap:wrap;">' +
                    '<img src="' + (album.image || '') + '" alt="' + album.album + '" style="max-width:300px;width:100%;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.2);" onerror="this.src=\'data:image/svg+xml,%253Csvg xmlns=%2522http://www.w3.org/2000/svg%2522 width=%2522300%2522 height=%2522300%2522%253E%253Crect width=%2522300%2522 height=%2522300%2522 fill=%2522%2523ddd%2522/%253E%253Ctext x=%252250%2525%2522 y=%252250%2525%2522 text-anchor=%2522middle%2522 dy=%2522.3em%2522 fill=%2522%2523999%2522 font-size=%252260%2522%253E%25F0%259F%258E%25B5%253C/text%253E%253C/svg%253E\'">' +
                    '<div style="flex:1;min-width:250px;">' +
                        '<h2>' + album.album + '</h2>' +
                        '<p style="font-size:1.2rem;color:#666;">' + album.artiste + '</p>' +
                        '<p style="color:#888;">' + (album.annee || 'Année inconnue') + '</p>' +
                        '<div style="margin-top:1rem;padding:1rem;background:#f5f5f5;border-radius:8px;">' +
                            '<p>🎵 Album dans la collection</p>' +
                            '<p style="font-size:0.9rem;color:#666;">Les notes sont disponibles dans l'application complète</p>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            console.log('✅ Album affiché:', album.album);
        })
        .catch(function(err) {
            console.error('❌ Erreur album:', err);
            container.innerHTML = '<p style="text-align:center;padding:2rem;color:red;">❌ Erreur: ' + err.message + '</p>';
        });
}

// ============================================
// PAGE CLASSEMENT
// ============================================

function chargerClassement(filter) {
    console.log('🏆 chargerClassement appelé:', filter);
    var container = document.getElementById('classementList');
    if (!container) return;
    
    if (!filter) filter = 'all';
    
    fetch('data/collection.json')
        .then(function(response) { return response.json(); })
        .then(function(data) {
            if (!data || data.length === 0) {
                container.innerHTML = '<p style="text-align:center;padding:2rem;color:#666;">Aucun album</p>';
                return;
            }
            
            var sorted = data.slice().sort(function(a, b) {
                return a.album.localeCompare(b.album);
            });
            
            if (filter === 'top10') sorted = sorted.slice(0, 10);
            else if (filter === 'top50') sorted = sorted.slice(0, 50);
            
            var html = '';
            sorted.forEach(function(album, index) {
                var key = getAlbumKey(album.artiste, album.album);
                html += '<a href="album.html?key=' + encodeURIComponent(key) + '" class="classement-item">';
                html += '<div class="rank">#' + (index + 1) + '</div>';
                html += '<img src="' + (album.image || '') + '" alt="' + album.album + '" class="cover" onerror="this.src=\'data:image/svg+xml,%253Csvg xmlns=%2522http://www.w3.org/2000/svg%2522 width=%252260%2522 height=%252260%2522%253E%253Crect width=%252260%2522 height=%252260%2522 fill=%2522%2523ddd%2522/%253E%253Ctext x=%252250%2525%2522 y=%252250%2525%2522 text-anchor=%2522middle%2522 dy=%2522.3em%2522 fill=%2522%2523999%2522 font-size=%252230%2522%253E%25F0%259F%258E%25B5%253C/text%253E%253C/svg%253E\'" style="width:60px;height:60px;object-fit:cover;border-radius:8px;background:#eee;">';
                html += '<div class="info">';
                html += '<div class="title">' + album.album + '</div>';
                html += '<div class="artist">' + album.artiste + '</div>';
                html += '</div>';
                html += '<div class="score">Non noté</div>';
                html += '</a>';
            });
            
            container.innerHTML = html;
            console.log('✅ Classement affiché:', sorted.length, 'albums');
        })
        .catch(function(err) {
            console.error('❌ Erreur classement:', err);
            container.innerHTML = '<p style="text-align:center;padding:2rem;color:red;">❌ Erreur: ' + err.message + '</p>';
        });
}

// ============================================
// PAGE RECOMMANDATION
// ============================================

function chargerRecommandation() {
    console.log('⭐ chargerRecommandation appelé');
    var container = document.getElementById('recommandationContainer');
    if (!container) return;
    
    container.innerHTML = 
        '<div style="text-align:center;padding:3rem;background:white;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);">' +
            '<p style="font-size:3rem;">🎵</p>' +
            '<h3 style="margin:1rem 0;">Recommandation du jour</h3>' +
            '<p style="color:#888;">Fonctionnalité à venir avec Firebase</p>' +
        '</div>';
}

function chargerAlbumsPourAdmin() {
    console.log('👑 chargerAlbumsPourAdmin appelé');
    var adminZone = document.getElementById('adminZone');
    if (adminZone) {
        adminZone.innerHTML = 
            '<h2>Admin</h2>' +
            '<p style="color:#888;">Fonctionnalité à venir avec Firebase</p>';
    }
}

// ============================================
// INITIALISATION
// ============================================

console.log('✅ app.js chargé avec succès');
