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
	
	/*
router.route('/newCourse')
	.get(sessionChecker, (req, res) => {
		res.render('newCourse');
	})
	.post((req, res) => {
		var buttonPressed = req.body.button_id;
	});
	*/
	
	/*
router.route('/newProgram')
	.get(sessionChecker, (req, res) => {
		res.render('newProgram');
	})
	.post((req, res) => {
		var buttonPressed = req.body.button_id;
	});
	*/
	
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