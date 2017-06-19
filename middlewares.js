var middlewares = {}


middlewares.auth = function(req, res, next) {
    if (req.session && req.session.user)
        return next();
    else
        return res.sendStatus(401);
};

module.exports = middlewares;
