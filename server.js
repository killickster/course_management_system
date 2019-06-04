//server.js

var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var adminRouter = require('./routes/admin');
var instructorRouter = require('./routes/instructor');
var studentRouter = require('./routes/student');
var connection = mysql.createConnection({
	host		: 'localhost',
	user		: 'root',
	password	: 'paSSword123+',
	database	: 'cms'
});

var app = express();
app.set('view engine', 'pug');


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
		res.sendFile(path.join(__dirname + '/public/login.html'));
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
					res.send('Incorrect Username and/or Password!');
				}
				res.end();
				});
			} else {
				res.send('Please enter Username and Password!');
				res.end();
			}
	});
	
app.get('/roles', (req, res) => {
		res.redirect('/' + req.session.user.role);
	});
	
app.listen(3000);