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
    //console.log(req.session.user.allClasses)
    res.render('requestClasses.pug',{classes:req.session.user.allClasses})
    
})


router.post('/requestClass', (req,res) => {
    var instructor_id = req.session.user.user_id;
    var class_id = req.body.class_id;

    connection.query('SELECT * FROM teach_request WHERE instructor_id=? AND class_id=?', [instructor_id, class_id], (error, results, fields) => {
        if(results.length == 0){
            connection.query('INSERT INTO `teach_request` (`instructor_id`, `class_id`) VALUES ( \''+instructor_id+'\',\''+class_id+'\');')
        }
    })

    console.log(class_id)

    res.json(class_id)



})

module.exports = router;