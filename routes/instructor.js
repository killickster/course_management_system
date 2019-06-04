var mysql = require('mysql');
var express = require('express');
var router = express.Router();
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');


async function pause(ms){
	return new Promise(resolve => setTimeout(resolve, ms));
}


var sessionChecker = (req, res, next) => {
	if (!req.session.user || req.session.user.role != 'instructor') {
		req.session.loginMessage = 'noAccess';
		res.redirect('/login');
	}
	else {
		next();
	}
};


router.route('/')
	.get(sessionChecker, (req, res) => {
		res.render('instructorHome', { name: req.session.user.first_name});
	})
	.post((req, res) => {
		res.redirect('/instructor/'+req.body.button_id);
    })
   
router.route('/logout')
	.get((req, res) => {
		req.session.user = undefined;
		delete(req.session.user);
		req.session.loginMessage = 'loggedOut';
		res.redirect('/login');
    })
    
module.exports = router;