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
const server= require("http").createServer(app);
const io= require("socket.io")(server,
 {cors: {origin:"*"},
connectionStateRecovery: {}});
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
  saveUninitialized: false,
  cookie: {maxAge: 600000},
  //cookie: {secure: true}
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
   let authenticated_user = { id: 123, name: user};
   console.log("authenticated user " +JSON.stringify( authenticated_user));
   return done (null, authenticated_user );
}
passport.use(new LocalStrategy (authUser));



passport.serializeUser( (user, done) => {
//	console.log(user)     

    done(null, user)
    
});

passport.deserializeUser((user, done) => {
      console.log(user);

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

app.get("/", (req,res)=>{

res.render("index");
});

app.get("/login", checkLoggedIn, (req, res) => {     
     res.render("login");
})

app.post ("/login", passport.authenticate('local', {
   successRedirect: "/chat",
   failureRedirect: "/login",
}));

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

server.listen(3000,()=>{
console.log("running on port 3000");
});

let users=0;

io.on("connection", (socket)=>{
	
console.log("user connected: " + socket.id);

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
	console.log("disconnected");
--users;
io.emit("user count", users);
console.log(users);
socket.disconnect();

});



});