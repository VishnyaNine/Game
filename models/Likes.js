const  {Schema, model} = require("mongoose");

const Likes = new Schema({
   email: {type: String, required: true},
   collectionName: {type: String, required: true},
   id: { type: String },
   likes:{ type: Array },
   
},{timestamps:true})



module.exports = model('Likes', Likes);