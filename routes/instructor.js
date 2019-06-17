var mysql = require('mysql');
var express = require('express');
var router = express.Router();
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');
var searchClasses = require('./searchClasses.js')
var displayClasses = require('./instructorClasses.js')

router.use('/requestClasses', searchClasses)
router.use('/displayClasses', displayClasses)

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
	res.render('instructorHome', { searchClasses: false, name: req.session.user.first_name});
	
	connection.query('SELECT * FROM teach_request WHERE instructor_id=?', [req.session.user.user_id], (error, results, fields) => {
		req.session.user.requestedClasses = results;
	})

	//Initalize session variable which holds classes this instructor is teaching
	req.session.user.classesTeaching = [];

	var userId = req.session.user.user_id;


	//Get all the classes the instructor is teaching
	connection.query('SELECT * FROM has_teaching WHERE instructor_id=?;', [userId], (error, results, fields) => {

		for(i = 0; i < results.length; i++){
			connection.query('SELECT * FROM classes WHERE class_id=?', [results[i].class_id], (error,results,fields)=> {

			var course_id = results[0].course_id;
			const section = results[0].sect;
			const class_id = results[0].class_id;

			connection.query('SELECT * FROM courses WHERE course_id=?', [course_id], (error,results,fields) => {
				req.session.user.classesTeaching.push({class_id:class_id, name:results[0].course_name, section:section, number:results[0].course_num})
				req.session.save();
			})



		} )



		}
	})

})
	


   
router.post('/logout', (req,res) => {
		req.session.user = undefined
		res.json('/')
	})
	

router.post('/displayClasses', (req,res) => {
	res.json('/instructor/displayClasses/classes')



})


router.post('/searchClasses', (req,res) => {

	req.session.user.allAvailableClasses = []

	//Initalize an array to hold the class ids the instructor cannot request
	var notAvailble = []


	req.session.user.classesTeaching.forEach((val) => {
		notAvailble.push(val.class_id)
	})

	req.session.user.allAvailableClasses.forEach((val) => {
		notAvailble.push(val.class_id)
	})

	req.session.user.requestedClasses.forEach((val) => {
		notAvailble.push(val.class_id)
	})



	//Get all the classes the instructor could request to teach
	connection.query('SELECT * FROM classes;', (error, results, fields) => {
		console.log(notAvailble)
        for(i = 0; i < results.length; i++){

			if(!notAvailble.includes(results[i].class_id)){

			var course_id = results[i].course_id;
			const section = results[i].sect;
			const class_id = results[i].class_id;
			
            connection.query('SELECT * FROM courses WHERE course_id=?;',[course_id], (error, results, fields)=> {
				req.session.user.allAvailableClasses.push({class_id:class_id, name:results[0].course_name, section:section, number:results[0].course_num})
				req.session.save();
		})
	}
	}

    })

	
	res.json('/instructor/requestClasses/classes')
})
    
module.exports = router;