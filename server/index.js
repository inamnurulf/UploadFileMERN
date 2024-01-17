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
  const filename = req.file.originalname;

  const bufferStream = new stream.PassThrough();
  bufferStream.end(fileBuffer);

  const uploadStream = bucket.openUploadStream(filename, {
    chunkSizeBytes: 1024 * 1024,
    metadata: { field: "myField", value: "myValue" },
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
      const file = await bucket.find({ filename: req.params.filename });
  
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
  
      const downloadStream = bucket.openDownloadStreamByName(req.params.filename);
      downloadStream.pipe(res);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
  

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
