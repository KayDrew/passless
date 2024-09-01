const {Strategy }= require 'passport-local';
const passport = require 'passport';

passport.use(
new Strategy({usernameField: "email"}, username, password, done)=>{

});
)