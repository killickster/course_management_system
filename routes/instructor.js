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
	//console.log(req.session.user)	
})


router.post('/searchClasses', (req,res) => {
	req.session.user.allClasses = [];

	var userId = req.session.user.user_id;

		var doNotDisplay = [];
		connection.query('SELECT * FROM has_teaching WHERE instructor_id=?;', [userId], (error, results, fields) => {
			for(i = 0; i < results.length; i++){
				doNotDisplay.push(results[i].class_id);
			}
		})
		connection.query('SELECT * FROM teach_request WHERE instructor_id=?', [userId], (error, results, fields) => {
			
			for(i = 0; i < results.length; i++){
				doNotDisplay.push(results[i].class_id);
			}
			
		})


	
	connection.query('SELECT * FROM classes;', (error, results, fields) => {

        for(i = 0; i < results.length; i++){
			if(!doNotDisplay.includes(results[i].class_id)){
			var course_id = results[i].course_id;
			const section = results[i].sect;
			const class_id = results[i].class_id;
            connection.query('SELECT * FROM courses WHERE course_id=?;',[course_id], (error, results, fields)=> {
				req.session.user.allClasses.push({class_id:class_id, name:results[0].course_name, section:section, number:results[0].course_num})
				req.session.save();
            } )
		}
	}


    })
	res.json('/instructor/requestClasses/classes')
})
    
module.exports = router;