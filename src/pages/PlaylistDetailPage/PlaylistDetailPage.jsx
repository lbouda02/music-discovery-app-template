import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { buildTitle } from '../../constants/appMeta.js';
import { useRequireToken } from '../../hooks/useRequireToken.js';
import { fetchPlaylistById } from '../../api/spotify-playlists.js';
import { handleTokenError } from '../../utils/handleTokenError.js';
import TrackItem from '../../components/TrackItem/TrackItem.jsx';
import './PlaylistDetailPage.css';
import '../PageLayout.css'; 

export default function PlaylistDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useRequireToken();

  // États
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Titre de la page par défaut
  useEffect(() => {
    document.title = buildTitle('Playlist Details');
  }, []);

  // Récupération des données
  useEffect(() => {
    if (!token || !id) return;

    setLoading(true);
    
    fetchPlaylistById(token, id)
      .then((res) => {
        if (res.error) {
          if (!handleTokenError(res.error, navigate)) {
            setError(res.error.message || 'Erreur lors de la récupération de la playlist');
          }
          return;
        }

        // Vérification si la playlist est vide ou nulle
        if (!res.data) {
            setError("Playlist introuvable ou vide.");
            return;
        }

        setPlaylist(res.data);
        
        // Mise à jour du titre avec le nom réel de la playlist
        if (res.data.name) {
            document.title = buildTitle(res.data.name);
        }
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Erreur réseau inattendue');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, id, navigate]);

  // Rendu : Chargement
  if (loading) {
    return (
        <div className="page-container">
            <output className="playlist-loading">Chargement de la playlist...</output>
        </div>
    );
  }

  // Rendu : Erreur
  if (error) {
    return (
        <div className="page-container">
            <div className="playlist-error" role="alert">{error}</div>
        </div>
    );
  }

  // Rendu : Données non disponibles
  if (!playlist) return null;

  // Extraction sécurisée de l'image
  const coverImage = playlist.images && playlist.images.length > 0 ? playlist.images[0].url : null;

  return (
    <article className="playlist-detail-page page-container">
      
      {/* En-tête de la Playlist */}
      <header className="playlist-header">
        {coverImage && (
          <div className="playlist-cover-wrapper">
            <img 
                src={coverImage} 
                alt={`Cover of ${playlist.name}`} 
                className="playlist-cover" 
            />
          </div>
        )}
        
        <div className="playlist-info">
          <h1 className="page-title">{playlist.name}</h1>
          
          {/* Description HTML safe */}
          {playlist.description && (
            <p className="playlist-description" dangerouslySetInnerHTML={{__html: playlist.description}} />
          )}
          
          <div className="playlist-actions">
              <a 
                href={playlist.external_urls?.spotify} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn--spotify"
              >
                Lire la playlist sur Spotify
              </a>
              <span className="playlist-meta">{playlist.tracks?.total} titres</span>
          </div>
        </div>
      </header>

      <hr className="divider"/>

      {/* Liste des pistes avec le composant TrackItem */}
      <section className="playlist-tracks-section">
        {playlist.tracks?.items?.length > 0 ? (
          <ol className="playlist-tracks-list">
            {playlist.tracks.items.map((item, index) => {
               // Gestion des pistes nulles (possibles via l'API)
               if (!item.track) return null;
               
               return (
                <TrackItem 
                  key={item.track.id || index} 
                  track={item.track} 
                  // J'ai retiré "index={index}" car votre TrackItem ne l'utilise pas
                />
               );
            })}
          </ol>
        ) : (
          <p className="empty-message">Cette playlist ne contient aucune piste.</p>
        )}
      </section>
    </article>
  );
}