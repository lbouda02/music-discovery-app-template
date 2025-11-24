// Fichier : src/services/artist-count-for-playlist.js

import { fetchPlaylistById } from '../api/spotify-playlists.js';

/**
 * Récupère une playlist et compte le nombre d'apparitions de chaque artiste
 * dans les pistes de cette playlist.
 *
 * @param {string} token - Le jeton d'accès Spotify
 * @param {string} playlistId - L'ID de la playlist Spotify
 * @returns {Promise<Object|undefined>} Un objet mappant les noms d'artistes à leur nombre d'apparitions,
 * ou undefined si une erreur survient.
 */
export async function artistCountForPlaylist(token, playlistId) {
  try {
    // 1. Récupérer les données de la playlist
    // (Le test 1 simule que fetchPlaylistById retourne { data: ..., error: ... })
    const response = await fetchPlaylistById(token, playlistId);

    // 2. Gérer les erreurs retournées par l'API (partie de la réponse résolue)
    if (response.error) {
      throw new Error(
        response.error.message || 'Erreur lors de la récupération de la playlist'
      );
    }

    // 3. Extraire les données de la playlist (selon la structure du test 1)
    const playlist = response.data;

    // 4. Vérifier si les pistes sont présentes
    if (!playlist || !playlist.tracks || !playlist.tracks.items) {
      console.warn('La playlist ne contient aucune piste ou est invalide.');
      return {}; // Retourne un objet vide s'il n'y a pas de pistes
    }

    // 5. Initialiser le compteur
    const artistCounts = {};

    // 6. Parcourir les pistes et compter les artistes
    for (const item of playlist.tracks.items) {
      // S'assurer que la piste et les artistes existent
      if (item.track && item.track.artists) {
        for (const artist of item.track.artists) {
          const artistName = artist.name;
          if (artistName) {
            // Incrémente le compteur pour cet artiste
            artistCounts[artistName] = (artistCounts[artistName] || 0) + 1;
          }
        }
      }
    }

    return artistCounts;

  } catch (error) {
    // 7. Gestion des erreurs (rejet de promesse, comme dans le Test 2)
    
    // Le Test 2 attend ce message d'erreur spécifique
    console.error(
      `Error fetching playlist for count:`,
      error
    );
    
    // Le Test 2 attend que la fonction retourne 'undefined' en cas d'échec
    return undefined;
  }
}