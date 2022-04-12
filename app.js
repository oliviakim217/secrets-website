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
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));


// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});

const User = mongoose.model("User", userSchema);




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

app.post("/register", function(req, res) {
    // Generate salt and hash password. 
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        // Then store hash in DB.
        const newUser = new User ({
            email: req.body.username,
            password: hash
        });
        newUser.save(function(err) {
            if (!err) {
                res.render("secrets");
            } else {
                console.log(err);
            }
        });
    });
});

app.post("/login", function(req, res) {
    User.findOne({email: req.body.username}, function(err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            console.log(foundUser);
            if (foundUser) { // check to see if there was a found user.
                // Compare the user inputted password with the hash
                bcrypt.compare(req.body.password, foundUser.password, function(err, result) {
                    if (result === true) {
                        res.render("secrets");
                    }
                });
            } 
        }
    });
});





app.listen(3000, function() {
    console.log("Server started on port 3000.");
});




