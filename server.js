//server.js

var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var adminRouter = require('./routes/admin');
var instructorRouter = require('./routes/instructor');
var studentRouter = require('./routes/student');
var fs = require('fs');

var connection = mysql.createConnection(JSON.parse(fs.readFileSync('db/db.json')));

var app = express();
app.set('view engine', 'pug');
app.use(express.static('./public'))


app.use(session({
	key: 'user_sid',
	secret:	'secret',
	resave: false,
	saveUninitialized: false,
}));


app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.use('/admin', adminRouter);
app.use('/instructor', instructorRouter);
app.use('/student', studentRouter);

var sessionChecker = (req, res, next) => {
	if (req.session.user) {
		res.redirect('/roles');
	} else {
		next();
	}


};

app.get('/', sessionChecker, (req, res) => {
	res.redirect('/login');
});

app.route('/login')
	.get(sessionChecker, (req, res) => {
		message = req.session.loginMessage;
		req.session.loginMessage = undefined;
		delete(req.session.loginMessage);
		res.render('login', {message : message});
	})
	.post((req, res) => {
		var username = req.body.username;
		var password = req.body.password;
		
		if (username && password) {
			connection.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], function(error, results, fields){
				if (results.length  > 0 ) {
					req.session.user = results[0];
					req.session.user.password = undefined;
					delete(req.session.user.password);
					res.redirect('/roles');
				} else {
					req.session.loginMessage = 'invalidLogin';
					res.redirect('/login');
				}
				res.end();
				});
			} else {
				req.session.loginMessage = 'incompleteLogin';
				res.redirect('/login');
			}
	});
	
app.get('/roles', (req, res) => {
		if(req.session.user.role == 'student'){
			req.session.user.courses = [];
		}
		
		if(req.session.user.role == 'instructor'){

			res.redirect('/' + req.session.user.role + '/home');
		}else{

		res.redirect('/' + req.session.user.role);
		}
	});
	

app.listen(3000);