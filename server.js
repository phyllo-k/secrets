require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const env = process.env.NODE_ENV || "development";
const config = require("./config/" + env + ".js");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

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
    username: String,
    password: String
});

// Plugins and middlewares
userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

// Creating model
const User = mongoose.model("User", userSchema);


app.get("/", function (req, res) {
    res.render("home");
})

app.get("/login", function (req, res) {
    res.render("login");
})

app.get("/register", function (req, res) {
    res.render("register");
})

app.post("/register", function (req, res) {
    User.findOne({ username: req.body.username }, function (err, user) {
        if (err) {
            res.send(err);
        } else {
            if (!user) {
                const user = new User({
                    username: req.body.username,
                    password: req.body.password
                });
                user.save(function (err) {
                    err ? res.send(err) : res.render("secrets");
                })
            } else {
                console.log("Error: Username already existed.")
                res.redirect("/register");
            }
        }
    })
})

app.post("/login", function (req, res) {
    User.findOne({ username: req.body.username }, function (err, user) {
        if (err) {
            res.send(err);
        } else {
            if (user) {
                if (user.password === req.body.password) {
                    res.render("secrets");
                }
            }
        }
    })
})