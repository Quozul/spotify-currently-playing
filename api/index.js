import { config } from "dotenv";
config();

import express from "express";
import cors from "cors";

const clientId = process.env.SPOTIFY_ID;
const clientSecret = process.env.SPOTIFY_SECRET;
const redirect_uri = process.env.REDIRECT_URI;
const scopes = "user-read-playback-state";

export const authorizeUrl = new URL("https://accounts.spotify.com/authorize");
authorizeUrl.searchParams.set("response_type", "code");
authorizeUrl.searchParams.set("client_id", clientId);
authorizeUrl.searchParams.set("scope", scopes);
authorizeUrl.searchParams.set("redirect_uri", redirect_uri);

export const authorizationToken = btoa(clientId + ":" + clientSecret);

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.post("/token", (req, res) => {
  const { code } = req.body;

  const form = new URLSearchParams();
  form.set("code", code);
  form.set("redirect_uri", redirect_uri);
  form.set("grant_type", "authorization_code");

  fetch("https://accounts.spotify.com/api/token", {
    body: form.toString(),
    mode: "cors",
    method: "post",
    headers: {
      Authorization: "Basic " + authorizationToken,
      "content-type": "application/x-www-form-urlencoded",
    },
  })
    .then((res) => res.json())
    .then((json) => {
      res.send(json);
    });
});

app.post("/refresh", (req, res) => {
  const { refreshToken } = req.body;

  const form = new URLSearchParams();
  form.set("refresh_token", refreshToken);
  form.set("grant_type", "refresh_token");

  fetch("https://accounts.spotify.com/api/token", {
    body: form.toString(),
    mode: "cors",
    method: "post",
    headers: {
      Authorization: "Basic " + authorizationToken,
      "content-type": "application/x-www-form-urlencoded",
    },
  })
    .then((res) => res.json())
    .then((json) => {
      res.send(json);
    });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
