const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());

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

    // create collections
    const menuCollection = client.db("menuDb").collection("menuCollection");
    const reviewsCollection = client
      .db("reviewsDb")
      .collection("reviewsCollection");

    const cartCollection = client.db("cartDb").collection("carts");

    // menu crud
    app.get("/menu", async (req, res) => {
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
      res.send({ totalMenu });
    });
    // reviews crud
    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    });

    // carts
    app.get("/carts", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/carts", async (req, res) => {
      const cart = req.body;
      const result = await cartCollection.insertOne(cart);
      res.send(result);
    });
    app.delete("/carts/:id", async (req, res) => {
      const id = req.params;

      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
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
