var dotenv = require("dotenv");
const { ProxyAgent } = require("undici"); // Importer ProxyAgent

dotenv.config({ path: ".env.local" });

// Définir l'agent proxy
const proxyUrl = 'http://proxy.iutn.univ-poitiers.fr:3128';
const dispatcher = new ProxyAgent(proxyUrl);

/**
 * Encodes client ID and secret for Basic Auth.
 * @param {*} clientId 
 * @param {*} clientSecret 
 * @returns 
 */
function encodeBasicAuth(clientId, clientSecret) {
  return Buffer.from(clientId + ":" + clientSecret, "utf8").toString("base64");
}

/**
 * Generates an access token using client credentials.
 * @returns 
 */
function generateAccessToken() {
  var clientId = process.env.SPOTIFY_CLIENT_ID;
  var clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return Promise.reject(
      new Error(
        "Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in .env.local"
      )
    );
  }
  // La variable est définie ici (base64)
  var base64AuthString = encodeBasicAuth(clientId, clientSecret);
  
  return fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      // CORRECTION ICI: base664AuthString -> base64AuthString
      Authorization: "Basic " + base64AuthString,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    // Ajout du dispatcher pour le proxy
    dispatcher: dispatcher 
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (data.error) {
        console.error("Error fetching access token:", data.error);
        throw new Error("Error fetching access token: " + data.error.message);
      }
      return data.access_token;
    });
}

module.exports = {
  generateAccessToken,
};