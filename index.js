const express = require('express');
const app = express();
const passport = require('passport');
const session = require('express-session');
//import { config } from 'dotenv';
//const mongo= require ('mongodb');
const engine= require('express-handlebars'). engine;
//import { engine } from 'express-handlebars';
//const routes = require ('./routes');
const LocalStrategy = require('passport-local').Strategy;
// view engine setup
app.set('views', 'views');
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.use(express.static('public'));
app.use(express.static('images'));

//app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: "secret",
  resave: false ,
  saveUninitialized: true ,
}));

app.use(passport.initialize());
// init passport on every route call.

app.use(passport.session()); 
// allow passport to use "express-session".
let authUser = (user, password, done) => {
	console.log(`Value of "User" in authUser function ----> ${user}`)         //passport will populate, user = req.body.username
    console.log(`Value of "Password" in authUser function ----> ${password}`) //passport will popuplate, password = req.body.password

//Search the user, password in the DB to authenticate the user
//Let's assume that a search within your DB returned the username and password match for "Kyle".
   let authenticated_user = { id: 123, name: "Kyle"}
   return done (null, authenticated_user );
}
passport.use(new LocalStrategy (authUser));



passport.serializeUser( (user, done) => {
	console.log(user)     

    done(null, user.id)
    
});

passport.deserializeUser((id, done) => {
      console.log(id);

        done (null, {name: "Kyle", id: 123} );
});

let checkAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
 return next();
 }
  res.redirect("/login");
}

let checkLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) { 
       return res.redirect("/profile")
   }
  next()
}

app.get("/login", checkLoggedIn, (req, res) => {     
     res.render("login");
})

app.post ("/login", passport.authenticate('local', {
   successRedirect: "/profile",
   failureRedirect: "/login",
}));

app.get("/profile", checkAuthenticated, (req, res) => {
  res.render("profile", {
name: req.user.name,
id: req.user.id,
});
});


app.post('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});


let count = 1

printData = (req, res, next) => {
    console.log("\n==============================")
    console.log(`------------>  ${count++}`)

    console.log(`req.body.username -------> ${req.body.username}`) 
    console.log(`req.body.password -------> ${req.body.password}`)

    console.log(`\n req.session.passport -------> `)
    console.log(req.session.passport)
  
    console.log(`\n req.user -------> `) 
    console.log(req.user) 
  
    console.log("\n Session and Cookie")
    console.log(`req.session.id -------> ${req.session.id}`) 
    console.log(`req.session.cookie -------> `) 
    console.log(req.session.cookie) 
  
    console.log("===========================================\n")

    next()
}

app.use(printData) //user printData function as middleware to print populated variables


app.listen(3000, ()=>{
console.log("App running on port 3000")
});