var express = require("express");
var bodyParser = require("body-parser");
var session = require("express-session");
var sharedSession = require("express-socket.io-session");

// App level initialisation
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var session = session({
    secret: 'come over to the dark side',
    resave: false,
    saveUninitialized: false
});
app.use(session);
io.use(sharedSession(session));
exports.io = io;
app.set('view engine', 'ejs');


// Proprietary module imports
var root = require("./apps/root");
var games = require("./apps/games");

// Register global middlewares
app.use(bodyParser.urlencoded({ extended: false }));

// Mount apps
app.use("/", root);
app.use("/games", games);

http.listen(3000, function() {
    console.log("Listening on *:3000");
});
