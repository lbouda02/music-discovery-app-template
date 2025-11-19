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

  // Fonction pour ouvrir Spotify (externe) sans déclencher la navigation interne
  const handleExternalLink = (e) => {
    e.stopPropagation(); // Empêche le clic de "remonter" vers le li
  };

  return (
    <li 
      key={playlist.id} 
      data-testid={`playlist-item-${playlist.id}`} 
      className="list-item playlist-item"
      // On rend toute la carte cliquable
      onClick={handleGoToDetail}
      // On ajoute un curseur main pour indiquer que c'est cliquable
      style={{ cursor: 'pointer' }}
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
      
      {/* Le bouton "Open" reste, mais on empêche qu'il déclenche aussi la navigation interne */}
      <a
        href={playlist.external_urls.spotify}
        target="_blank"
        rel="noopener noreferrer"
        className="playlist-link"
        onClick={handleExternalLink}
      >
        Open
      </a>
    </li>
  );
}