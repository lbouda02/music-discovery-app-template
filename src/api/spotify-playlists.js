import { SPOTIFY_API_BASE } from "./spotify-commons.js";

/**
 * Fetch a Spotify playlist by its ID.
 * @param {string} token - The Spotify access token.
 * @param {string} playlistId - The ID of the playlist to fetch.
 * @returns {Promise<{ playlist: object|null, error: string|null }>} - The playlist data or an error message.
 */
export async function fetchPlaylistById(token, playlistId) {
  // early return if no token
  if (!token) {
    return { error: 'No access token found.', data: null };
  }

  try {
    // Construction de l'URL
    const url = `${SPOTIFY_API_BASE}/playlists/${playlistId}`;

    // --- DEBUT DEBUG ---
    console.log("%c[API DEBUG] URL appelée :", "color: orange; font-weight: bold;", url);
    console.log("%c[API DEBUG] ID reçu :", "color: orange; font-weight: bold;", `"${playlistId}"`);
    // --- FIN DEBUG ---

    // fetch playlist from Spotify API
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    const data = await res.json();

    // handle potential API error
    if (data.error) {
      console.error("[API ERROR]", data.error); // Log l'erreur spécifique de Spotify
      return { error: data.error.message, data: null };
    }

    // return fetched playlist
    return { data, error: null };

  } catch (err) {
    console.error("[NETWORK ERROR]", err);
    return { error: 'Failed to fetch playlist.', data: null };
  }
}