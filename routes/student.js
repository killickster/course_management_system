var mysql = require('mysql');
var express = require('express');
var router = express.Router();
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');

var connection = mysql.createConnection(JSON.parse(fs.readFileSync('db/db.json')));

function change(){
    console.loc("HI");
}

var sessionChecker = (req, res, next) => {
	if (!req.session.user || req.session.user.role != 'student') {
		req.session.loginMessage = 'noAccess';
		res.redirect('/login');
	}
	else {
		next();
	}
};

router.route('/')
	.get(sessionChecker, (req, res) => {
        var courses = [];
        connection.query('SELECT * FROM has_enrolled', (error, results, fields) => {
            if(results.length != 0){
            for(i=0; i<results.length; i++){
                console.log(results[i].class_id); 
            connection.query('SELECT course_id FROM classes WHERE class_id=?;', [results[i].class_id], (error, results, fields) => {
               console.log(results[0]);
               if(results.length != 0){
                connection.query('SELECT course_name FROM courses WHERE course_id=?;', [results1[0]], (error, results, fields) => {
                    if(results.length != 0){
                    console.log(results[0]);
                    courses.push((results[0])); 
                    }
                })
            } 
            })
        }
    }
        })

        var coursesS = JSON.parse(JSON.stringify(courses));
		res.render('studentHome', { name: req.session.user.first_name, courses: courses});
	})
	.post((req, res) => {
		res.redirect('/student/'+req.body.button_id);
    })


router.route('/courseRegistration')
    .get(sessionChecker, (req, res) => {
        connection.query('SELECT * FROM courses', (error, results, fields) => {
            var courses = JSON.parse(JSON.stringify(results));
            var classes = [];
            var courseSelected = "false";
            res.render('courseRegistration', {courses:courses, classes:classes, courseSelected:courseSelected});
        })


    }).post((req, res) => {
        var buttonPressed = req.body.button_id;
        var course_id = req.body.course_id;
        if(buttonPressed = "select" && course_id != "void"){
            connection.query('SELECT * FROM classes WHERE course_id=?;', [course_id], (error, results, fields) => {
                var classes = JSON.parse(JSON.stringify(results));
                var courseSelected = "true";
                connection.query('SELECT * FROM courses', (error, results, fields) => {
                    var courses = JSON.parse(JSON.stringify(results));
                    res.render('courseRegistration', {courses:courses, classes:classes, courseSelected:courseSelected})
                })
            })
        }
    })


router.route('/logout')
	.get((req, res) => {
		req.session.user = undefined;
		delete(req.session.user);
		req.session.loginMessage = 'loggedOut';
		res.redirect('/login');
	}).post((req, res) => {

    })
    


module.exports = router;