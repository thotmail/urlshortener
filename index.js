const express = require('express');
const monk = require('monk');
const helmet = require('helmet');
const morgan = require('morgan');
const joi = require('joi');
const { nanoid } = require('nanoid');

const port = process.env.PORT || 8080


const app = express();

//const db = monk(process.env.MONGODB_URI)
const db = monk('root:example@192.168.1.4:27017/');

const urls = db.get('urls');
urls.createIndex({alias: 1}, {unique: true});

app.use(helmet());
app.use(morgan('dev'));
app.use(express.urlencoded({extended: true}))
app.use(express.static('./static'));

const schema = joi.object().keys({
    alias: joi.string().pattern(/^[\w\-]+$/i).min(3),
    url: joi.string().uri().required(),
})

app.get('/:id', async (req, res)=>{
    let r = await urls.findOne({alias: req.params.id});
    console.log(r)
    res.redirect(r.url)
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
            alias: alias
        })
    } catch(error){
        next(error)
    }
});


function notFound(req, res, next) {
    res.status(404);
    const error = new Error('Not Found - ' + req.originalUrl);
    next(error);
  }
  
  function errorHandler(err, req, res, next) {
    res.status(res.statusCode || 500);
    res.json({
      message: err.message,
      stack: err.stack
    });
  }
  
  app.use(notFound);
  app.use(errorHandler);


app.listen(port, () => {
    console.log (`Listening on port ${port}`);
});
