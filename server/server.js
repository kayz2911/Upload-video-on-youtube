const express = require("express");
const { google } = require("googleapis");
const fs = require("fs");
const cors = require("cors");
const multer = require("multer");
const url = require("url");
const cookieParser = require("cookie-parser");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

const CLIENT_ID =
  "949572342715-n6t6vd6p9kkb6gnl1p68vep2gdmr3kh1.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "http://localhost:8000/oauth2callback";

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, "./videos");
  },
  filename(req, file, callback) {
    const newFileName =
      file.fieldname + "_" + Date.now() + "_" + file.originalname;

    callback(null, newFileName);
  },
});

const uploadVideoFile = multer({
  storage: storage,
}).single("videoFile");

app.get("/", (req, res) => {
  res.send("abc");
});

app.post("/upload", uploadVideoFile, (req, res) => {
  if (req.file) {
    const fileName = req.file.filename;
    const { title, description } = req.body;

    if (oauth2Client.credentials && (oauth2Client.credentials.access_token || oauth2Client.credentials.refresh_token)) {
      const youtube = google.youtube({
        version: "v3",
        auth: oauth2Client,
      });

      youtube.videos.insert(
        {
          resource: {
            snippet: { title, description },
            status: { privacyStatus: "public" },
          },
          part: "snippet,status",
          media: {
            body: fs.createReadStream("videos/" + fileName),
          },
        },
        (err, data) => {
          if (err) throw err;
          console.log("Uploading video done");
        }
      );

      const authorizationUrl = "http://localhost:3000/uploadVideo";

      res.json({ authorizationUrl });
    } else {
      const scopes = ["https://www.googleapis.com/auth/youtube"];

      const authorizationUrl = oauth2Client.generateAuthUrl({
        // 'online' (default) or 'offline' (gets refresh_token)
        access_type: "offline",
        /** Pass in the scopes array defined above.
         * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
        scope: scopes,
        // Enable incremental authorization. Recommended as a best practice.
        include_granted_scopes: true,
        state: JSON.stringify({ fileName, title, description }),
      });

      res.json({ authorizationUrl });
    }
  }
});

app.get("/oauth2callback", async (req, res) => {
  let q = url.parse(req.url, true).query;

  let { fileName, title, description } = JSON.parse(q.state);

  let { tokens } = await oauth2Client.getToken(q.code);
  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  });

  const youtube = google.youtube({
    version: "v3",
    auth: oauth2Client,
  });

  youtube.videos.insert(
    {
      resource: {
        snippet: { title, description },
        status: { privacyStatus: "public" },
      },
      part: "snippet,status",
      media: {
        body: fs.createReadStream("videos/" + fileName),
      },
    },
    (err, data) => {
      if (err) throw err;
      console.log("Uploading video done");
    }
  );

  res.redirect("http://localhost:3000/uploadVideo");
});

app.listen(8000, (req, res) => {
  console.log("App is listening on port 8000");
});
