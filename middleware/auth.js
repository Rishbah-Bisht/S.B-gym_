module.exports = {
    ensureAuthenticated: function (req, res, next) {
        if (req.session.adminId) {
            return next();
        }
        res.redirect('/login');
    }
};
