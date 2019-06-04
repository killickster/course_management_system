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

var sessionChecker = (req, res, next) => {
	if (!req.session.user) {
		res.redirect('/login');
	} else {
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
	.get((req, res) => {
		res.render('newUser');
	})
	.post((req, res) => {
		var username = req.body.username;
		var firstname = req.body.firstname;
		var lastname = req.body.lastname;
		var role = req.body.role;
		var password = '000000';
		console.log(username);
		console.log(firstname);
		console.log(lastname);
		console.log(role);
		console.log(password);
		connection.query('INSERT INTO `users` (`username`, `password`, `first_name`, `last_name`, `role`) VALUES ( \''+username+'\',\''+password+'\',\''+firstname+'\',\''+lastname+'\',\''+role+'\')');
	});

	/*
router.route('/newDept')
	.get() => {
		res.render('newDept');
	}
	.post(() => {
	});
	*/
	
router.route('/logout')
	.get((req, res) => {
		req.session.user = undefined;
		delete(req.session.user);
		res.redirect('/login');
	})

module.exports = router;