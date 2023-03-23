const  {Schema, model} = require("mongoose");

const LatestTopics = new Schema({
  
    colItems: [{
    itemName: { type: String },
    email: {type: String},
    collectionName: {type: String},
    id: { type: String },
}],
   


    
   
 },)


 module.exports = model('LatestTopics', LatestTopics);