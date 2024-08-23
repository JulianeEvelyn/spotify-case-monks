const APIController = (function () {
  const clientId = "32583b89109f45da929f775bd27ef959";
  const clientSecret = "e7d7d9f6be304d68a68bce598220d374";

  const _getToken = async () => {
    const result = await fetchToken(clientId, clientSecret);
    if (!result.ok) throw new Error("Failed to fetch token");
    const data = await result.json();
    return data.access_token;
  };

  const artistIds = [
    { name: "Ed Sheeran", id: "6eUKZXaKkcviH0Ku9w2n3V" },
    { name: "Queen", id: "1dfeR4HaWDbWqFHLkxsg1d" },
    { name: "Ariana Grande", id: "66CXWjxzNUsdJxJ2JdwvnR" },
    { name: "Maroon 5", id: "04gDigrS5kc9YWfZHwBETP" },
    { name: "Imagine Dragons", id: "53XhwfbYqKCa1cC15pYq2q" },
    { name: "Eminem", id: "7dGJo4pcD2V6oG8kP0tJRR" },
    { name: "Lady Gaga", id: "1HY2Jd0NmPuamShAr6KMms" },
    { name: "Coldplay", id: "4gzpq5DPGxSnKTe4SA8HAU" },
    { name: "Beyoncé", id: "6vWDO969PvNqNYHIOW5v0m" },
    { name: "Bruno Mars", id: "0du5cEVh5yTK9QJze8zA0C" },
    { name: "Rihanna", id: "5pKCCKE2ajJHZ9KAiaK11H" },
    { name: "Shakira", id: "0EmeFodog0BfCgMzAIvKQp" },
    { name: "Justin Bieber", id: "1uNFoZAHBGtllmzznpCI3s" },
    { name: "Demi Lovato", id: "6S2OmqARrzebs0tKUEyXyp" },
    { name: "Taylor Swift", id: "06HL4z0CvFAxyc27GXpf02" },
  ];

  const fetchToken = async (clientId, clientSecret) => {
    return fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(clientId + ":" + clientSecret),
      },
      body: "grant_type=client_credentials",
    });
  };

  const getArtistData = async (token, artist) => {
    const result = await fetchArtistData(token, artist.id);
    if (!result.ok) throw new Error(`Failed to fetch data for ${artist.name}`);
    return formatArtistData(await result.json(), artist.name);
  };

  const fetchArtistData = (token, artistId) => {
    return fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
    });
  };

  const formatArtistData = (data, name) => ({
    name: name,
    seguidores: data.followers.total,
    formattedSeguidores: formatFollowersCount(data.followers.total),
    popularidade: data.popularity,
    genres: data.genres,
    image: data.images.length > 0 ? data.images[0].url : "https://via.placeholder.com/70",
    url: data.external_urls.spotify,
  });

  const formatFollowersCount = (count) => {
    if (count >= 1e6) return (count / 1e6).toFixed(2) + "M";
    if (count >= 1e3) return (count / 1e3).toFixed(2) + "K";
    return count;
  };

  const filterAndSortPopArtists = (artists) => {
    return artists
      .filter((artist) => artist.genres.includes("pop"))
      .sort((a, b) => b.seguidores - a.seguidores);
  };

  const getTopGenres = (artists) => {
    const genreCounts = countGenres(artists);
    return getTopGenresData(genreCounts, artists);
  };

  const countGenres = (artists) => {
    return artists.reduce((acc, artist) => {
      artist.genres.forEach((genre) => {
        acc[genre] = (acc[genre] || 0) + 1;
      });
      return acc;
    }, {});
  };

  const getTopGenresData = (genreCounts, artists) => {
    return Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([genre, count]) => ({
        genre: genre,
        artistCount: count,
        artists: artists
          .filter((artist) => artist.genres.includes(genre))
          .sort((a, b) => b.seguidores - a.seguidores),
      }));
  };

  const updatePageWithPopArtistsAndGenres = async () => {
    try {
      const token = await _getToken();
      const artistsData = await fetchArtistsData(token, artistIds);
      renderPopArtists(filterAndSortPopArtists(artistsData));
      renderTopGenres(getTopGenres(artistsData));
    } catch (error) {
      console.error("Error updating page:", error);
    }
  };

  const fetchArtistsData = async (token, artistIds) => {
    const artistsData = await Promise.all(artistIds.map((artist) => getArtistData(token, artist)));
    return artistsData.filter(Boolean);
  };

  const renderPopArtists = (popArtists) => {
    const popArtistsContainer = document.getElementById("pop-artists");
    popArtistsContainer.innerHTML = popArtists.map(createArtistElement).join("");
  };

  const createArtistElement = (artist, index) => `
    <div class="pop-artist">
      <div class="artist-rank">${index + 1}</div>
      <a href="${artist.url}" target="_blank">
        <img class="artist-image" src="${artist.image}" alt="${artist.name}">
      </a>
      <div class="artist-info">
        <a href="${artist.url}" target="_blank" class="artist-name-link">
          <div class="artist-name">${artist.name}</div>
        </a>
        <div class="stats-line" data-full-value="${artist.seguidores}">${artist.seguidores} seguidores</div>
      </div>
      <div class="popularity-container">
        <div class="popularity-bar-wrapper">
          <div class="popularity-bar" style="width: ${artist.popularidade}%"></div>
        </div>
        <div class="popularity-score">
          <span class="popularity-score-main">${artist.popularidade}</span><span class="popularity-score-sub">/100</span>
        </div>
      </div>
    </div>
  `;

  const renderTopGenres = (topGenres) => {
    const commonGenresContainer = document.getElementById("common-genres");
    commonGenresContainer.innerHTML = topGenres.map(createGenreElement).join("");
  };

  const createGenreElement = (genre) => `
    <li class="genre-item">
      <div class="genre-name">${genre.genre}</div>
      <div class="artist-count">${genre.artistCount} artistas</div>
      <div class="artists-list">
        ${genre.artists.map(createGenreArtistElement).join("")}
      </div>
    </li>
  `;

  const createGenreArtistElement = (artist) => `
    <div class="artist-item">
      <img class="artist-image" src="${artist.image}" alt="${artist.name}">
      <div class="artist-info">
        <a href="${artist.url}" target="_blank" class="artist-name-link">
          <div class="artist-name">${artist.name}</div>
        </a>
        <div class="stats-line" data-full-value="${artist.seguidores}">${artist.formattedSeguidores} seguidores</div>
      </div>
    </div>
  `;

  return {
    updatePageWithPopArtistsAndGenres,
  };
})();

document.addEventListener("DOMContentLoaded", APIController.updatePageWithPopArtistsAndGenres);
