var express = require('express');
var mysql = require('mysql');
var router = express.Router();
var bodyParser = require('body-parser');
var fs = require('fs');


var connection = mysql.createConnection(JSON.parse(fs.readFileSync('db/db.json')));


router.use(bodyParser.urlencoded({extended:false}))

router.use(bodyParser.json())

router.get('/classes', (req,res) => {
    res.render('instructorsClasses.pug', {classes:req.session.user.classesTeaching})
})

module.exports = router;