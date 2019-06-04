//server.js

var mysql = require('mysql');
var express = require('express');
var router = express.Router();
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');

var connection = mysql.createConnection({
	host		: 'localhost',
	user		: 'root',
	password	: 'password',
	database	: 'cms'
});

async function pause(ms){
	return new Promise(resolve => setTimeout(resolve, ms));
}

var sessionChecker = (req, res, next) => {
	if (!req.session.user || req.session.user.role != 'admin') {
		req.session.loginMessage = 'noAccess';
		res.redirect('/login');
	}
	else {
		next();
	}
};

router.route('/')
	.get(sessionChecker, (req, res) => {
		res.render('adminHome', { name: req.session.user.first_name});
	})
	.post((req, res) => {
		res.redirect('/admin/'+req.body.button_id);
	})
	
router.route('/newUser')
	.get(sessionChecker, (req, res) => {
		message = req.session.newUserMessage;
		newUser = req.session.newUser;
		req.session.newUserMessage = undefined;
		req.session.newUser;
		delete(req.session.newUserMessage);
		delete(req.session.newUser);
		res.render('newUser', { message : message, newUser : newUser});
		
	})
	.post((req, res) => {
		var buttonPressed = req.body.button_id;
		var username = req.body.username;
		var firstname = req.body.firstname;
		var lastname = req.body.lastname;
		var role = req.body.role;
		if(buttonPressed == "submit") {
			if(username && firstname && lastname) {
				connection.query('SELECT * FROM users WHERE username = ?', [username], function(error, results, fields){
					if(results.length == 0) {
						var password = '000000';
						connection.query('INSERT INTO `users` (`username`, `password`, `first_name`, `last_name`, `role`) VALUES ( \''+username+'\',\''+password+'\',\''+firstname+'\',\''+lastname+'\',\''+role+'\')');
						req.session.newUserMessage = 'success';
						req.session.newUser = {
							username : username,
							password : password
						}
						res.redirect('newUser');
					} else {
						req.session.newUserMessage = 'userExists';
						req.session.newUser = { username : username };
						res.redirect('newUser');
					}
				});
			} else {
				req.session.newUserMessage = 'missingField';
				res.redirect('newUser');
			}
		} else {
			res.redirect('/');
		}
	});

router.route('/newDept')
	.get(sessionChecker, (req, res) => {
		message = req.session.deptMessage;
		newDept = req.session.newDept;
		req.session.deptMessage = undefined;
		req.session.newDept = undefined;
		delete(req.session.deptMessage);
		delete(req.session.newDept);
		res.render('newDept', { message : message , newDept : newDept});
	})
	.post((req, res) => {
		var buttonPressed = req.body.button_id;
		var dept_name = req.body.name;
		var dept_abbv = req.body.abbv;
		if(buttonPressed == "submit") {
			if (dept_name && dept_abbv) {
				connection.query('SELECT * FROM departments WHERE dept_name = ? OR dept_abbv = ?', [dept_name, dept_abbv], function (error, results, fields) {
					if (results.length == 0) {
						connection.query('INSERT INTO departments (dept_name, dept_abbv) VALUES (?, ?)', [dept_name, dept_abbv]);
						req.session.deptMessage = 'success';
						req.session.newDept = { name : dept_name };
						res.redirect('newDept');
					} else {
						req.session.deptMessage = 'deptExists';
						res.redirect('newDept');
					}
				});
			} else {
				req.session.deptMessage = 'missingField';
				res.redirect('newDept');
			}
		} else {
			res.redirect('/');
		}
	});
	
router.route('/newCourse')
	.get(sessionChecker, (req, res) => {
		message = req.session.courseMessage;
		newCourse = req.session.newCourse;
		req.session.courseMessage = undefined;
		req.session.newCourse = undefined;
		delete(req.session.courseMessage);
		delete(req.session.newCourse);
		connection.query('SELECT dept_id, dept_abbv FROM departments', function (error, results, fields)  {
			var depts = JSON.parse(JSON.stringify(results));
			res.render('newCourse', { message : message, newCourse : newCourse, depts : depts });
			});
	})
	.post((req, res) => {
		var buttonPressed = req.body.button_id;
		var course_name = req.body.name;
		var dept = JSON.parse(req.body.dept);
		var dept_id = dept.dept_id;
		var dept_abbv = dept.dept_abbv;
		var course_num = req.body.num;
		var course_desc = req.body.desc;
		if (course_desc == undefined) course_desc = "";
		var course_len = req.body.len;
		if(buttonPressed == "submit") {
			if (course_name && course_num) {
				connection.query('SELECT * FROM courses WHERE dept_id = ? AND course_num = ?', [dept_id, course_num] , function (error, results, fields) {
					if(results.length == 0) {
						connection.query('INSERT INTO courses (course_name, dept_id, course_num, course_desc, course_len) VALUES (?, ?, ?, ?, ?)',
							[course_name, dept_id, course_num, course_desc, course_len]);
						req.session.courseMessage = 'success';
						req.session.newCourse = { num : course_num, dept_abbv : dept_abbv};
						res.redirect('newCourse');
					} else {
						req.session.courseMessage = 'courseExists';
						res.redirect('newCourse');
					}
				});
			} else {
				req.session.courseMessage = 'missingField';
				res.redirect('newCourse');
			}
		} else {
			res.redirect('/');
		}
	});
	
router.route('/newProgram')
	.get(sessionChecker, (req, res) => {
		message = req.session.progMessage;
		newProgram = req.session.newProgram;
		req.session.progMessage = undefined;
		req.session.newProgram = undefined;
		delete(req.session.programMessage);
		delete(req.session.newProgram);
		res.render('newProgram', { message : message , newProgram : newProgram});
	})
	.post((req, res) => {
		var buttonPressed = req.body.button_id;
		var program_name = req.body.name;
		var program_abbv = req.body.abbv;
		var program_desc = req.body.desc;
		if (program_desc == undefined) program_desc = "";
		if(buttonPressed == "submit") {
			if (program_name && program_abbv) {
				connection.query('SELECT * FROM programs WHERE program_name = ? OR program_abbv = ?', [program_name, program_abbv], function (error, results, fields) {
					if (results.length == 0) {
						connection.query('INSERT INTO programs (program_name, program_abbv, program_desc) VALUES (?, ?, ?)', [program_name, program_abbv, program_desc]);
						req.session.progMessage = 'success';
						req.session.newProgram = { name : program_name };
						res.redirect('newProgram');
					} else {
						req.session.progMessage = 'progExists';
						res.redirect('newProg');
					}
				});
			} else {
				req.session.progMessage = 'missingField';
				res.redirect('newProg');
			}
		} else {
			res.redirect('/');
		}
	});
	
router.route('/changePass')
	.get(sessionChecker, (req, res) => {
		message = req.session.passMessage;
		req.session.passMessage = undefined;
		delete(req.session.passMessage);
		res.render('changePass', {message : message});
	})
	.post((req, res) => {
		var buttonPressed = req.body.button_id;
		var oldpass = req.body.oldpass;
		var newpass = req.body.newpass;
		var newpassconf = req.body.newpassconf;
		var username = req.session.user.username;
		var user_id = req.session.user.user_id;
		if(buttonPressed == "submit") {
			if(oldpass && newpass && newpassconf) {
				connection.query('SELECT user_id, password FROM users WHERE user_id = ?', [user_id], function(error, results, fields){
					if (results[0].password = oldpass) {
						if (oldpass != newpass) {
							connection.query('UPDATE users SET password = ? WHERE user_id = ?', [newpass, user_id]);
							req.session.passMessage = 'success';
							res.redirect('changePass');
						} else {
							req.session.passMessage = 'samePass';
							res.redirect('changePass');
						}
					} else {
						req.session.passMessage = 'wrongOldPass';
						res.redirect('changePass');
					}
				});
			} else {
				req.session.passMessage = 'missingField';
				res.redirect('changePass');
			}
		} else {
			res.redirect('/');
		}
	});
	
router.route('/logout')
	.get((req, res) => {
		req.session.user = undefined;
		delete(req.session.user);
		req.session.loginMessage = 'loggedOut';
		res.redirect('/login');
	})

module.exports = router;