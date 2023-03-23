const  {Schema, model} = require("mongoose");

const Tags = new Schema({
   name: {type: String, required: true },
   tags: {type: [], required: true },
   
},{timestamps:true})



module.exports = model('Tags', Tags);