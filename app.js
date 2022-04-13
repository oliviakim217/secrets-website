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
// Level #6
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require("mongoose-findorcreate");


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
    password: String,
    googleId: String,
    facebookId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
}); 

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

// Set up Google Strategy to help Google recognize the app which is set up in the Google dashboard.
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


// Set up Facebook Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


// Home Route
app.get("/", function(req, res) {
    res.render("home");
});

// Google Log In & Register Route
app.get("/auth/google", 
    // Use passport to authenticate users using the Google Strategy
    passport.authenticate("google", { scope: ['profile'] }) // Request for user's profile (id & email) to Google
);

// Route where Google will sends users to after authentication (Path set up in Google)
app.get("/auth/google/secrets", 
    // Authenticate users locally and save their login session
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  });

// Facebook Log In & Register Route
app.get("/auth/facebook",
  passport.authenticate("facebook"));

app.get("/auth/facebook/secrets",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  });


// Log In Page 
app.get("/login", function(req, res) {
    res.render("login");
});

// Register Page
app.get("/register", function(req, res) {
    res.render("register");
});

// Secrets Page Route
app.get("/secrets", function(req, res) {
    // If a user is already logged in, render the secrets page. 
    // If not, redirect them to the login page.
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

// Log Out Route
app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});

// Register with Email Route
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

// Log In with Email Route
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




