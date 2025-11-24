import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildTitle } from '../../constants/appMeta.js';
import { useRequireToken } from '../../hooks/useRequireToken.js';
import TrackItem from '../../components/TrackItem/TrackItem.jsx';
import { fetchUserTopTracks } from '../../api/spotify-me.js';
import { handleTokenError } from '../../utils/handleTokenError.js';
import './TopTracksPage.css';
import '../PageLayout.css';

/**
 * Number of top tracks to fetch
 */
export const limit = 10;

/** Time range for top tracks */
export const timeRange = 'short_term';

/**
 * TopTracks Page 
 * @returns {JSX.Element}
 */
export default function TopTracksPage() {
  // Initialize navigate function
  const navigate = useNavigate();

  // state for tracks data
  const [tracks, setTracks] = useState([]);

  // state for loading and error
  // Initialisé à true, donc pas besoin de le refaire dans useEffect
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // require token to fetch top tracks
  const { token } = useRequireToken();

  // set document title
  useEffect(() => { 
    document.title = buildTitle('Top Tracks'); 
  }, []);

  useEffect(() => {
    if (!token) return; // wait for check or redirect

    // CORRECTION LINTER : Suppression de setLoading(true) ici

    // fetch user top tracks when token changes
    fetchUserTopTracks(token, limit, timeRange)
      .then(res => {
        if (res.error) {
          // Si c'est une erreur de token (401), handleTokenError redirige et retourne true
          const isHandled = handleTokenError(res.error, navigate);
          
          // Si l'erreur n'est pas gérée (pas une erreur de token), on l'affiche
          if (!isHandled) {
            setError(res.error.message || 'Une erreur est survenue');
          }
          
          // IMPORTANT : On arrête l'exécution ici pour ne pas tenter de lire res.data
          return; 
        }

        // Si on arrive ici, c'est qu'il n'y a pas d'erreur, on peut lire les données
        if (res.data && res.data.items) {
           setTracks(res.data.items);
        } else {
           // Cas rare où data serait vide sans erreur
           setTracks([]);
        }
      })
      .catch(err => { 
        console.error(err);
        setError(err.message || 'Erreur réseau inattendue'); 
      })
      .finally(() => { 
        setLoading(false); 
      });
  }, [token, navigate]);

  return (
    <section className="tracks-container page-container" aria-labelledby="tracks-title">
      <h1 id="tracks-title" className="tracks-title page-title">
        Your Top {tracks.length} Tracks of the Month
      </h1>
      
      {loading && (
        <output className="tracks-loading" data-testid="loading-indicator">
          Loading top tracks…
        </output>
      )}
      
      {error && !loading && (
        <div className="tracks-error" role="alert">
          {error}
        </div>
      )}
      
      {!loading && !error && (
        <ol className="tracks-list">
          {tracks.map(track => (
            <TrackItem key={track.id} track={track} />
          ))}
        </ol>
      )}
    </section>
  );
}