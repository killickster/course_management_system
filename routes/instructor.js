var mysql = require('mysql');
var express = require('express');
var router = express.Router();
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');
var searchClasses = require('./searchClasses.js')

router.use('/requestClasses', searchClasses)

var connection = mysql.createConnection(JSON.parse(fs.readFileSync('db/db.json')));

router.use(bodyParser.urlencoded({extended:false}))

router.use(bodyParser.json())

var sessionChecker = (req, res, next) => {
	console.log('hi')
	if (!req.session.user || req.session.user.role != 'instructor') {
		req.session.loginMessage = 'noAccess';
		res.redirect('/login');
	}
	else {
		next();
	}
};

router.get('/home', sessionChecker, (req, res) => {
		res.render('instructorHome', { name: req.session.user.first_name});
	})

   
router.post('/logout', (req,res) => {
		req.session.user = undefined
		res.json('/')
	})
	

router.post('/displayCourses', (req,res) => {
	console.log(req.session.user)	
})


router.post('/searchClasses', (req,res) => {
	req.session.user.allClasses = [];
	connection.query('SELECT * FROM classes;', (error, results, fields) => {
        for(i = 0; i < results.length; i++){
			var class_id = results[i].class_id;
            var course_id = results[i].course_id;
			var section = results[i].sect;
            connection.query('SELECT * FROM courses WHERE course_id=?;',[course_id], (error, results, fields)=> {
				req.session.user.allClasses.push({class_id:class_id, name:results[0].course_name, section:section, number:results[0].course_num})
				req.session.save();
            } )
        }
    })
	res.json('/instructor/requestClasses/classes')
})
    
module.exports = router;