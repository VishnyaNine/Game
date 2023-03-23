const  {Schema, model} = require("mongoose");

const UserItems = new Schema({
    email: {type: String, required: true},
    collectionName: {type: String, required: true},
    fieldsLocation: { type: []},
    colItems: [{itemName: { type: String },
    id: { type: String },
    madeIn: { type: String },
    condition: { type: String },
    damage: { type: String },
    comments: { type: [] },
    description: { type: String },
    notes: { type: String },
    forSale: { type: Boolean },
    foreign: { type: Boolean },
    inStock: { type: Boolean },
    created: { type: Date },
    bought: { type: Date },
    firstRegistration: { type: Date },
    amount: { type: Number },
    readyToSail: { type: Number },
    cost: { type: Number },
    tags: { type: [] },
}],
   


    
   
 },)


 module.exports = model('UserItems', UserItems);