var express = require("express");
var ejs = require("ejs");

var router = express.Router();

var authMiddleware = require("../middlewares").auth;

// Initialize users
var users = {};

// Route handlers
router.get("/", function(req, res) {
  // If logged in user
  if (req.session && req.session.user) {
    // Redirect to games listing
    res.redirect("/games");
  } else {
    // Redirect to login
    res.redirect("/login");
  }
});

router.route('/register')
  .get(function(req, res) {
    res.render("register");
  }).post(function(req, res) {
    username = req.body.username;
    password = req.body.password;
    if (username in users) {
      res.render("register", {error: "That username is already taken!"});
    } else {
      // Push new user in
      users[username] = password;
      // Redirect to login
      res.redirect("/login");
    }
});

router.route("/login")
  .get(function(req, res) {
    res.render("login");
  })
  .post(function(req, res) {
    // Authenticate credentials
    username = req.body.username;
    password = req.body.password;
      if (username in users) {
        if (password === users[username]) {
        // Log the user in
        req.session.user = username;
        // Redirect to home page
        res.redirect("/");
      } else
        res.render("login", {error: "Invalid credentials!"});
    } else
        res.render("login", {error: "User does not exist!"});
});

router.get("/logout", authMiddleware, function(req, res) {
  // Unset the session
  req.session.destroy(function(err) {
  // Redirect to homepage
  res.redirect("/");
  });
});

module.exports = router;
