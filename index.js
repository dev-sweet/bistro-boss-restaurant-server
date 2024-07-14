const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.irhxabj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const menuCollection = client.db("menuDb").collection("menuCollection");
    const reviewsCollection = client
      .db("reviewsDb")
      .collection("reviewsCollection");

    // menu crud
    app.get("/menu", async (req, res) => {
      console.log(req.query.category);
      if (req.query.category) {
        const cursor = { category: req.query.category };
        const result = await menuCollection.find(cursor).toArray();
        return res.send(result);
      }
      const result = await menuCollection.find().toArray();
      res.send(result);
    });

    app.get("/totalMenu", async (req, res) => {
      const menu = await menuCollection.find().toArray();
      const totalMenu = menu.length;
      console.log(totalMenu);
      res.send({ totalMenu });
    });
    // reviews crud
    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// app default route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Bistro Boss server is running at port: ${port}`);
});
