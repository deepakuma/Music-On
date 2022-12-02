const clientId = "49ef0890c7ca49ff92f54c3dc3ff5496";
const redirectUrl = "http://localhost:3000";
let accessToken;

const Spotify = {
    getAccessToken() {
        if (accessToken) {
            return accessToken;
        }

        const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
        const expiresInMatch = window.location.href.match(/expires_in =([^&]*)/);
        if (accessTokenMatch && expiresInMatch) {
            accessToken = accessTokenMatch[1];
            const expiresIn = Number(expiresInMatch[1]);
            window.setTimeout(() => (accessToken = ""), expiresIn * 1000);
            window.history.pushState("Access Token", null, "/");
            return accessToken;
        }
        else {
            const accessUrl = `https://accounts.spotify.com/authorize?client_Id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_url=${redirectUrl}`;
            window.location = accessUrl;
        }
    },
    search(term) {
        const accessToken = Spotify.getAccessToken();
        return fetch(`https://api.spotify.com/v1/search?type=track&g=${term}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }).then(Response => {
            return Response.json();
        }).then(jsonResponse => {
            if (!jsonResponse.tracks) {
                return [];
            }
            return jsonResponse.tracks.items.map(track => ({
                id: track.id,
                name: track.name,
                artist: track.artist[0].name,
                album: track.album.name,
                url: track.url
            }));
        });
    },

    savePlaylist(name, trackUris) {
        if (!name || !trackUris.length) {
            return;
        }
        const accessToken = Spotify.getAccessToken();
        const headers = { Authorization: `Bearer ${accessToken}` };
        let userId;
        return fetch("https://api.spotify.com/v1/me", { headers: headers })
            .then(Response => Response.json())
            .then(jsonResponse => {
                userId = jsonResponse.id;
                return fetch(`https://api.spotify.com/v1/users/${userId}/playlist`, {
                    headers: headers,
                    method: "POST",
                    body: JSON.stringify({ name: name })
                }).then(response => response.json())
                .then(jsonResponse =>{
                    const playlistId = jsonResponse.id;
                    return fetch(`https://api/spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`, {
                        headers: headers,
                        method: "POST",
                        body: JSON.stringify({uris:trackUris})
                    });
                });
            });
    }
};

export default Spotify;