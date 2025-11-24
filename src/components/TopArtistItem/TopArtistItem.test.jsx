// src/components/TopArtistItem.test.jsx (Mis à jour pour TDD)

import { describe, expect, test } from '@jest/globals';
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
// Assurez-vous que l'import est 'TopArtistItem' (export default)
import TopArtistItem from './TopArtistItem'; 

describe('TopArtistItem component', () => {
  test('renders artist information correctly with index starting at 1', () => {
    const artist = {
      id: 'artist1',
      name: 'Test Artist',
      images: [
        { url: 'test.jpg' },
        { url: 'test-medium.jpg' },
        { url: 'test-small.jpg' },
      ],
      genres: ['pop', 'rock'],
      followers: { total: 100 },
      popularity: 85,
      external_urls: { spotify: 'https://open.spotify.com/artist/artist1' },
    };
    const index = 0; // L'index reçu est 0

    render(<TopArtistItem artist={artist} index={index} />);

    // Verify list item rendering
    const listItem = screen.getByTestId(`top-artist-item-${artist.id}`);
    expect(listItem).toBeInTheDocument();

    // should contain artist image
    const img = within(listItem).getByAltText(artist.name);
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', artist.images[1].url);

    // --- VÉRIFICATION TDD ---
    // L'index 0 doit s'afficher comme "1. Test Artist"
    const expectedTitle = `${index + 1}. ${artist.name}`;
    const titleElement = within(listItem).getByText(expectedTitle);
    expect(titleElement).toBeInTheDocument();
    // --- FIN VÉRIFICATION ---

    // details assertions
    expect(listItem).toHaveTextContent(`Genres: ${artist.genres.join(', ')}`);
    expect(listItem)
      .toHaveTextContent(`Followers: ${artist.followers.total.toLocaleString()}`);
    expect(listItem).toHaveTextContent(`Popularity: ${artist.popularity}`);

    // link to artist page
    const link = within(listItem).getByRole('link', { name: /view artist/i });
    expect(link).toHaveAttribute('href', artist.external_urls.spotify);
  });

  test('handles missing artist image and correct index', () => {
    const artist = {
      id: 'artist2',
      name: 'No Image Artist',
      genres: ['jazz'],
      // images: [], // images est manquant ou vide
      followers: { total: 500 },
      external_urls: { spotify: 'https://open.spotify.com/artist/artist2' },
    };
    const index = 1; // L'index reçu est 1

    render(<TopArtistItem artist={artist} index={index} />);

    // Verify list item rendering
    const listItem = screen.getByTestId(`top-artist-item-${artist.id}`);
    expect(listItem).toBeInTheDocument();

    // should not contain artist image
    expect(within(listItem).queryByAltText(artist.name)).not.toBeInTheDocument();

    // --- VÉRIFICATION TDD ---
    // L'index 1 doit s'afficher comme "2. No Image Artist"
    const expectedTitle = `${index + 1}. ${artist.name}`;
    const titleElement = within(listItem).getByText(expectedTitle);
    expect(titleElement).toBeInTheDocument();
    // --- FIN VÉRIFICATION ---

    // details assertions
    expect(listItem).toHaveTextContent(`Genres: ${artist.genres.join(', ')}`);
    expect(listItem)
      .toHaveTextContent(`Followers: ${artist.followers.total.toLocaleString()}`);

    // link to artist page
    const link = within(listItem).getByRole('link', { name: /view artist/i });
    expect(link).toHaveAttribute('href', artist.external_urls.spotify);
  });
});