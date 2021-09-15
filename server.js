require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const env = process.env.NODE_ENV || "development";
const config = require("./config/" + env + ".js");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(session({
    secret: process.env.SESSION_SECRET.split(","),
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Connect to database. When connected, starts the server.
app.on("ready", function () {
    app.listen(process.env.PORT || 3000, function () {
        console.log("Server is running...");
    });
})
config.database.connect("user");
mongoose.connection.once("open", function () {
    app.emit("ready");
});

// Constructing schema
const userSchema = new mongoose.Schema({
    googleId: String,
    displayName: String,
    secrets: [String]
});

// Plugins and middlewares
userSchema.plugin(passportLocalMongoose);

// Creating model
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
}, function (accessToken, refreshToken, profile, done) {
    User.findOne({ googleId: profile.id }, function (err, user) {
        if (err) {
            console.log(err);
        } else {
            if (!user) {
                const user = new User({
                    googleId: profile.id,
                    displayName: profile.displayName
                })
                user.save(function (err, user) {
                    (err) ? log.error(err) : console.log("Success");
                })
            } else {
                return done(err, user);
            }
        }
    })
}));

app.get("/", function (req, res) {
    res.render("home");
})

app.get("/auth/google", passport.authenticate("google", { scope: ["profile"] }));

app.get("/auth/google/callback", passport.authenticate('google', { failureRedirect: "/login" }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect("/secrets");
    });

app.get("/login", function (req, res) {
    res.render("login");
})

app.get("/register", function (req, res) {
    res.render("register");
})

app.post("/register", function (req, res) {
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.render("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });
})

app.post("/login", function (req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })
    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });
})

app.get("/secrets", function (req, res) {
    if (req.isAuthenticated()) {
        User.find({ secrets: { $ne: null }}, function (err, users) {
            if (err) {
                console.log(err);
            } else {
                res.render("secrets", { users: users });
            }
        })
    } else {
        res.redirect("/login");
    }
})

app.get("/logout", function (req, res) {
    req.logout();
    res.render("home");
})

app.get("/submit", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
})

app.post("/submit", function (req, res) {
    const secret = req.body.secret;
    if (secret !== "") {
        User.findById(req.user.id, function (err, user) {
            if (err) {
                console.log(err);
            } else {
                if (user) {
                    user.secrets.push(secret);
                    user.save(function () {
                        res.redirect("/secrets")
                    })
                }
            }
        })
    }
})