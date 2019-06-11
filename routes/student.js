var mysql = require('mysql');
var express = require('express');
var router = express.Router();
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');

var connection = mysql.createConnection(JSON.parse(fs.readFileSync('db/db.json')));
var courses = [];

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
        connection.query('SELECT * FROM has_enrolled WHERE student_id=?;', [req.session.user.user_id], (error, results, fields) => {
            for(i = 0; i < results.length; i++){
            connection.query('SELECT * FROM classes WHERE class_id=?;', [results[i].class_id], (error,results,fields) => {
                if(results.length != 0){
               connection.query('SELECT * FROM courses WHERE course_id=?;', [results[0].course_id], (error, results,fields) => {
                   courses.push(results[0]);
               })
            }
           })
        }
        res.render('studentHome');
    })
})
	.post((req, res) => {
            res.redirect('/student/'+req.body.button_id);
    })


router.route('/showCourses').get(sessionChecker, (req,res) => {
    var coursesNew = JSON.parse(JSON.stringify(courses));
    res.render('studentCourses', {courses:coursesNew, name:req.session.user.first_name})
}).post((req,res) => {
    console.log('why');
    var buttonPressed = req.body.button_id;
    console.log(buttonPressed);
    if(buttonPressed=="return"){

        res.redirect('/');
    }
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
        var class_id = req.body.class_id;

        if(buttonPressed = "submit" && class_id != "void"){
            connection.query('SELECT * FROM has_enrolled WHERE class_id=? && student_id=?;',[class_id, req.session.user.user_id], (error, results, fields) => {
                var results = JSON.parse(JSON.stringify(results));
                if(results.length == 0){
                    connection.query('INSERT INTO `has_enrolled` (`class_id`, `student_id`) VALUES ( \''+class_id+'\',\''+req.session.user.user_id+'\');');

                }
            })
            res.redirect('/')
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