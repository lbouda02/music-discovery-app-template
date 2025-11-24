// src/components/PlayListItem/PlayListItem.test.jsx

import { describe, expect, test, jest, afterEach } from '@jest/globals';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import PlayListItem from './PlayListItem';

// 1. On mock useNavigate pour éviter l'erreur de contexte Router
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

describe('PlayListItem component', () => {
    // Données de test
    const playlist = {
        id: 'playlist1',
        name: 'Test Playlist',
        images: [{ url: 'test.jpg' }],
        owner: { display_name: 'Test Owner' },
        tracks: { total: 15 },
        external_urls: { spotify: 'https://open.spotify.com/playlist/playlist1' }
    };

    // Nettoyage
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('renders playlist information correctly', () => {
        render(<PlayListItem playlist={playlist} />);

        expect(screen.getByTestId(`playlist-item-${playlist.id}`)).toBeInTheDocument();
        expect(screen.getByAltText('cover')).toHaveAttribute('src', playlist.images[0].url);
        expect(screen.getByText(playlist.name)).toBeInTheDocument();
        expect(screen.getByText(`By ${playlist.owner.display_name}`)).toBeInTheDocument();
        expect(screen.getByText(`${playlist.tracks.total} tracks`)).toBeInTheDocument();
        
        const link = screen.getByRole('link', { name: /open/i });
        expect(link).toHaveAttribute('href', playlist.external_urls.spotify);
    });

    test('navigates to playlist detail page when clicked', () => {
        render(<PlayListItem playlist={playlist} />);

        // On simule le clic sur l'image
        fireEvent.click(screen.getByAltText('cover'));

        // C'est ici que vous aviez l'erreur de syntaxe
        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/playlist/playlist1');
    });

    test('does NOT navigate internally when clicking the external "Open" link', () => {
        render(<PlayListItem playlist={playlist} />);

        // On clique sur le lien externe
        const link = screen.getByRole('link', { name: /open/i });
        fireEvent.click(link);

        // La navigation interne ne doit pas se déclencher
        expect(mockNavigate).not.toHaveBeenCalled();
    });
});