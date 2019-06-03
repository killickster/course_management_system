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

router.route('/')
	.get((req, res) => {
		res.render('adminHome', { name: req.session.name});
	})
	.post((req, res) => {
		
	});
	
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


module.exports = router;