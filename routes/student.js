var mysql = require('mysql');
var express = require('express');
var router = express.Router();
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var searchClasses = require('./searchClassesStudent.js')
var studentClasses = require('./studentClasses.js')
var fs = require('fs');

var connection = mysql.createConnection(JSON.parse(fs.readFileSync('db/db.json')));

router.use(bodyParser.urlencoded({extended:false}))

router.use(bodyParser.json())

router.use('/searchClasses', searchClasses)
router.use('/studentClasses', studentClasses)

var sessionChecker = (req, res, next) => {
	if (!req.session.user || req.session.user.role != 'student') {
		req.session.loginMessage = 'noAccess';
		res.redirect('/login');
	}
	else {
		next();
	}
};


router.get('/home', sessionChecker, (req,res) => {
    req.session.user.classes = [];

    connection.query('SELECT * FROM has_enrolled WHERE student_id=?;', [req.session.user.user_id], (error, results, fields) => {
        for(i = 0; i < results.length; i++){
        connection.query('SELECT * FROM classes WHERE class_id=?;', [results[i].class_id], (error,results,fields) => {
            const class_id = results[0].class_id;
            const section = results[0].section;
            if(results.length != 0){
           connection.query('SELECT * FROM courses WHERE course_id=?;', [results[0].course_id], (error, results,fields) => {
               var contains = false;
               for(i = 0; i < req.session.user.courses.length; i++){
                   if(req.session.user.courses[i].course_id === results[0].course_id){
                       contains = true;
                   }
               }

               if(!contains){
                    req.session.user.classes.push({class_id:class_id, name:results[0].course_name, section:section, course_num:results[0].course_num});
               }
               req.session.save()
           })
        }
       })
    }
    res.render('studentHome');
})


})



router.post('/searchClasses', (req,res) => {
   
    req.session.user.availibleClasses = [];

    var notAvailible = [];

    req.session.user.classes.forEach((val) => {
        notAvailible.push(val.class_id)
    })

    connection.query('SELECT * FROM classes;', (error, results, fields) => {

        for(i = 0; i < results.length; i++){
            const section = results[i].section
            const class_id = results[i].class_id

            connection.query('SELECT * FROM courses WHERE course_id=?', [results[i].course_id], (error,results,fields) => {
            
                if(!notAvailible.includes(class_id)){
                    req.session.user.availibleClasses.push({class_id:class_id, name:results[0].course_name, section:section, course_num:results[0].course_num})
                    req.session.save()
                }

            })

        }

    })

    res.json('/student/searchClasses/classes');



})


router.post('/viewClasses', (req,res) => {
    res.json('/student/studentClasses/classes')
})


/*

router.post('/showCourses').get(sessionChecker, (req,res) => {
    var coursesNew = JSON.parse(JSON.stringify(req.session.user.courses));
    res.render('studentCourses', {courses:coursesNew, name:req.session.user.first_name})
})

*/


/*
router.post((req,res) => {
    var buttonPressed = req.body.button_id;
    console.log(buttonPressed);
    if(buttonPressed=='return'){
        res.redirect('/student');
    }
})
*/


/*
router.route('/courseRegistration')
    .get(sessionChecker, (req, res) => {
        connection.query('SELECT * FROM courses', (error, results, fields) => {
            var courses = JSON.parse(JSON.stringify(results));
            var classes = [];
            var courseSelected = "false";
            res.render('courseRegistration', {courses:courses, classes:classes, courseSelected:courseSelected});
        })


    })

    */
    

    /*
 router.post((req, res) => {
        var buttonPressed = req.body.button_id;
        var course_id = req.body.course_id;
        var class_id = req.body.class_id;
        if(buttonPressed = "select" && course_id != "void"){
            connection.query('SELECT * FROM classes WHERE course_id=?;', [course_id], (error, results, fields) => {
                var classes = JSON.parse(JSON.stringify(results));
                var courseSelected = "true";
                connection.query('SELECT * FROM courses', (error, results, fields) => {
                    var courses = JSON.parse(JSON.stringify(results));
                    res.render('courseRegistration', {courses:courses, classes:classes, courseSelected:courseSelected})
                })
            })
        }else if(buttonPressed = "submit" && class_id != "void"){

            connection.query('SELECT * FROM has_enrolled WHERE class_id=? && student_id=?;',[class_id, req.session.user.user_id], (error, results, fields) => {
                var results = JSON.parse(JSON.stringify(results));
                if(results.length == 0){
                    connection.query('INSERT INTO `has_enrolled` (`class_id`, `student_id`) VALUES ( \''+class_id+'\',\''+req.session.user.user_id+'\');');

                }
                res.render('courseRegistration', {courses:req.session.user.courses, classes:[], courseSelected:"false"} )
            })
        } else {
            res.redirect('/student');
        }
    
    })

    */


router.post('/logout', (req, res) => {
		req.session.user = undefined;
        delete(req.session.user);
        req.session.loginMessage = 'loggedOut';
        res.json('/')
	})
    


module.exports = router;