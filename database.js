import { config } from 'dotenv';
import {MongoClient} from 'mongodb';
config();

export default function database(){

const URI= process.env.URI;
let mongoClient;
let collection;
let sessionCollection;

async function createClient(){

try{
mongoClient=new  MongoClient(URI);
await mongoClient.connect();
console.log("connected to database");
return mongoClient;
}
catch(e){
	
console.log(e);

process.exit()

}

}

async function createDB(){

try{
	
mongoClient= await createClient();
let db= mongoClient.db("chat-app");
collection = db.collection("chat-users");
sessionCollection= db.collection("sessions");


}catch(err){
	
	console.log(err);
	process.exit();

}

}


async function createUser(name,surname,email,password){

let mongoClient;

let newUser= {
"name": name,
"surname": surname, 
"email": email,
"password": password

}

try{

 mongoClient=await createClient()
await collection.insertOne(newUser);
console.log("successfully  created user");

} finally{

mongoClient.close();
}

}




async function getEmail(email) {
	
	try{
	 mongoClient=await createClient()
	
    const result = await collection.findOne({email:email});

    if (result) {      
        return result.email;
    } else {
        
        return null;            
    }
    
    mongoClient.close();
   } 
   
   catch(err){
console.log(err);
mongoClient.close();

}

return null;
}

async function deleteAll(){

try{
mongoClient= await createClient();
await collection. deleteMany({});
console.log("deleted");

}catch(err){
console.log(err);

}finally {

mongoClient.close();
}

}

async function deleteUser(email){

try{
mongoClient= await createClient();

await collection.deleteOne({email:email});
console.log("deleted user");

}catch(err){	
console.log(err);

}finally{
mongoClient.close();
}

}

async function getPassword(email){

try{
	 mongoClient=await createClient()
	
    const result = await collection.findOne({email:email});

    if (result) {    
console.log(result);
        return result;
    } else {
        console.log(`Password  not found`);
        return null;            
    }
    
    mongoClient.close();
   } 
   
   catch(err){
console.log(err);
mongoClient.close();
return null;

}



}

return {

createClient,
createDB ,
getEmail,
getPassword ,
createUser,
deleteAll,
deleteUser,
}
    
}