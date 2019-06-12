var mysql = require('mysql');
var express = require('express');
var router = express.Router();
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');

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

router.get('/', sessionChecker, (req, res) => {
		res.render('instructorHome', { name: req.session.user.first_name});
	})

   
router.post('/', (req,res) => {
		console.log(req)
    })
    
module.exports = router;