const express = require('express');
const monk = require('monk');
const helmet = require('helmet');
const morgan = require('morgan');
const joi = require('joi');
const { nanoid } = require('nanoid');

const port = process.env.PORT || 8080

const db =  monk((process.env.NODE_ENV === "production")? process.env.MONGODB_URI : 'root:example@192.168.1.4:27017/');

const urls = db.get('urls');
urls.createIndex({alias: 1}, {unique: true});

const app = express();
app.set('trust-proxy', (process.env.PROXY)? true : false)

app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(morgan((process.env.NODE_ENV === "production")? 'common' : 'dev'));
app.use(express.json())
app.use(express.static('./static'));

app.use((req, res, next) => {
    req.fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    next();
  });


const schema = joi.object().keys({
    alias: joi.string().pattern(/^[\w\-]+$/i).min(3),
    url: joi.string().uri().required(),
})

app.get('/:id', async (req, res, next)=>{
    let r = await urls.findOne({alias: req.params.id});
    if(!r){
        next()
    }else{
        res.redirect(r.url)
    }
})

app.post('/', async (req, res, next) =>{
    var { alias, url} = req.body;
    if(!alias){
        alias = nanoid(6)
    }
    alias = alias.toLowerCase()
    try{
        let val = schema.validate({
            alias,
            url
        })
        if(val.error){
            throw new Error(val.error)
        }
        await urls.insert({alias, url})
        res.json({
            message: 'Short url created at',
            alias: alias,
            link: `${req.fullUrl}${alias}`
        })
    } catch(error){
        next(error)
    }
});


function notFound(req, res, next) {
    res.status(404);
    res.send('Not Found - ' + req.originalUrl);
  }
  
  function errorHandler(err, req, res, next) {
    res.status(res.statusCode || 500);
    res.json({
      error: err.message,
      stack: (process.env.NODE_ENV === "production")? "" : err.stack
    });
  }
  
  app.use(notFound);
  app.use(errorHandler);


app.listen(port, () => {
    console.log (`Listening on port ${port}`);
});
