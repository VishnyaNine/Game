const  {Schema, model} = require("mongoose");

const LatestCollections = new Schema({
    collections: [{
    email: {type: String},
    collectionName: {type: String },
    collectionType: {type: String },
    collectionMarkDownValue:{type: String},
    collectionImage:{type: String},
    itemLength:{type: Number},
}],
   


    
   
 },)


 module.exports = model('LatestCollections', LatestCollections);