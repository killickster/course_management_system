//server.js

var mysql = require('mysql');
var express = require('express');
var router = express.Router();
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');

var connection = mysql.createConnection(JSON.parse(fs.readFileSync('db/db.json')));

//check if user is logged in and has admin role
var sessionChecker = (req, res, next) => {
	if (!req.session.user || req.session.user.role != 'admin') {
		req.session.loginMessage = 'noAccess';
		res.redirect('/login');
	}
	else {
		next();
	}
};

//display admin homepage
router.route('/')
	.get(sessionChecker, (req, res) => {
		message = req.session.loginMessage;
		req.session.loginMessage = undefined;
		delete(req.session.loginMessage);
		res.render('adminHome', { name: req.session.user.first_name, message : message});
	})
	.post((req, res) => {
		res.redirect('/admin/'+req.body.button_id);
	})

//create new user
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
						var password = Math.random().toString(36).slice(2);  //generate random password as alphanumeric string
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

//add or remove prerequisites for existing course
router.route('/editPrereq').get(sessionChecker, (req,res) => {
	connection.query('SELECT courses.course_id, departments.dept_abbv, courses.course_num, courses.course_name FROM courses, departments WHERE courses.dept_id = departments.dept_id', (error, results, fields) => {
		req.session.courseSelected = 0;
		req.session.courses = JSON.parse(JSON.stringify(results));
		res.render('editPrereq', { courses:req.session.courses, courseSelected:req.session.courseSelected});
	})
}).post((req, res) => {
	if (req.session.courseSelected == 0 && req.body.course_selected != 'void') {
		req.session.selected_course = JSON.parse(req.body.course_selected);
		req.session.courseSelected = req.session.selected_course.course_id;
		var courseSelected = req.session.selected_course.course_id;
	}
	var buttonPressed = req.body.button_id;
	if(buttonPressed == 'select' && courseSelected != 0){				//display prerequisites for selected course and courses to add as prerequisites
		connection.query('SELECT prereq_id, dept_abbv, course_num, course_name FROM prereqs, courses, departments WHERE prereqs.course_id = ? and prereqs.prereq_id = courses.course_id and departments.dept_id = courses.dept_id', req.session.courseSelected, (error, prereqs, fields) => {
			var q = 'SELECT course_id, dept_abbv, course_num, course_name FROM courses, departments WHERE courses.course_id != ? AND departments.dept_id = courses.dept_id';
			if (prereqs.length > 0) {
				var prereq_ids = prereqs.map(a => a.prereq_id);
				q = q + ' AND courses.course_id NOT IN (' + prereq_ids.join(',') + ')';
			}
			connection.query(q, req.session.courseSelected, (error, notPrereqs, fields) => {
				res.render('editPrereq',{ courseSelected : courseSelected, selected_course : req.session.selected_course, prereqs : prereqs, notPrereqs : notPrereqs} );
			})
		})
	} else if(buttonPressed == 'add'){									//add selected prerequisite; update and reload page
		var prereqToAdd = JSON.parse(req.body.course_to_add);
		var prereqToAddId = prereqToAdd.course_id;
		connection.query('INSERT INTO prereqs (course_id, prereq_id) VALUES (?, ?)', [courseSelected, prereqToAddId]);
		connection.query('SELECT prereq_id, dept_abbv, course_num, course_name FROM prereqs, courses, departments WHERE prereqs.course_id = ? and prereqs.prereq_id = courses.course_id and departments.dept_id = courses.dept_id', req.session.courseSelected, (error, prereqs, fields) => {
			var q = 'SELECT course_id, dept_abbv, course_num, course_name FROM courses, departments WHERE courses.course_id != ? AND departments.dept_id = courses.dept_id';
			if (prereqs.length > 0) {
				var prereq_ids = prereqs.map(a => a.prereq_id);
				q = q + ' AND courses.course_id NOT IN (' + prereq_ids.join(',') + ')';
			}
			connection.query(q, req.session.courseSelected, (error, notPrereqs, fields) => {
				res.render('editPrereq',{ courseSelected : courseSelected, selected_course : req.session.selected_course, prereqs : prereqs, notPrereqs : notPrereqs} );
			})
		})
	} else if(buttonPressed.startsWith('remove')){						//remove selected prerequisite; update and reload page
		var prereqIdToRemove = parseInt(buttonPressed.replace('remove',''));
		connection.query('DELETE FROM prereqs WHERE course_id = ? AND prereq_id = ?', [courseSelected, prereqIdToRemove]);
		connection.query('SELECT prereq_id, dept_abbv, course_num, course_name FROM prereqs, courses, departments WHERE prereqs.course_id = ? and prereqs.prereq_id = courses.course_id and departments.dept_id = courses.dept_id', req.session.courseSelected, (error, prereqs, fields) => {
			var q = 'SELECT course_id, dept_abbv, course_num, course_name FROM courses, departments WHERE courses.course_id != ? AND departments.dept_id = courses.dept_id';
			if (prereqs.length > 0) {
				var prereq_ids = prereqs.map(a => a.prereq_id);
				q = q + ' AND courses.course_id NOT IN (' + prereq_ids.join(',') + ')';
			}
			connection.query(q, req.session.courseSelected, (error, notPrereqs, fields) => {
				res.render('editPrereq',{ courseSelected : courseSelected, selected_course : req.session.selected_course, prereqs : prereqs, notPrereqs : notPrereqs} );
			})
		})
	} else {
			req.session.courses = undefined;
			delete(req.session.courses);
			res.redirect('/');
	}
})

//add or remove required courses from program
router.route('/editProgram').get(sessionChecker, (req,res) => {
	connection.query('SELECT program_id, program_name, program_abbv FROM programs', (error, results, fields) => {
		req.session.programSelected = 0;
		req.session.programs = JSON.parse(JSON.stringify(results));
		res.render('editProgram', { programs:req.session.programs, programSelected:req.session.programSelected});
	})
}).post((req, res) => {
	if (req.session.programSelected == 0 && req.body.program_selected != 'void') {
		req.session.selected_program = JSON.parse(req.body.program_selected);
		req.session.programSelected = req.session.selected_program.program_id;
		var programSelected = req.session.selected_program.program_id;
	}
	var buttonPressed = req.body.button_id;
	if(buttonPressed == 'select' && programSelected != 0){
		connection.query('SELECT courses.course_id, dept_abbv, course_num, course_name FROM program_has, courses, departments WHERE program_has.program_id = ? and program_has.course_id = courses.course_id and departments.dept_id = courses.dept_id', req.session.programSelected, (error, requirements, fields) => {
			var q = 'SELECT course_id, dept_abbv, course_num, course_name FROM courses, departments WHERE departments.dept_id = courses.dept_id';
			if (requirements.length > 0) {
				var requirement_ids = requirements.map(a => a.course_id);
				q = q +  ' AND courses.course_id  NOT IN (' + requirement_ids.join(',') + ')';
			}
			connection.query(q, (error, notRequirements, fields) => {
				res.render('editProgram',{ programSelected : programSelected, selected_program : req.session.selected_program, requirements : requirements, notRequirements : notRequirements } );
			})
		})
	} else if(buttonPressed == 'add'){
		var requirementToAdd = JSON.parse(req.body.course_to_add);
		var requirementToAddId = requirementToAdd.course_id;
		connection.query('INSERT INTO program_has (program_id, course_id) VALUES (?, ?)', [programSelected, requirementToAddId]);
		connection.query('SELECT courses.course_id, dept_abbv, course_num, course_name FROM program_has, courses, departments WHERE program_has.program_id = ? and program_has.course_id = courses.course_id and departments.dept_id = courses.dept_id', req.session.programSelected, (error, requirements, fields) => {
			var q = 'SELECT course_id, dept_abbv, course_num, course_name FROM courses, departments WHERE departments.dept_id = courses.dept_id';
			if (requirements.length > 0) {
				var requirement_ids = requirements.map(a => a.course_id);
				q = q +  ' AND courses.course_id  NOT IN (' + requirement_ids.join(',') + ')';
			}
			connection.query(q, (error, notRequirements, fields) => {
				res.render('editProgram',{ programSelected : programSelected, selected_program : req.session.selected_program, requirements : requirements, notRequirements : notRequirements } );
			})
		})
	} else if(buttonPressed.startsWith('remove')){
		var requirementIdToRemove = parseInt(buttonPressed.replace('remove',''));
		connection.query('DELETE FROM program_has WHERE program_id = ? AND course_id = ?', [programSelected, requirementIdToRemove]);
		connection.query('SELECT courses.course_id, dept_abbv, course_num, course_name FROM program_has, courses, departments WHERE program_has.program_id = ? and program_has.course_id = courses.course_id and departments.dept_id = courses.dept_id', req.session.programSelected, (error, requirements, fields) => {
			var q = 'SELECT course_id, dept_abbv, course_num, course_name FROM courses, departments WHERE departments.dept_id = courses.dept_id';
			if (requirements.length > 0) {
				var requirement_ids = requirements.map(a => a.course_id);
				q = q +  ' AND courses.course_id  NOT IN (' + requirement_ids.join(',') + ')';
			}
			connection.query(q, (error, notRequirements, fields) => {
				res.render('editProgram',{ programSelected : programSelected, selected_program : req.session.selected_program, requirements : requirements, notRequirements : notRequirements } );
			})
		})
	} else {
			req.session.programs = undefined;
			delete(req.session.courses);
			res.redirect('/');
	}
})

//create new class section for existing course
router.route('/newClass').get(sessionChecker, (req,res) => {
	connection.query('SELECT courses.course_id, departments.dept_abbv, courses.course_num, courses.course_name FROM courses, departments WHERE courses.dept_id = departments.dept_id', (error, results, fields) => {
		var courseSelected = 0;
		req.session.courses = JSON.parse(JSON.stringify(results));
		res.render('newClass', {courses:req.session.courses, courseSelected:courseSelected});
	})
}).post((req, res) => {
	var buttonPressed = req.body.button_id;
	var course_id = req.body.course_id;
	if(buttonPressed== 'select' && course_id[0] != "void"){		
		var courseSelected = course_id;
		res.render('newClass',{courses:req.session.courses,courseSelected:courseSelected} )
	}
	else if(buttonPressed=='submit'){
		var schoolYear = req.body.year;
		var section = req.body.section;
		var sectionType = req.body.section_type;
		var sessionStart = req.body.section_start;
		if(schoolYear && section && sectionType && sessionStart){
			connection.query('INSERT INTO classes (`course_id`, `schoolyear`, `sect`, `sect_type`, `sess_start`) VALUES (?,?,?,?,?)', [course_id, schoolYear,section, sectionType, sessionStart]);
			req.session.newClassMessage = 'success';
			res.redirect('newClass');
		}
	} else {
			req.session.courses = undefined;
			delete(req.session.courses);
			res.redirect('/');
	}
})

//create new department
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
	
//create new course
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
			console.log(req.body.len);
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

//create new program
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
						res.redirect('newProgram');
					}
				});
			} else {
				req.session.progMessage = 'missingField';
				res.redirect('newProgram');
			}
		} else {
			res.redirect('/');
		}
	});

//approve or deny requests by instructors to teach courses
router.route('/approveRequests')
	.get(sessionChecker, (req, res) => {
		connection.query('SELECT users.user_id, users.first_name, users.last_name, departments.dept_abbv, courses.course_num, classes.class_id FROM users, departments, courses, teach_request, classes WHERE teach_request.instructor_id = users.user_id AND teach_request.class_id = classes.class_id AND classes.course_id = courses.course_id AND courses.dept_id = departments.dept_id', function(error, results, fields){
			res.render('approveRequests', { requests : results });
		});
	})
	.post((req, res) => {
		var buttonPressed = JSON.parse(req.body.button_id);
		var class_id = buttonPressed.class_id;
		var instructor_id = buttonPressed.instructor_id;
		if (buttonPressed.action == 'approve'){
			connection.query('INSERT INTO has_teaching (class_id, instructor_id) VALUES (?, ?)', [class_id, instructor_id]);
			connection.query('DELETE FROM teach_request WHERE class_id = ? AND instructor_id = ?', [class_id, instructor_id]);
		} else if (buttonPressed.action == 'deny'){
			connection.query('DELETE FROM teach_request WHERE class_id = ? AND instructor_id = ?', [class_id, instructor_id]);
		} else res.redirect('/');
		connection.query('SELECT users.user_id, users.first_name, users.last_name, departments.dept_abbv, courses.course_num, classes.class_id FROM users, departments, courses, teach_request, classes WHERE teach_request.instructor_id = users.user_id AND teach_request.class_id = classes.class_id AND classes.course_id = courses.course_id AND courses.dept_id = departments.dept_id', function(error, results, fields){
			res.render('approveRequests', { requests : results });
		});
	})

//view an instructor's course load
router.route('/viewInstructor')
	.get(sessionChecker, (req, res) => {
		req.session.instructorSelected = 0;
		connection.query('SELECT user_id, first_name, last_name FROM users WHERE role = "instructor"', (error, results, fields) => {
			req.session.instructors = results;
			res.render('viewInstructor', { instructorSelected : req.session.instructorSelected, instructors : results});
		});
	})
	.post((req, res) => {
		var buttonPressed = req.body.button_id;
		if (buttonPressed == 'select') {
			if (req.body.instructor_selected != 'void') {
				var selectedInstructor = JSON.parse(req.body.instructor_selected);
				req.session.instructorSelected = selectedInstructor.user_id;
				connection.query('SELECT departments.dept_abbv, courses.course_num, classes.class_id FROM departments, courses, classes, has_teaching WHERE has_teaching.instructor_id = ? AND has_teaching.class_id = classes.class_id AND classes.course_id = courses.course_id AND courses.dept_id = departments.dept_id', [req.session.instructorSelected], (error, results, fields) => {
					res.render('viewInstructor', { instructorSelected : req.session.instructorSelected, instructors : req.session.instructors, selectedInstructor : selectedInstructor , classes : results});
				});
			} else { 
				res.render('viewInstructor', { instructorSelected : req.session.instructorSelected, instructors : results});
			}
		} else {
			res.redirect('/');
		}
	})

//edit a student's course records to confirm prerequisites
router.route('/editStudent').get(sessionChecker, (req,res) => {
	connection.query('SELECT user_id, first_name, last_name FROM users WHERE role = \'student\'', (error, results, fields) => {
		req.session.studentSelected = 0;
		req.session.students = JSON.parse(JSON.stringify(results));
		res.render('editStudent', { students:req.session.students, studentSelected:req.session.studentSelected});
	})
}).post((req, res) => {
	if (req.session.studentSelected == 0) {
		if (req.body.student_selected != 'void') {
			req.session.selected_student = JSON.parse(req.body.student_selected);
			req.session.studentSelected = req.session.selected_student.user_id;
			var studentSelected = req.session.selected_student.user_id;
		}
	}
	var buttonPressed = req.body.button_id;
	if(buttonPressed == 'select' && studentSelected != 0){
		connection.query('SELECT courses_taken.course_id, departments.dept_abbv, courses.course_num, courses.course_name FROM courses_taken, courses, departments WHERE courses_taken.student_id = ? AND courses_taken.course_id = courses.course_id AND departments.dept_id = courses.dept_id', req.session.studentSelected, (error, coursesTaken, fields) => {
			var q = 'SELECT course_id, dept_abbv, course_num, course_name FROM courses, departments WHERE departments.dept_id = courses.dept_id';
			if (coursesTaken.length > 0) {
				var course_ids = coursesTaken.map(a => a.course_id);
				q = q + ' AND courses.course_id NOT IN (' + course_ids.join(',') + ')';
			}
			connection.query(q, (error, notTaken, fields) => {
				res.render('editStudent',{ studentSelected : studentSelected, selected_student : req.session.selected_student, coursesTaken : coursesTaken, notTaken : notTaken} );
			})
		})
	} else if(buttonPressed == 'add'){
		var courseToAdd = JSON.parse(req.body.course_to_add);
		var courseToAddId = courseToAdd.course_id;
		connection.query('INSERT INTO courses_taken (student_id, course_id) VALUES (?, ?)', [studentSelected, courseToAddId]);
		connection.query('SELECT courses_taken.course_id, departments.dept_abbv, courses.course_num, courses.course_name FROM courses_taken, courses, departments WHERE courses_taken.student_id = ? AND courses_taken.course_id = courses.course_id AND departments.dept_id = courses.dept_id', req.session.studentSelected, (error, coursesTaken, fields) => {
			var q = 'SELECT course_id, dept_abbv, course_num, course_name FROM courses, departments WHERE departments.dept_id = courses.dept_id';
			if (coursesTaken.length > 0) {
				var course_ids = coursesTaken.map(a => a.course_id);
				q = q + ' AND courses.course_id NOT IN (' + course_ids.join(',') + ')';
			}
			connection.query(q, (error, notTaken, fields) => {
				res.render('editStudent',{ studentSelected : studentSelected, selected_student : req.session.selected_student, coursesTaken : coursesTaken, notTaken : notTaken} );
			})
		})
	} else if(buttonPressed.startsWith('remove')){
		var courseIdToRemove = parseInt(buttonPressed.replace('remove',''));
		connection.query('DELETE FROM courses_taken WHERE student_id = ? AND course_id = ?', [studentSelected, courseIdToRemove]);
		connection.query('SELECT courses_taken.course_id, departments.dept_abbv, courses.course_num, courses.course_name FROM courses_taken, courses, departments WHERE courses_taken.student_id = ? AND courses_taken.course_id = courses.course_id AND departments.dept_id = courses.dept_id', req.session.studentSelected, (error, coursesTaken, fields) => {
			var q = 'SELECT course_id, dept_abbv, course_num, course_name FROM courses, departments WHERE departments.dept_id = courses.dept_id';
			if (coursesTaken.length > 0) {
				var course_ids = coursesTaken.map(a => a.course_id);
				q = q + ' AND courses.course_id NOT IN (' + course_ids.join(',') + ')';
			}
			connection.query(q, (error, notTaken, fields) => {
				res.render('editStudent',{ studentSelected : studentSelected, selected_student : req.session.selected_student, coursesTaken : coursesTaken, notTaken : notTaken} );
			})
		})
	} else {
			req.session.students = undefined;
			delete(req.session.students);
			res.redirect('/');
	}
})


//change user password
router.route('/changePass')
	.get(sessionChecker, (req, res) => {
		message = req.session.passMessage;
		req.session.passMessage = undefined;
		delete(req.session.passMessage);
		res.render('changePass', {message : message, role: req.session.user.role });
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

//logout and remove user session data
router.route('/logout')
	.get((req, res) => {
		req.session.user = undefined;
		delete(req.session.user);
		req.session.loginMessage = 'loggedOut';
		res.redirect('/login');
	})

module.exports = router;