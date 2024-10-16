const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
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
    const userCollection = client.db("usersDb").collection("users");
    const menuCollection = client.db("menuDb").collection("menuCollection");
    const reviewsCollection = client
      .db("reviewsDb")
      .collection("reviewsCollection");

    const cartCollection = client.db("cartDb").collection("carts");

    // jwt related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // user related api

    // verify token middlewear
    const verifyToken = (req, res, next) => {
      console.log(req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access!" });
      }

      const token = req.headers.authorization.split(" ")[1];
      console.log(token);
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access!" });
        }

        // console.log(decoded);
        req.decoded = decoded;
      });
      next();
    };

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access!" });
      }

      next();
    };
    app.get("/users/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access!" });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      console.log(user);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }

      res.send({ admin });
    });

    // get users
    app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
      const result = await userCollection.find({}).toArray();
      res.send(result);
    });

    // delete an user
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    // update user
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };

      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    // post users
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({
          message: "User is already exist!",
          insertedId: null,
        });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

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
