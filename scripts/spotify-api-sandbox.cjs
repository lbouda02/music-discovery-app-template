// Fichier : scripts/spotify-api-sandbox.cjs (Corrigé)

const { generateAccessToken } = require("./utils.cjs");
// NE PAS 'require' le service ici

/**
 * Main function to test the artist count service.
 */
const main = async () => {
  try {
    // --- Correction : Importation dynamique ---
    // Nous chargeons le module ESM en utilisant await import()
    const { artistCountForPlaylist } = await import(
      '../src/services/artist-count-for-playlist.js'
    );
    // ----------------------------------------

    var playlistId = "2IgPkhcHbgQ4s4PdCxljAx";
    const token = await generateAccessToken();

    if (!token) {
      console.error("Échec de la génération du token. Vérifiez .env.local");
      return;
    }

    console.log(`Comptage des artistes pour la playlist : ${playlistId}...`);

    const counts = await artistCountForPlaylist(token, playlistId);

    if (!counts) {
      console.error("Le service a échoué (voir logs ci-dessus).");
      return;
    }

    const sortedArtists = Object.entries(counts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 5)
      .map(([artist, count]) => ({
        "Artist": artist,
        "Number of Tracks": count,
      }));

    console.log("\nTop 5 Artists:");
    console.table(sortedArtists);

  } catch (error) {
    console.error("Erreur lors de l'exécution du script sandbox:", error);
  }
};

main();