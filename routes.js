import {config} from 'dotenv';
import bcrypt  from 'bcryptjs';
import database from './database.js';
const salt=10;
config();

const data= database();

export default function routes(){
	
	 data.createDB();

let email;
let password;
let name;
let surname;
let confirmPassword;
let error="no error";
let loginError="No error";
const passRegex= /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const regex = /^([a-zA-Z]{3,})$/;


async function signup(req,res){
		
email= req.body.email;
name= req.body.name;
surname= req.body.surname;
password= req.body.password;
confirmPassword= req.body.confirmPassword; 


//trim user input
name= name.trim();
surname= surname.trim();
email= email.trim();
password= password.trim();
confirmPassword= confirmPassword.trim();

let userExists=await data.getEmail(email);

//check if user exists
if(userExists){

error="User already exists. Please, login";
res.redirect("/signup");
}

//user does not exist
else{

//check regular expressions 
if(regex.test(name)){

if(regex.test(surname)){
	
//standardise user names and surnames
var b="";
var d="";
var a= name[0].toUpperCase();
var c= surname[0].toUpperCase();


//for names
for(let i=1;i<name.length;++i){
 b+= name[i].toLowerCase();
}

//for surnames
for(let i=1;i<surname.length;++i){
 d+=surname[i].toLowerCase();
}

//assign standardised name and surname
name= a+b;
surname= c+d;


if(passRegex.test(password) && passRegex.test(confirmPassword)){
   
if(password===confirmPassword){

//store user in database with hashed password 	
hashPassword();

error="";
res.redirect("/");

}

else{

error="Passwords do not match";

res.redirect("/signup");
}

}

else{
password= null;
confirmPassword= null;	
error="Password should contain at least 8 characters and contain at least 1 capital letter, 1 small letter, 1 special character and 1 digit";
res.redirect("/signup");

}

}

else{
surname= null;	
error="Surname should ONLY contain letters";
res.redirect("/signup");
}

}

else{
name= null;
error="Name should ONLY contain letters";
res.redirect("/signup");
}

}

}

async function signupPage(req, res){

res.render("signup", {
error
});

}



function  hashPassword(){
	
	bcrypt.hash(password, salt).then(function (hash){
   data.createUser(name,surname,email,hash);
 
});
return password;

}


async function confirmLogin(req,res){
	
//get user input 	
let loginEmail= req.body.loginEmail;
let loginPassword= req.body.loginPassword;
let dbEmail;
let dbPassword;

//find user email in database 
dbEmail= await data.getEmail(loginEmail);

//if email  is found
if(dbEmail){	

//find the corresponding password in database 
let user= await data.getPassword(dbEmail);
dbPassword= user.password;

//compare user password  to database  password 
bcrypt.compare(loginPassword,dbPassword).then(function(result){

//if they match 	
if(result){	
res.redirect("/");
loginError="";
return user;

}

//if they don't  match
else{
res.redirect("/login");
loginError="Incorrect email or password";
return null;
}

});

}

//user email could not be found
else{
loginError="User does not exist. You must create an account to proceed. ";
res.redirect("/login");

}

}


function login(req,res){
res.render("login", {
loginError 
});

}

function getEmail(){

return email;
}

function  getPassword(){

return password;
}

function  getName(){

return name;
}

function  getSurname(){

return surname;

}

return{
signup,
getEmail,
getPassword,
getName,
getSurname,
signupPage,
confirmLogin,
login,

}

}