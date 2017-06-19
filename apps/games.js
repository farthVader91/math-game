var express = require("express");
var authMiddleware = require("../middlewares").auth;
var math = require("mathjs");

// App level initialization
var counter = 0;
var games = [];
var router = express.Router();

// App level middleware
router.use(authMiddleware);

// define the games endpoint.
router.route("/")
    .get(function (req, res) {
        res.render("games", {games: games});
    })
    .post(function (req, res) {
        game = {
            id: ++counter,
            players: [],
            started: false,
            completed: false
        };
        games.push(game);
        res.redirect("/games/" + counter);
    });

router.get("/:gameId", function (req, res) {
  // Join a game
  game = games.find(e => e.id == parseInt(req.params.gameId));
  // Check if game exists and not started
  // Check for player limit
  if (game == undefined || game.started || game.players.length >= 4) {
    res.redirect("/games");
  }
  user = req.session.user;
  // Render game page
  res.render("room", {game: game});
});


// Game utilities
var questions = [
    '5 + 3',
    '1.2 * (2 + 4.5)',
    '5.08 cm to inch',
    'sin(45 deg) ^ 2',
];

var genQ = function() {
    return questions[Math.floor(Math.random() * questions.length)];
};

var isCorrect = function(payload) {
    return parseFloat(payload.answer) == math.round(math.eval(payload.question), 2);
}

// WebSocket handlers
var io = require("../server").io;
io.on("connection", function(socket) {

    // Handler to join room
    socket.on("join room", function(room) {
      console.log("a user joined");
      socket.join(room);
      user = socket.handshake.session.user;
      game = games.find(e => e.id == parseInt(room));
      // Push if not pushed
      if (game.players.indexOf(user) == -1)
          game.players.push(user);
      io.to(room).emit("players changed", game.players);
    });

    // Handler to start game
    socket.on("start game", function(room) {
        game = games.find(e => e.id == parseInt(room));
        game.started = true;
        // Send out new question
        io.to(room).emit("question pushed", genQ());
    });

    // Handler for answer attempts
    socket.on("answer", function(payload) {
        user = socket.handshake.session.user;
        game = games.find(g => g.players.indexOf(user) != -1);
        // Validate answer
        if (!game.completed && isCorrect(payload)) {
            game.completed = true;
            // Append to message log
            io.to(game.id).emit("message", "Player &lt;" + user + "&gt; is the winner!");
            io.to(game.id).emit("end game");
            // Remove game from list
            console.log("delisting game");
            idx = games.indexOf(game);
            if (idx > -1)
              games.splice(idx, 1);
            console.log(games);
        } else
            io.to(game.id).emit("message", "Player &lt;" + user + "&gt; has attempted!");
        //
    });

    socket.on("disconnect", function() {
      console.log("a user left");
      user = socket.handshake.session.user;
      // Remove user from game room
      game = games.find(g => g.players.indexOf(user) != -1);
      if (!game)
        return;
      console.log("delisting game");
      game.players.splice(game.players.indexOf(user), 1);
      io.to(game.id).emit("players changed", game.players);
      // Remove game if all players left
      if (game.players.length == 0) {
        idx = games.indexOf(game);
        if (idx > -1)
          games.splice(idx, 1);
      }
    });
});


module.exports = router;
