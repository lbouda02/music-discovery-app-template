import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// 1. Import du composant
import PlaylistDetailPage from './PlaylistDetailPage.jsx'; 

// 2. Mock de l'API et des hooks
import * as spotifyApi from '../../api/spotify-playlists.js';
import { useRequireToken } from '../../hooks/useRequireToken.js';
import { handleTokenError } from '../../utils/handleTokenError.js';

// --- MOCKS NÉCESSAIRES ---
jest.mock('../../api/spotify-playlists.js');
jest.mock('../../hooks/useRequireToken.js');
jest.mock('../../utils/handleTokenError.js');

// Données de test
const playlistData = {
    id: 'playlist1',
    name: 'My Playlist 1',
    description: 'A cool playlist',
    images: [{ url: 'https://via.placeholder.com/56' }],
    owner: { display_name: 'User1' },
    tracks: { 
        total: 1, 
        items: [
            {
                track: {
                    id: 'track1',
                    name: 'Track One',
                    artists: [{ name: 'Artist A' }],
                    album: { name: 'Album X', images: [{ url: 'img.jpg' }] },
                    external_urls: { spotify: 'http://link.com' },
                },
            },
        ],
    },
    external_urls: { spotify: 'http://playlist.link' }
};

describe('PlaylistDetailPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Simulation Token valide par défaut
        useRequireToken.mockReturnValue({ token: 'test-token' });
        // Simulation handleTokenError (retourne false = pas d'erreur de token)
        handleTokenError.mockReturnValue(false);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('fetches and renders playlist, sets title', async () => {
        // Simulation réponse API réussie
        spotifyApi.fetchPlaylistById.mockResolvedValue({ data: playlistData, error: null });

        render(
            <MemoryRouter initialEntries={['/playlist/playlist1']}>
                <Routes>
                    <Route path="/playlist/:id" element={<PlaylistDetailPage />} />
                </Routes>
            </MemoryRouter>
        );

        // Vérifie l'état de chargement
        expect(screen.getByText(/chargement/i)).toBeInTheDocument();

        // Attente de la fin du chargement et affichage du contenu
        await waitFor(() => {
            expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('My Playlist 1');
        });

        // Vérifications visuelles
        const img = screen.getByAltText(`Cover of My Playlist 1`);
        expect(img).toHaveAttribute('src', 'https://via.placeholder.com/56');
        expect(screen.getByText('A cool playlist')).toBeInTheDocument();
        
        // Vérifie l'appel API
        expect(spotifyApi.fetchPlaylistById).toHaveBeenCalledWith('test-token', 'playlist1');
    });

    test('displays error message on fetch failure (API returns error object)', async () => {
        // Simulation erreur API (ex: 404 gérée par le back)
        spotifyApi.fetchPlaylistById.mockResolvedValue({ 
            data: null, 
            error: { message: 'Failed to fetch playlist' } 
        });

        render(
            <MemoryRouter initialEntries={['/playlist/playlist1']}>
                <Routes>
                    <Route path="/playlist/:id" element={<PlaylistDetailPage />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            const alert = screen.getByRole('alert');
            expect(alert).toHaveTextContent(/failed to fetch playlist/i);
        });
    });

    // --- NOUVEAU TEST AJOUTÉ POUR COUVRIR LES LIGNES 43-44 ---
    test('displays specific error when playlist data is missing (res.data is null)', async () => {
        // Simulation : Pas d'erreur technique, mais aucune donnée renvoyée
        spotifyApi.fetchPlaylistById.mockResolvedValue({ 
            data: null, 
            error: null 
        });

        render(
            <MemoryRouter initialEntries={['/playlist/playlist1']}>
                <Routes>
                    <Route path="/playlist/:id" element={<PlaylistDetailPage />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            const alert = screen.getByRole('alert');
            // Vérifie le texte exact défini ligne 44 du composant
            expect(alert).toHaveTextContent("Playlist introuvable ou vide.");
        });
    });
    // ----------------------------------------------------------

    test('displays error message on fetchPlaylistById rejection (Network Crash)', async () => {
        // Simulation crash réseau (catch block)
        const crashError = new Error('API error occurred');
        spotifyApi.fetchPlaylistById.mockRejectedValue(crashError);
        
        // On "mute" console.error pour éviter de polluer la sortie du test
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        render(
            <MemoryRouter initialEntries={['/playlist/playlist1']}>
                <Routes>
                    <Route path="/playlist/:id" element={<PlaylistDetailPage />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            const alert = screen.getByRole('alert');
            expect(alert).toHaveTextContent(/api error occurred/i);
        });
        
        consoleSpy.mockRestore();
    });

    test("calls handleTokenError on api error", async () => {
        // Cas où l'API renvoie une erreur 401 (Token expired)
        const errorObj = { message: 'The access token expired', status: 401 };
        
        spotifyApi.fetchPlaylistById.mockResolvedValue({ 
            data: null, 
            error: errorObj 
        });

        // handleTokenError retourne true (indique qu'il a géré la redirection)
        handleTokenError.mockReturnValue(true);

        render(
            <MemoryRouter initialEntries={['/playlist/playlist1']}>
                <Routes>
                    <Route path="/playlist/:id" element={<PlaylistDetailPage />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
             // Pas d'erreur affichée car handleTokenError a intercepté
             expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });

        expect(handleTokenError).toHaveBeenCalledWith(errorObj, expect.any(Function));
    });
});