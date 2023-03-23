const  {Schema, model} = require("mongoose");

const User = new Schema({
   email: {type: String, required: true, unique: true},
   password: {type: String, required: true},
   name: {type: String, required: true},
   block:{type: String},
   isAdmin:{type: String,default:"notAdmin"},
   secretPass:{type: String},
},{timestamps:true})



module.exports = model('User', User);
