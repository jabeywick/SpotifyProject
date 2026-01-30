import 'dotenv/config';
import fetch from 'node-fetch';
import express from 'express';
import puppeteer from "puppeteer";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.static('public'));

let cachedAccessToken = null;
let tokenExpiresAt = 0;

function accessTokenStillValid() {
  return cachedAccessToken && Date.now() < tokenExpiresAt;
}

function cacheToken(token, expiresInSeconds) {
  cachedAccessToken = token;
  tokenExpiresAt = Date.now() + (expiresInSeconds - 60) * 1000;
}

async function fetchWebApi(endpoint, method, body, token) {
  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method,
    body:JSON.stringify(body)
  });
  return await res.json();
}

async function getTopArtists(token){
  return (await fetchWebApi(
    'v1/me/top/artists?time_range=short_term&limit=3', 'GET', undefined, token
  )).items;
}

async function getTopTracks(token) {
  return (
    await fetchWebApi(
      "v1/me/top/tracks?time_range=short_term&limit=5",
      "GET",
      undefined,
      token
    )
  ).items;
}

async function getAccessToken() {
  if (accessTokenStillValid()) {
    console.log('Using cached access token');
    return cachedAccessToken;
  }

  console.log('Refreshing access token');

  const credentials = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: process.env.SPOTIFY_REFRESH_TOKEN
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Token refresh failed: ${errorText}`);
  }

  const data = await res.json();

  cacheToken(data.access_token, data.expires_in);
  return data.access_token;
}

app.get("/api/top-artists", async (req, res) => {
  try {
    const token = await getAccessToken();
console.log("Access token acquired");
    const artists = await getTopArtists(token);
    res.json(artists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch top artists" });
  }
});

app.get("/api/top-tracks", async (req, res) => {
  try {
    const token = await getAccessToken();
    console.log("Access token acquired");
    const tracks = await getTopTracks(token);
    res.json(tracks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch top artists" });
  }
});

app.get("/api/refresh-ui", async (req, res) => {
  try {
    await captureUIScreenshot();
    res.json({ success: true, message: "UI update triggered" });
  } catch (err) {
    res.status(500).json({ error: "UI update failed" });
  }
});

const { exec } = require("child_process");

async function captureUIScreenshot() {

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    executablePath: '/usr/bin/chromium'
  });

  const page = await browser.newPage();

  await page.setViewport({ width: 480, height: 800 });

  await page.goto(`http://localhost:${PORT}`, { waitUntil: "networkidle0" });

await page.waitForSelector(".artist-card", { timeout: 5000 }).catch(() => {
  console.log("Cards didn't load in time, taking screenshot anyway...");
});

await page.screenshot({ path: "screenshot.png" });
  await browser.close();
  console.log("Screenshot saved.");

  exec("python3 displayDriver.py", (error) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    console.log("Display updated");
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});