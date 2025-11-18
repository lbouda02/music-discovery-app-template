// Fichier : src/services/artist-count-for-playlist.test.js
import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { artistCountForPlaylist } from "./artist-count-for-playlist.js";

jest.mock("../api/spotify-playlists.js", () => ({
  fetchPlaylistById: jest.fn(),
}));

import { fetchPlaylistById } from "../api/spotify-playlists.js";

// Helper standard (pour les cas propres)
function makePlaylist(trackItems) {
  return {
    tracks: {
      items: trackItems.map((t) => ({
        track: {
          name: t.name,
          artists: (t.artists || []).map((a) => ({ name: a })),
        },
      })),
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("artistCountForPlaylist", () => {
  // ----------------------------------------------------------------
  // Test 1 : Cas nominal (Tout va bien)
  // ----------------------------------------------------------------
  test("calls fetchPlaylistById and counts artists correctly", async () => {
    fetchPlaylistById.mockResolvedValue({
      data: makePlaylist([
        { name: "S1", artists: ["A1"] },
        { name: "S2", artists: ["A1", "A2"] },
      ]),
      error: null,
    });

    const result = await artistCountForPlaylist("token", "id");
    expect(result).toEqual({ "A1": 2, "A2": 1 });
  });

  // ----------------------------------------------------------------
  // Test 2 : Erreur Réseau (Catch global)
  // ----------------------------------------------------------------
  test("returns undefined and logs error when fetch rejects", async () => {
    const mockError = new Error("Network fail");
    fetchPlaylistById.mockRejectedValue(mockError);
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const result = await artistCountForPlaylist("t", "p");
    
    expect(result).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  // ----------------------------------------------------------------
  // Test 3 : Erreur API sans message (Pour couvrir la ligne 23)
  // ----------------------------------------------------------------
  test("uses default error message when API error has no message", async () => {
    // Ligne 23 : on force error.message à être undefined pour déclencher le "|| 'Erreur...'"
    fetchPlaylistById.mockResolvedValue({
      data: null,
      error: {}, // Objet erreur vide
    });

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await artistCountForPlaylist("token", "bad_id");

    // On vérifie qu'on a bien utilisé le message par défaut défini ligne 23
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error fetching playlist"),
      expect.objectContaining({ 
        message: "Erreur lors de la récupération de la playlist" 
      })
    );

    consoleSpy.mockRestore();
  });

  // ----------------------------------------------------------------
  // Test 4 : Playlist vide/invalide (Lignes 32-33)
  // ----------------------------------------------------------------
  test("returns empty object if playlist has no tracks", async () => {
    fetchPlaylistById.mockResolvedValue({ data: {}, error: null });
    const consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {});

    const result = await artistCountForPlaylist("t", "p");
    
    expect(result).toEqual({});
    expect(consoleWarn).toHaveBeenCalled();
    consoleWarn.mockRestore();
  });

  // ----------------------------------------------------------------
  // Test 5 : Données corrompues dans la boucle (Pour couvrir 42-45)
  // ----------------------------------------------------------------
  test("skips invalid tracks or artists without names", async () => {
    // On construit manuellement une structure "sale" pour passer dans les 'else' des if
    const dirtyData = {
      tracks: {
        items: [
          // Cas A : item.track est null (Ligne 42 - false)
          { track: null }, 
          
          // Cas B : item.track existe mais artists est null (Ligne 42 - false)
          { track: { name: "No Artists", artists: null } },

          // Cas C : Artiste valide + Artiste sans nom (Ligne 45)
          { 
            track: { 
              name: "Mixed Artists", 
              artists: [
                { name: "Valid Artist" }, // Passera
                { name: "" },             // Ligne 45 - false (nom vide)
                { name: null }            // Ligne 45 - false (nom null)
              ] 
            } 
          }
        ]
      }
    };

    fetchPlaylistById.mockResolvedValue({
      data: dirtyData,
      error: null,
    });

    const result = await artistCountForPlaylist("token", "dirty_playlist");

    // Seul "Valid Artist" doit être compté
    expect(result).toEqual({ "Valid Artist": 1 });
  });
});