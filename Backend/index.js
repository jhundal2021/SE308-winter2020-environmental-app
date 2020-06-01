// https://jonathanmh.com/express-passport-json-web-token-jwt-authentication-beginners/
const _ = require("lodash");
const express = require("express");
const bodyParser = require("body-parser");
//const jwt = require("jsonwebtoken");
const port = 8080;

const firebase = require("./firebase");
let FIREBASE;

const app = express();

// this is what we will actually use
// this will receive a "raw json" string from Android
// it allows for around two 32-character (UTF8) fields, with their
// corresponding json characters.
// The limit is meant prevent an injection
app.use(
  bodyParser.json({
    limit: "500kb",
  })
);

app.get("/", function (req, res) {
  res.json({
    message: "Express is up!",
  });
});

// Used to create a new user
app.post("/users", async function (req, res) {
  if (!req.body || !req.body.token || !req.body.email) {
    res.status(401).json({
      message: "Missing body, token, or email",
    });
  }

  let uid = await FIREBASE.getUIDFromToken(req.body.token);
  let user = await FIREBASE.getUserByUUID(uid);

  if (user) {
    res.json({
      message: "User already exists",
    });
  } else {
    try {
      await FIREBASE.createUser(uid, req.body.email);
      res.json({
        message: `New user added to users collection`,
      });
    } catch (err) {
      res.status(401).json({
        message: "Add User Error",
      });
      console.log("Add User Error");
    }
  }
});

/**
 * Returns a json of the friends list associated with the user token
 */
app.get("/friends/:id", async function (req, res) {
  if (!req.params || !req.params.id) {
    res.send("No ID provided");
    return;
  }
  try {
    let friends = await FIREBASE.getFriends(req.params.id);
    if (!friends) {
      console.log("Friends List Not Found");
      res.status(401).json({
        message: "Friends List Not Found",
      });
    }

    res.json(friends);
  } catch (err) {
    console.log("Friends List Lookup Error");
    res.status(401).json({
      message: "Friends List Lookup Error",
    });
    console.log(err);
  }
});

/**
 * Searches for a user by email and adds that to the friends list of the provided
 * id. Returns a JSON representing the friend.
 */
app.post("/friends", async function (req, res) {
  console.log("Attempting to add friend!");
  if (!req.body || !req.body.token || !req.body.friendUsername) {
    console.log(req.body.friendUsername);
    res.send("No req.body, token or friend username provided");
    return;
  }
  try {
    console.log("JSON constructed properly for friend, adding now");
    let friend = await FIREBASE.addFriend(
      req.body.token,
      req.body.friendUsername
    );
    if (!friend) {
      console.log("Friend Not Found");
      res.status(401).json({
        message: "Friend Not Found",
      });
      return;
    }

    // Returns a json of the new friend added
    res.json(friend);
  } catch (err) {
    console.log("Add Friend Error");
    res.status(401).json({
      message: "Add Friend Error",
    });
    console.log(err);
  }
});

/**
 * Updates a score associated with the user
 */
app.put("/users/score", async function (req, res) {
  if (!req.body || !req.body.token || req.body.score) {
    res.status(401).json({
      message: "No req.body, token, or score present",
    });
  }
  try {
    await FIREBASE.updateScore(req.body.token, req.body.score);
    res.json({
      message: `User score updated`,
    });
  } catch (err) {
    res.status(401).json({
      message: "Update score error",
    });
    console.log(err);
  }
});

app.get("/products/:id", async function (req, res) {
  console.log("barcode scan request received");
  if (!req.params || !req.params.id) {
    res.send("No Barcode provided");
    console.log("No barcode provided");
  } else if (req.params.id) {
    try {
      // checks the database and then determines if the passwords match
      console.log("product lookup attempt");
      let product = await FIREBASE.getProduct(req.params.id);

      if (!product) {
        res.status(401).json({
          message: "Product Not Found",
        });
        console.log("product not found");
      }

      // Returns a json of the product scanned
      res.json(product);

      console.log("ok");
    } catch (err) {
      res.status(401).json({
        message: "Product Lookup Error",
      });
      console.log(err);
    }
  }
});

// Batch write products to the server (max 500 products)
app.post("/products", async function (req, res) {
  if (!req.body || !req.body.products) {
    res.status(401).json({
      message: "No req.body or req.body.products present",
    });
  }

  try {
    await FIREBASE.productBatchWrite(req.body.products);
    res.json({
      message: `Product batch write successful`,
    });
  } catch (err) {
    res.status(401).json({
      message: "Product Batch Write Error",
    });
    console.log(err);
  }
});

// Used to add/update a product
app.put("/products/:id", async function (req, res) {
  if (!req.params || !req.params.id || !req.body) {
    res.status(401).json({
      message: "No req.params.id or req.body present",
    });
  }

  try {
    let newId = await FIREBASE.updateProduct(req.params.id, req.body);
    res.json({
      message: `Product ${newId} is added/updated`,
    });
  } catch (err) {
    res.status(401).json({
      message: "Update Product Error",
    });
    console.log(err);
  }
});

app.listen(port, function () {
  console.log("Express running");

  // Initializes the firebase object, which makes the connection to firebase
  FIREBASE = new firebase.Firebase();
});
