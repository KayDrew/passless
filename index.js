const express = require('express');
const app = express();
const dotenv = require('dotenv');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const session = require('express-session');
//import { config } from 'dotenv';
//const mongo= require ('mongodb');
const engine= require('express-handlebars'). engine;
//import { engine } from 'express-handlebars';
//const routes = require ('./routes');
const LocalStrategy = require('passport-local').Strategy;
const server= require("http").createServer(app);
const io= require("socket.io")(server,
 {cors: {origin:"localhost:3000"},
 credentials: true,
 //restore  any events that happened when client was disconnected 
connectionStateRecovery: {},
//change automatic disconnect 
transports: ['polling', 'websocket'],
pingTimeout: 120000
});
const cookieParser= require ("cookie-parser");
dotenv.config();

// view engine setup
app.set('views', 'views');
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.use(express.static('public'));
app.use(express.static('images'));

//app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


const sessionMiddleware = session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {maxAge: 60000},
  //cookie: {secure: true}
});

app.use(sessionMiddleware);
// init passport on every route call.
app.use(passport.session()); 

// allow passport to use "express-session".
let authUser = (user, password, done) => {
	console.log(`Value of "User" in authUser function ----> ${user}`)         //passport will populate, user = req.body.username
    console.log(`Value of "Password" in authUser function ----> ${password}`) //passport will popuplate, password = req.body.password

//Search the user, password in the DB to authenticate the user
//Let's assume that a search within your DB returned the username and password match for "Kyle".
   let authenticated_user = { id: 123, name: user};
   console.log("authenticated user " +JSON.stringify( authenticated_user));
   return done (null, authenticated_user );
}
passport.use(new LocalStrategy (authUser));

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/google/login"
  },
  
  function(accessToken, refreshToken, profile, cb) {

    console.log(profile.displayName);
    let user={name: profile.displayName, id:profile.id};
      return cb(null, user);
   
  }
));

passport.use(new FacebookStrategy({
    clientID:process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/facebook/login",
  },
  function(accessToken, refreshToken, profile, cb) {
    
    console.log(profile.displayName);
    let user={name: profile.displayName, id:profile.id};
      return cb(null, user);
    
  }
));


passport.serializeUser( (user, done) => {
    done(null, user)
    
});

passport.deserializeUser((user, done) => {
      
        done (null, {name: user.name, id: user.id} );
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
   successRedirect: "/",
   failureRedirect: "/login",
}));

app.get('/google', passport.authenticate('google', { scope: ['profile'] }));

app.get('/google/login', 
  passport.authenticate('google', {
 failureRedirect: '/login', successRedirect:'/',

 }));
 
 app.get('/facebook', passport.authenticate('facebook', { authType: 'reauthenticate'}));

app.get('/facebook/login', 
  passport.authenticate('facebook', {
 failureRedirect: '/login', successRedirect:'/',

 }));

 app.get("/", checkAuthenticated, (req, res) => {
	
	console.log(req.user);
  res.render("index", {
name: req.user.name,
id: req.user.id,
});
});

app.get("/chat", checkAuthenticated, (req, res) => {
	
	console.log(req.user);
  res.render("chat", {
name: req.user.name,
id: req.user.id,
});
});


app.post('/logout', function(req, res, next) {
	
	res.clearCookie('connect.sid');
  req.logout(function(err) {
    if (err) { return next(err); 

}

req.session.destroy( function(err){// destroys session  on both ends
if(err){

return next(err);
}

});
    res.redirect('/login');
  });
});


function onlyForHandshake(middleware) {
  return (req, res, next) => {
    const isHandshake = req._query.sid === undefined;
    if (isHandshake) {
      middleware(req, res, next);
    } else {
      next();
    }
  };
}

io.engine.use(onlyForHandshake(sessionMiddleware));
io.engine.use(onlyForHandshake(passport.session()));
io.engine.use(
  onlyForHandshake((req, res, next) => {
    if (req.user) {
      next();
    } else {
      res.writeHead(401);
      res.end();
    }
  }),
);

let users=0;

io.on("connection", async (socket)=>{

  
const user= socket.request.user.name;	
const userId = socket.request.user.id;

  // the user ID is used as a room
  //socket.join(`user:${userId}`);


//  allows you to easily broadcast an event to all the connections of a given user:
//io.to(`user:${userId}`).emit("joined", user);

console.log("user connected:  " +user);

//check whether a user is currently connected
const sockets = await io.in(`user:${userId}`).fetchSockets();
const isUserConnected = sockets.length > 0;
console.log("user " +user+" is connected? "+isUserConnected);
++users;
io.emit("user count", users);
console.log(users);



socket.on("message", (data)=>{
//console.log(data);
//send message to everyone but ourselves 
socket.broadcast.emit("message", data);
});


//handle a disconnect 
socket.on("disconnect", ()=>{


  //socket.join("room1");
	
	console.log(user+" has left the room.");
--users;
io.emit("user count", users);
io.emit("disconnected", user);

console.log(users);

});

});


server.listen(3000,()=>{
console.log("running on port 3000");
});