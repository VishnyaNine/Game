const Router = require("express");
const User = require("../models/User");
const UserItems = require("../models/UserItems");
const Tags = require("../models/Tags");
const UserCollection = require("../models/UserCollection");
const Likes = require("../models/Likes");
const LatestCollections = require("../models/LatestCollections");
const LatestTopics = require("../models/LatestTopics");
const bcrypt = require("bcrypt");
const config = require("config");
const {check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const router = new Router();
const authMiddleWare = require("../middleware/auth.middleware");
const mongoose = require("mongoose");


router.post('/registration',[
    check('email','incorrect email').isEmail(),
    check('password','Password has to be at least one character').isLength({min: 1, max: 50})

]
 ,async (req, res) =>{
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({message: 'Incorrect Email or Password!', errors})
        }
        const {email, password, name} = req.body;
        const candidate = await User.findOne({email})
        if (candidate){
            return res.status(400).json({message:`User ${email} already exists`})
        }
        const hashPas = await bcrypt.hash(password,2);
        const user = new User({email, password: hashPas, name,block:"Unblocked",secretPass:password});
        await user.save();
        return res.json({message:'User is created'});

    } catch(e){
        console.log(e);
        res.send({ message: 'Server Error' })
    }
})

router.post('/login',async (req, res) =>{
    try {
        const {email, password, name} = req.body;
        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({message:`User not found`})
        }
        if(user.block == 'Blocked'){
            return res.status(400).json({message:`User is blocked`})
        }
        const isPassValid = bcrypt.compareSync(password, user.password)
        if(!isPassValid){
            return res.status(400).json({message:`Invalid password`})
        }
        const token = jwt.sign({id:user.id},config.get("secretKey"),{expiresIn:'5h'})
        return res.json({
            token,
            user: {
                id:user.id,
                email:user.email,
                name: user.name,
                admin:user.isAdmin,
                secretPass:user.secretPass,
            }
        })

    } catch(e){
        console.log(e);
        res.send({ message: 'Server Error' })
    }
})

router.post('/createcollection',async (req, res) =>{
    try {
        const {email, collectionName, collectionType, collectionMarkDownValue,addedFields,fieldsLocation,collectionImage} = req.body;
        if(collectionName.length==0||collectionType.length==0){
            return res.status(404).json({message:`Name(Type) has to have at least one character!`})
        }
       
       const collectionDouble = await UserCollection.findOne({email,"collections.collectionName":collectionName});
       if(collectionDouble){
        return res.status(400).json({message:`Collection already exists!`})
       }
        const collectionUpdate = await UserCollection.findOne({email});
        
        if(collectionUpdate){
            const result = await UserCollection.updateOne({email:email},{$push:{collections:[{collectionName,collectionType,collectionMarkDownValue,addedFields,fieldsLocation,collectionImage}]}});
            return res.json({message:'Collection is created'});
        }
       
        const collection = new UserCollection({ email,collections:[{collectionName,collectionType,collectionMarkDownValue,addedFields,fieldsLocation,collectionImage}]});
        await collection.save();
        return res.json({message:'Collection is created'});

    } catch(e){
        console.log(e);
        res.send({ message: 'Server Error' })
    }
})
router.get('/lastitems', async (req, res) =>{
    try {
        const topics = await LatestTopics.findOne();
        return res.json({
            topics
        })

    } catch(e){
        console.log(e);
        res.send({ message: 'Server Error' })
    }
})

router.post('/createitem',async (req, res) =>{
    try {
        const {email,
               collectionName,
               itemName,
               id,
               madeIn,
               condition,
               damage,
               comments,
               description,
               notes,
               forSale,
               foreign,
               inStock,
               created,
               bought,
               firstRegistration,
               amount,
               readyToSail,
               cost,
               addedFields,
               fieldsLocation,
               tags
               
               } = req.body;
        if(itemName.length==0||id.length==0){
            return res.status(404).json({message:`Name(id) has to have at least one character!`})
        }
       
       const itemDouble = await UserItems.findOne({email,collectionName,"colItems.itemName":itemName});
       if(itemDouble){
        return res.status(400).json({message:`Item already exists!`})
       }
       const IdDouble = await UserItems.findOne({email,collectionName,"colItems.id":id});
       if(IdDouble){
        return res.status(400).json({message:`Id already exists!`})
       }
      
       const TopicsUpdate = await LatestTopics.findOne();
        
       const newTopic={
           itemName: itemName,
           email: email,
           collectionName: collectionName,
           id: id,
           
       }
       if(TopicsUpdate.colItems.length>5){
           
           TopicsUpdate.colItems.unshift(newTopic);
           TopicsUpdate.colItems.pop();
           await LatestTopics.updateOne({$set:{colItems:TopicsUpdate.colItems}});
       } else{
           TopicsUpdate.colItems.unshift(newTopic)
          
           await LatestTopics.updateOne({$set:{colItems:TopicsUpdate.colItems}});
       }
       
       const itemUpdate = await UserItems.findOne({email,collectionName});
       
        
        if(itemUpdate){
            const result = await UserItems.updateOne({email:email,collectionName:collectionName},{$push:{colItems:[{ itemName,
                id,
                madeIn,
                condition,
                damage,
                comments:[comments],
                description,
                notes,
                forSale,
                foreign,
                inStock,
                created,
                bought,
                firstRegistration,
                amount,
                readyToSail,
                cost,
                tags:[tags]
                
               
              }]}});
              await UserItems.updateOne({email:email,collectionName:collectionName},{$set:{fieldsLocation:fieldsLocation}});
              const LatestCollectionsUpdate = await LatestCollections.findOne();
              const collection = await UserCollection.findOne({email});
              const newCollection={}
              collection.collections.forEach(item=>{
                if(item.collectionName===collectionName){
                    newCollection.collectionName = collectionName
                    newCollection.email=email
                    newCollection.collectionType=item.collectionType
                    newCollection.collectionMarkDownValue=item.collectionMarkDownValue
                    newCollection.collectionImage=item.collectionImage
                    newCollection.itemLength = (itemUpdate.colItems.length+1)
                }
              })
             
              if(LatestCollectionsUpdate.collections.length<1){
                LatestCollectionsUpdate.collections.push(newCollection);
                await LatestCollections.updateOne({$set:{collections:LatestCollectionsUpdate.collections}});
                } else{
                        if(newCollection.itemLength>LatestCollectionsUpdate.collections[0].itemLength){
                            LatestCollectionsUpdate.collections[0].collectionName =newCollection.collectionName;
                            LatestCollectionsUpdate.collections[0].email=newCollection.email;
                            LatestCollectionsUpdate.collections[0].collectionType=newCollection.collectionType;
                            LatestCollectionsUpdate.collections[0].collectionMarkDownValue= newCollection.collectionMarkDownValue;
                            LatestCollectionsUpdate.collections[0].collectionImage = newCollection.collectionImage;
                            LatestCollectionsUpdate.collections[0].itemLength =  newCollection.itemLength;

                        }
                 
                    await LatestCollections.updateOne({$set:{collections:LatestCollectionsUpdate.collections}})
                }
            return res.json({message:'Item is created'});
        }
       
           
       
        const item = new UserItems({ email,collectionName,fieldsLocation,colItems:[{ itemName,
            id,
            madeIn,
            condition,
            damage,
            comments:[comments],
            description,
            notes,
            forSale,
            foreign,
            inStock,
            created,
            bought,
            firstRegistration,
            amount,
            readyToSail,
            cost,
            tags:[tags]
         
            }]});
            
            await item.save();
       
        return res.json({message:'Item is created'});

    } catch(e){
        console.log(e);
        res.send({ message: 'Server Error' })
    }
})

router.post('/edititem', async (req, res) =>{
    try {
        const {email,
               collectionName,
               itemName,
               id,
               madeIn,
               condition,
               damage,
               comments,
               description,
               notes,
               forSale,
               foreign,
               inStock,
               created,
               bought,
               firstRegistration,
               amount,
               readyToSail,
               cost,
               originalId,
               userComment,
               tags} = req.body;
        const items = await UserItems.findOne({email,collectionName});
        const editedItems = []
        items.colItems.forEach(item=>{
           
            if (item.id==originalId) {
                comments.push( userComment);
                item.itemName = itemName;
                item.collectionName = collectionName;
                item.id = id;
                item.madeIn = madeIn;
                item.condition = condition;
                item.damage = damage;
                item.comments = comments;
                item.description = description;
                item.notes = notes;
                item.forSale = forSale;
                item.foreign = foreign;
                item.inStock = inStock;
                item.created = created;
                item.bought = bought;
                item.firstRegistration = firstRegistration;
                item.amount = amount;
                item.readyToSail = readyToSail;
                item.cost = cost;
                item.tags = tags;
          } 

          editedItems.push(item);
         
     })
     const result = await UserItems.updateOne({email:email,collectionName:collectionName},{$set:{colItems:editedItems}});

     return res.json({
        result
    }) 
        
        

    } catch(e){
        console.log(e);
        res.send({ message: 'Server Error' })
    }
})



router.post('/editcollection',async (req, res) =>{
    try {
        const {email,index, collectionName,collectionType,collectionMarkDownValue,addedFields,fieldsLocation,collectionImage } = req.body;
       
       
       const collection = await UserCollection.findOne({email});
       collection.collections.splice(index,1,{collectionName,collectionType,collectionMarkDownValue,addedFields,fieldsLocation,collectionImage}) 
       const result = await UserCollection.updateOne({email:email},{$set:{collections:collection.collections}});
       
      
       return res.json({
         result
     })

    } catch(e){
        console.log(e);
        res.send({ message: 'Server Error' })
    }
})



router.post('/items', async (req, res) =>{
    try {
        const {email,collectionName} = req.body;
       const items = await UserItems.findOne({email,collectionName});
        return res.json({
            items
        })

    } catch(e){
        console.log(e);
        res.send({ message: 'Server Error' })
    }
})

router.post('/collections', async (req, res) =>{
    try {
        const {email} = req.body;
       const collection = await UserCollection.findOne({email});
        return res.json({
            collection
        })

    } catch(e){
        console.log(e);
        res.send({ message: 'Server Error' })
    }
})
router.post('/deletecollection', async (req, res) =>{
    try {
        const { email, index } = req.body;
        const collection = await UserCollection.findOne({email});
      collection.collections.splice(index,1) 
      const result = await UserCollection.updateOne({email:email},{$set:{collections:collection.collections}});
      
     
      return res.json({
        result
    })
       

    } catch(e){
        console.log(e);
        res.send({ message: 'Server Error' })
    }
})

router.post('/deleteitem', async (req, res) =>{
    try {
        const { email,collectionName, id } = req.body;
        const items = await UserItems.findOne({email,collectionName});
        const improvedItems = [];
       
        items.colItems.forEach(item=>{
           
               if (!(item.id==id)) {
               improvedItems.push(item);
             }
        })
       
      
      const result = await UserItems.updateOne({email:email,collectionName:collectionName},{$set:{colItems:improvedItems}});
      
     
      return res.json({
        result
    })
       

    } catch(e){
        console.log(e);
        res.send({ message: 'Server Error' })
    }
})

router.post('/currentitem', async (req, res) =>{
    try {
        const {email,collectionName,id} = req.body;
        const items = await UserItems.findOne({email,collectionName});
        let result = {fieldsLocation:items.fieldsLocation};
        items.colItems.forEach(item=>{
           
            if (item.id==id) {
                result.item=item;
          } 
         
     })
     return res.json({
        result
    }) 
        
        

    } catch(e){
        console.log(e);
        res.send({ message: 'Server Error' })
    }
})


router.get('/auth',authMiddleWare, async (req, res) =>{
    try {
       const user = await User.findOne({_id:req.user.id});
       if(user.block == 'Blocked'){
        return res.status(400).json({message:`User is blocked`})
    }
       const token = jwt.sign({id:user.id},config.get("secretKey"),{expiresIn:'5h'})
        return res.json({
            token,
            user: {
                id:user.id,
                email:user.email,
                name: user.name,
                admin:user.isAdmin,
                secretPass:user.secretPass,
            }
        })

    } catch(e){
        console.log(e);
        res.send({ message: 'Server Error' })
    }
})
router.get('/users', async (req, res) =>{
    try {
       const user = await User.find();
        return res.json({
            user
        })

    } catch(e){
        console.log(e);
        res.send({ message: 'Server Error' })
    }
})
router.post('/delete', async (req, res) =>{
    try {
        const {checked} = req.body;
      const result = await User.deleteMany({_id:{$in:checked}});
      return res.json({
        result
    })
       

    } catch(e){
        console.log(e);
        res.send({ message: 'Server Error' })
    }
})
router.post('/block', async (req, res) =>{
    try {
        const {checked} = req.body;
      const result = await User.updateMany({_id:{$in:checked}},{$set:{block:"Blocked"}});
      return res.json({
        result
    })
       

    } catch(e){
        console.log(e);
        res.send({ message: 'Server Error' })
    }
})
router.post('/admin', async (req, res) =>{
    try {
        const {checked} = req.body;
      const result = await User.updateMany({_id:{$in:checked}},{$set:{isAdmin:"Admin"}});
      return res.json({
        result
    })
       

    } catch(e){
        console.log(e);
        res.send({ message: 'Server Error' })
    }
})

router.post('/unblock', async (req, res) =>{
    try {
        const {checked} = req.body;
      const result = await User.updateMany({_id:{$in:checked}},{$set:{block:"Unblocked"}});
      return res.json({
        result
    })
       

    } catch(e){
        console.log(e);
        res.send({ message: 'Server Error' })
    }
})

router.post('/notadmin', async (req, res) =>{
    try {
        const {checked} = req.body;
      const result = await User.updateMany({_id:{$in:checked}},{$set:{isAdmin:"notAdmin"}});
      return res.json({
        result
    })
       

    } catch(e){
        console.log(e);
        res.send({ message: 'Server Error' })
    }
})

router.post('/findtext', async (req, res) =>{
    try {
        const {text} = req.body;
        const resultCollection = await UserCollection.find({$text:{$search:text}});
        console.log(resultCollection)
        const foundCollections=[];
        resultCollection.forEach(item=>{
            item.collections.forEach( gt=>{

                for (const key in gt) {
                    if(typeof gt[key]==='string'){
                       
                        if((gt[key].includes(text))){
                            const collectionName = gt.collectionName;
                            const email =item.email;
                           
                           const foundData={
                            email:item.email,
                            collectionName:gt.collectionName}
                            foundCollections.push(foundData);
                        }
                    }
                    
                 }
                
            })
        })
        const resultItems = await UserItems.find({$text:{$search:text}});
        const involvedItems = [];
        resultItems.forEach(item=>{
            
            item.colItems.forEach(gt=>{
               
                for (const key in gt) {
                    if((typeof gt[key]==='string'||Array.isArray(gt[key]))){
                       
                        if((Array.isArray((gt[key])&&gt[key].length>0)&&gt[key].join().includes(text)?gt[key].join().includes(text):gt[key].includes(text))){
                          

                            
                            const editedItem={};
                            editedItem.email = item.email;
                             editedItem.collectionName = item.collectionName;
                             editedItem.id = gt.id;
                             editedItem.itemName = gt.itemName;
                             involvedItems.push(editedItem);
                             return
                        }
                    }
                    
                 }
              
               
            })
        })
        if(!foundCollections==[]){
             const foundItems=[];
             for(let i=0;i<foundCollections.length;i++) {
                const email=foundCollections[i].email;
                const collectionName=foundCollections[i].collectionName
                const items = await UserItems.findOne({email,collectionName});
                if(items!==null){
                    
                    if(items!==null){
                        items.colItems.forEach(item=>{
                            const editedItem={};
                            editedItem.email = email;
                            editedItem.collectionName = collectionName;
                            editedItem.id = item.id;
                            editedItem.itemName = item.itemName;
                            foundItems.push(editedItem)
                        })
                       
                }}
            }
            const notIncludedBeforeItems = foundItems.filter(items => involvedItems.every(item => item.id !== items.id));
            involvedItems.push(...notIncludedBeforeItems);
        }

      
      return res.json({
        involvedItems
    })
       

    } catch(e){
        console.log(e);
        res.send({ message: 'Server Error' })
    }
})

router.post('/tags', async (req, res) =>{
    try {
        const {name,tags} = req.body;
        const tagsUpdate = await Tags.findOne({name});
        
        if(tagsUpdate){
           const involvedTags = new Set();
           const tagsPositioned = tags.split(',');
           tagsPositioned.forEach(elem=>involvedTags.add(elem))
           tagsUpdate.tags.forEach(elem=>involvedTags.add(elem))
            await Tags.updateOne({ name:name },{$set:{tags:[...involvedTags]}});
             
            return res.json({message:'Tag system is created'});
        }
        const tagsPositioned = tags.split(',');
        const tag = new Tags({ name,tags:tagsPositioned });
        await tag.save();
        return res.json({message:'Tag system is created'});

    } catch(e){
        console.log(e);
        res.send({ message: 'Server Error' })
    }
})
router.post('/gettags', async (req, res) =>{
    try {
        const {name } = req.body;
        const tags = await Tags.findOne({name});
        
        return res.json({
            tags
        })

    } catch(e){
        console.log(e);
        res.send({ message: 'Server Error' })
    }
})

router.post('/likes', async (req, res) =>{
    try {
        const {email,collectionName,id,likes} = req.body;
        const LikesUpdate = await Likes.findOne({email,collectionName,id});
        
        if(LikesUpdate){
         
            await Likes.updateOne({ email,collectionName,id },{$set:{likes:likes}});
             
            return res.json({message:'Like system is updated'});
        }
        const Like = new Likes({ email,collectionName,id,likes:likes });
        await Like.save();
        return res.json({message:'Tag system is created'});

    } catch(e){
        console.log(e);
        res.send({ message: 'Server Error' })
    }
})
router.post('/getlikes', async (req, res) =>{
    try {
        const {email,collectionName,id} = req.body;
        const likes = await Likes.findOne({email,collectionName,id});
        
        return res.json({
            likes
        })

    } catch(e){
        console.log(e);
        res.send({ message: 'Server Error' })
    }
})
router.get('/bigcollection', async (req, res) =>{
    try {
       const BigCollections = await LatestCollections.find();
        return res.json({
            BigCollections
        })

    } catch(e){
        console.log(e);
        res.send({ message: 'Server Error' })
    }
})


module.exports = router;