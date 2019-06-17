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


router.get('/classes', (req,res) => {
    console.log('searching classes')


    //initalize a list of course_ids the student is not eligable to register for
    req.session.user.uneligible = []


    connection.query('SELECT * FROM classes', (error,results,fields) => {
        for(j = 0; j < results.length; j++){
        connection.query('SELECT * FROM prereqs WHERE course_id=?', [results[j].course_id], (error,results,fields) => {
            for(i = 0; i < results.length; i++){
                const course_id = results[0].course_id
                connection.query('SELECT * FROM courses_taken WHERE course_id=?', [results[0].prereq_id], (error,results,fields) => {
                    console.log(results.length)
                    if(results.length == 0){
                        if(!req.session.user.uneligible.includes(course_id)){
                            req.session.user.uneligible.push(course_id)
                            req.session.save()
                        }
                    }
                })
            }
    })
}


    res.render('courseRegistrationStudent.pug', {classes:req.session.user.availibleClasses})

})

})


router.post('/requestClass', (req,res) => {
    var class_id = req.body.class_id;

    connection.query('SELECT * FROM classes WHERE class_id=?',[class_id], (error,results,fields) => {
        if(!req.session.user.uneligible.includes(results[0].course_id)){
            const class_id = results[0].class_id

            connection.query('SELECT * FROM has_enrolled WHERE student_id=? AND class_id=?', [req.session.user.user_id, class_id], (error,results,fields) => {
                if(results.length==0){

                    console.log('registering')
                    connection.query('INSERT INTO `has_enrolled` (`class_id`, `student_id`) VALUES ( \''+class_id+'\',\''+req.session.user.user_id+'\')');
                    req.session.user.classes = req.session.user.classes.filter((val) => {
                        console.log(val.class_id === class_id)
                        return (val.class_id === class_id);
                    })
                }
    })
    }
    console.log(req.session.user.uneligible)
})

})


module.exports = router;