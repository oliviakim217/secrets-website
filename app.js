require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// Level #2 
// const encrypt = require("mongoose-encryption");
// Level #3
// const md5 = require("md5"); // For hashing
// Level #4
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
// Level #5
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({ // Tell the app to use the session package
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize()); // Initialize the passport package for authentication
app.use(passport.session()); // Tell the app to use passport to set up a session


// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



// Routes
app.get("/", function(req, res) {
    res.render("home");
});

app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/register", function(req, res) {
    res.render("register");
});

app.get("/secrets", function(req, res) {
    // If a user is already logged in, render the secrets page. If not, redirect them to the login page.
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});

app.post("/register", function(req, res) {
    // from the passport-local-mongoose package
    User.register({username: req.body.username}, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else { 
            passport.authenticate("local")(req, res, function() { // send a cookie and start a session
                res.redirect("/secrets");
            })
        }
    })
});

app.post("/login", function(req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err) { // from the passport package 
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function() { // send a cookie and start a session
                res.redirect("/secrets");
            })
        }
    });
});





app.listen(3000, function() {
    console.log("Server started on port 3000.");
});




