
// ============================================
// APPLICATION COLLECTION ROBIN
// ============================================

console.log('🚀 app.js chargé');

// ============================================
// AUTHENTIFICATION
// ============================================

function initAuth() {
    var authBtn = document.getElementById('authBtn');
    if (!authBtn) return;
    
    auth.onAuthStateChanged(function(user) {
        if (user) {
            authBtn.textContent = '🔓 Déconnexion';
            authBtn.classList.add('logged-in');
            authBtn.onclick = function() { auth.signOut(); };
            console.log('✅ Connecté:', user.uid);
        } else {
            authBtn.textContent = '🔑 Connexion';
            authBtn.classList.remove('logged-in');
            authBtn.onclick = function() {
                var email = prompt('Email:');
                if (email) {
                    var password = prompt('Mot de passe:');
                    if (password) {
                        auth.signInWithEmailAndPassword(email, password)
                            .catch(function(err) { alert('❌ Erreur: ' + err.message); });
                    }
                }
            };
            console.log('👤 Déconnecté');
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM chargé');
    
    // Initialiser Firebase
    if (typeof firebase !== 'undefined') {
        console.log('🔥 Firebase disponible');
        initAuth();
    } else {
        console.warn('⚠️ Firebase non chargé');
    }
});

console.log('✅ app.js chargé avec succès');
