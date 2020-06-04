const clientId = 'd6b5237802054ba483d1262764c17c49';
const redirectUri = 'http://localhost:3000/';

//default variables to hold the user's access token info
let accessToken = undefined;
let expiresIn = undefined;

const Spotify = {

    // Get access token from Spotify
    getAccessToken() {
        //If the user's access token is already set, return its value
        if (accessToken) {
            return accessToken;
        }
        //Parse the URL and set values for your access token and expiration time
        //match() uses regular expressions (https://regexper.com/)
        const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
        const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);

        //If the access token and expiration time are in the URL:
        if (accessTokenMatch && expiresInMatch) {
            //set the access token value
            accessToken = accessTokenMatch[1];
            //set the access token to expire at the expiration time
            expiresIn = Number(expiresInMatch[1]);
            //clear the parameters, allowing us to grab a new access token when it expires
            window.setTimeout(() => accessToken = '', expiresIn * 1000);
            window.history.pushState('Access Token', null, '/');
            return accessToken;
      } else {
        const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUri}`;
        window.location = accessUrl;
      }
    },

    // Use the access token to return a response from Spotify API using words from SearchBar
    search(term) {
        const accessToken = Spotify.getAccessToken();
        return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }).then(response => {
          return response.json();
        }).then(jsonResponse => {
          if (!jsonResponse.tracks) {
            return [];
          }
          return jsonResponse.tracks.items.map(track => ({
            id: track.id,
            name: track.name,
            artist: track.artists[0].name,
            album: track.album.name,
            uri: track.uri
          }));
        });
    },

    //Get userID from Spotify, create new playlist on user's account, add tracks to user's playlist
    savePlaylist(name, trackUris) {
        //return if there aren't values in either arg
        if (!name || trackUris.length === 0 ) return;
        
        //default variables to hold the user ID, & playlist ID
        let userId = undefined;
        let playlistId = undefined;

        const headers = {
            Authorization: `Bearer $(accessToken)`
        };
        const userUrl = 'https://api.spotify.com/v1/me';

        //request user's Spotify username, store the ID
        fetch(userUrl, {headers: headers})
        .then(response => response.json())
        .then(jsonResponse => userId = jsonResponse.id)
        //use stored user ID to make a POST request to Spotify's create playlist endpoint, store playlist ID
		.then(() => {
			const createPlaylistUrl = `https://api.spotify.com/v1/users/${userId}/playlists`;
			fetch(createPlaylistUrl, {
				method: 'POST',
				headers: headers,
				body: JSON.stringify({
					name: name
				})
			})
			.then(response => response.json())
            .then(jsonResponse => playlistId = jsonResponse.id)
            //use stored ID to make a POST request to Spotify's add items to playlist endpoint
			.then(() => {
				const addPlaylistTracksUrl = `https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`;
				fetch(addPlaylistTracksUrl, {
					method: 'POST',
					headers: headers,
					body: JSON.stringify({
						uris: trackUris
					})
			  });
			})
		})
    }
};



export default Spotify;