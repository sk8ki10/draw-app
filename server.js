const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const config = {
  apiKey: "AIzaSyDlcem2X9UbFxE20qozxvn1pBftoNbtJ2g",
  authDomain: "development-v-321909.firebaseapp.com",
  projectId: "development-v-321909",
  storageBucket: "development-v-321909.appspot.com",
  messagingSenderId: "751787708018",
  appId: "1:751787708018:web:46d2c272227bebba173ceb",
};

const firebase = require("firebase/app");

const {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  getDocs,
  query,
  where,
} = require("firebase/firestore");
const {
  getStorage,
  ref,
  getDownloadURL,
  uploadBytesResumable,
} = require("firebase/storage");

dotenv.config();

const app = express();

app.use(express.static("public"));

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

const starageApp = firebase.initializeApp(config);
const storage = getStorage(starageApp);
const database = getFirestore(app);

app.get("/hello", (req, res) => {
  return res.send("hello world").status(200);
});

app.post("/savedrawing", async (req, res) => {
  try {
    const { image } = req.body;
    const topic = req.body.topic;

    if (!image) {
      return res.status(400).json({ error: "Image data is required." });
    }

    // Convert base64 data to a buffer
    const buffer = Buffer.from(image, "base64");

    // Create a reference to the storage path (replace 'images' with your desired path)
    const storageRef = ref(storage, "images/" + Date.now() + ".png");

    // Upload the file
    const uploadTask = uploadBytesResumable(storageRef, buffer);

    // Wait for the upload to complete
    const snapshot = await uploadTask;

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref).then(
      (downloadURL) => {
        addFiles(downloadURL, "images/" + Date.now() + ".png", topic);
      }
    );

    res.status(200).json({ downloadURL });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).send("Internal Server Error");
  }
});

const files = collection(database, "files");

const addFiles = (imageLink, imageName, folderName) => {
  try {
    addDoc(files, {
      imageLink: imageLink,
      imageName: imageName,
      folderName: folderName,
    });
  } catch (err) {
    console.log(err);
  }
};

app.get("/fetchDocuments/:folderName", async (req, res) => {
  try {
    const folderName = req.params.folderName;

    const q = query(
      collection(database, "files"),
      where("folderName", "==", folderName)
    );
    const querySnapshot = await getDocs(q);

    const documents = [];
    querySnapshot.forEach((doc) => {
      documents.push(doc.data());
    });

    res.json({ success: true, documents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is listening at port ${port}`);
});
