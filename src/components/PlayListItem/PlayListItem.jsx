import { useNavigate } from 'react-router-dom';
import './PlayListItem.css';
import '../ListItem.css';

/**
 * Playlist item component
 * @param {*}  playlist 
 * @returns JSX.Element
 */
export default function PlayListItem({ playlist }) {
  const navigate = useNavigate();

  // Fonction pour naviguer vers la page de détail interne
  const handleGoToDetail = () => {
    navigate(`/playlist/${playlist.id}`);
  };

  // Gestion du clavier pour l'accessibilité
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        handleGoToDetail();
    }
  };

  // Fonction pour ouvrir Spotify (externe)
  const handleExternalLink = (e) => {
    // Stop propagation reste utile si le CSS superpose les éléments, 
    // bien que structurellement ils soient maintenant frères.
    e.stopPropagation(); 
  };

  return (
    <li 
      key={playlist.id} 
      data-testid={`playlist-item-${playlist.id}`} 
      className="list-item playlist-item"
    >
      {/* CORRECTION : On déplace l'interactivité sur une DIV interne.
         Le <li> reste un élément de liste neutre.
         La <div> devient le bouton interactif.
      */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleGoToDetail}
        onKeyDown={handleKeyDown}
        // On utilise des styles pour s'assurer que cette div prend la place et aligne le contenu
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          flex: 1, 
          cursor: 'pointer',
          outline: 'none' // Optionnel: gérer le focus visible via CSS classe est mieux
        }}
      >
        <img
          src={playlist.images[0]?.url}
          alt="cover"
          className="playlist-item-cover"
        />
        <div className="playlist-item-details">
          <div className="playlist-item-details-header">
            <div className="playlist-item-title">{playlist.name}</div>
            <div className="playlist-item-owner">By {playlist.owner.display_name}</div>
          </div>
          <div className="playlist-item-tracks">{playlist.tracks.total} tracks</div>
        </div>
      </div>
      
      {/* Le lien est maintenant un frère (sibling) de la zone cliquable, plus un enfant */}
      <a
        href={playlist.external_urls.spotify}
        target="_blank"
        rel="noopener noreferrer"
        className="playlist-link"
        onClick={handleExternalLink}
        onKeyDown={(e) => e.stopPropagation()}
      >
        Open
      </a>
    </li>
  );
}