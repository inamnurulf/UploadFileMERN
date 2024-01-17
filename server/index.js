const express = require("express");
const multer = require("multer");
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const stream = require("stream");
const cors = require('cors')


const app = express();
const port = 3000;
const mongoURI = "mongodb://localhost:27017/test2";

const conn = mongoose.createConnection(mongoURI);
const bucket = new mongodb.GridFSBucket(conn, { bucketName: "files" });

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
app.use(cors())

app.post("/upload", upload.single("file"), (req, res) => {
  const fileBuffer = req.file.buffer;

  // Generate a timestamp to be used as the filename
  const timestamp = new Date().getTime();
  const filename = `${timestamp}_${req.file.originalname}`;

  const bufferStream = new stream.PassThrough();
  bufferStream.end(fileBuffer);

  const uploadStream = bucket.openUploadStream(filename, {
    chunkSizeBytes: 1024 * 1024
  });

  bufferStream.pipe(uploadStream);

  uploadStream.on("error", (error) => {
    console.error(error);
    res.status(500).send("Internal Server Error");
  });

  uploadStream.on("finish", () => {
    res.status(200).send("File uploaded successfully");
  });
});

app.get("/file/:filename", async (req, res) => {
  try {
    const file = bucket.find({ filename: req.params.filename });

    let fileFound = false;

    for await (const doc of file) {
      if (doc) {
        const downloadStream = bucket.openDownloadStreamByName(req.params.filename);
        downloadStream.pipe(res);
        fileFound = true;
        break; // Stop the loop once the file is found
      }
    }

    if (!fileFound) {
      return res.status(404).json({ message: "File not found" });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/allFiles", async (req, res) => {
  try {
    const files = await bucket.find({}).toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({ message: "No files found" });
    }

    const fileNames = files.map(file => file.filename);
    res.status(200).json({ fileNames });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

  

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
