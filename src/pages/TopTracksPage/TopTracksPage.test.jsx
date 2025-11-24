import { describe, expect, test, beforeEach, afterEach, jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import TopTracksPage, { limit, timeRange } from './TopTracksPage.jsx';
import * as spotifyApi from '../../api/spotify-me.js';
import { KEY_ACCESS_TOKEN } from '../../constants/storageKeys.js';
import { buildTitle } from '../../constants/appMeta.js';
// Import de la fonction utilitaire pour pouvoir la mocker
import { handleTokenError } from '../../utils/handleTokenError.js';

// --- MOCKS ---
// On mock handleTokenError pour contrôler la redirection dans les tests
jest.mock('../../utils/handleTokenError.js');

// Données simulées pour les pistes
const tracksData = {
    items: [
        { id: 'track1', name: 'Track One', artists: [{ name: 'Artist A' }], album: { name: 'Album X', images: [{ url: 'album-x.jpg' }] }, popularity: 80, external_urls: { spotify: 'http://link1' } },
        { id: 'track2', name: 'Track Two', artists: [{ name: 'Artist B' }], album: { name: 'Album Y', images: [{ url: 'album-y.jpg' }] }, popularity: 75, external_urls: { spotify: 'http://link2' } },
    ],
    total: 2
};

const tokenValue = 'test-token';

describe('TopTracksPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock localStorage pour simuler un token présent
        jest.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation((key) => key === KEY_ACCESS_TOKEN ? tokenValue : null);

        // Par défaut : API réussie
        jest.spyOn(spotifyApi, 'fetchUserTopTracks').mockResolvedValue({ data: tracksData, error: null });
        
        // Par défaut : handleTokenError retourne false (signifie qu'il n'a pas redirigé)
        handleTokenError.mockReturnValue(false);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // Helper pour rendre le composant avec le Router
    const renderTopTracksPage = () => {
        return render(
            <MemoryRouter initialEntries={['/top-tracks']}>
                <Routes>
                    <Route path="/top-tracks" element={<TopTracksPage />} />
                    {/* Route fictive pour vérifier la redirection */}
                    <Route path="/login" element={<div>Login Page</div>} />
                </Routes>
            </MemoryRouter>
        );
    };

    // Helper pour attendre la fin du chargement
    const waitForLoadingToFinish = async () => {
        // Si le loader est présent, on attend qu'il disparaisse
        if (screen.queryByTestId('loading-indicator')) {
             await waitFor(() => {
                expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
            });
        }
    };

    test('renders top tracks page successfully', async () => {
        renderTopTracksPage();
        
        // Vérifie le titre du document
        expect(document.title).toBe(buildTitle('Top Tracks'));
        
        await waitForLoadingToFinish();

        // Vérifie l'appel API
        expect(spotifyApi.fetchUserTopTracks).toHaveBeenCalledWith('test-token', limit, timeRange);

        // Vérifie la présence du titre (Heading H1)
        const heading = await screen.findByRole('heading', { level: 1, name: `Your Top ${tracksData.total} Tracks of the Month` });
        expect(heading).toBeInTheDocument();

        // Vérifie que les pistes sont rendues
        for (const track of tracksData.items) {
            expect(await screen.findByTestId(`track-item-${track.id}`)).toBeInTheDocument();
        }
    });

    test('displays error message on fetchUserTopTracks API error', async () => {
        // Simulation : L'API répond mais avec un objet error (ex: 500 ou 404)
        jest.spyOn(spotifyApi, 'fetchUserTopTracks').mockResolvedValue({ 
            data: null, 
            error: { message: 'Failed to fetch top tracks' } 
        });

        renderTopTracksPage();
        await waitForLoadingToFinish();

        // Vérifie l'affichage de l'alerte
        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('Failed to fetch top tracks');
    });

    test('displays error message on fetchUserTopTracks network crash', async () => {
        // Simulation : Crash réseau (promesse rejetée)
        jest.spyOn(spotifyApi, 'fetchUserTopTracks').mockRejectedValue(new Error('Network error'));
        
        // On désactive temporairement console.error pour garder les logs propres
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        renderTopTracksPage();
        await waitForLoadingToFinish();

        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('Network error');
        
        consoleSpy.mockRestore();
    });

    test('redirects to login on token expiration', async () => {
        // 1. Simulation API : Retourne une erreur de token (ex: 401)
        jest.spyOn(spotifyApi, 'fetchUserTopTracks').mockResolvedValue({ 
            data: null, 
            error: { message: 'The access token expired', status: 401 } 
        });

        // 2. Simulation handleTokenError :
        // On implémente le mock pour qu'il appelle 'navigate' vers '/login' et retourne 'true'
        handleTokenError.mockImplementation((error, navigate) => {
            navigate('/login');
            return true; // Indique au composant que l'erreur a été gérée
        });

        renderTopTracksPage();
        await waitForLoadingToFinish();

        // 3. Vérification : Le composant doit avoir redirigé vers la route /login
        // Le texte "Login Page" provient de la <Route path="/login" ... /> définie dans renderTopTracksPage
        expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    test('verify styling and accessibility attributes using role', async () => {
        renderTopTracksPage();
        await waitForLoadingToFinish();

        // Vérifie la section container
        const region = screen.getByRole('region', { name: `Your Top ${tracksData.total} Tracks of the Month` });
        expect(region).toHaveClass('tracks-container', 'page-container');

        // Vérifie le titre
        const heading1 = screen.getByRole('heading', { level: 1, name: `Your Top ${tracksData.total} Tracks of the Month` });
        expect(heading1).toHaveClass('tracks-title', 'page-title');
        
        // Vérifie la liste
        const list = screen.getByRole('list');
        expect(list).toHaveClass('tracks-list');
    });
});