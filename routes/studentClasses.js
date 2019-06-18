var mysql = require('mysql');
var express = require('express');
var router = express.Router();
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');


var connection = mysql.createConnection(JSON.parse(fs.readFileSync('db/db.json')));

router.use(bodyParser.urlencoded({extended:false}))

router.use(bodyParser.json())


router.get('/classes', (req,res) => {

    res.render('studentCourses.pug', {classes:req.session.user.classes});

})

router.post('/returnHome', (req,res) => {
    console.log('returning home')
    res.json('/student/home')
})



module.exports = router;