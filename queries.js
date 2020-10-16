const Pool = require('pg').Pool
const jwt = require('jsonwebtoken')
const pool = new Pool({
  user: 'frasamaya',
  host: 'localhost',
  database: 'openclinic',
  password: 'tanpapassword',
  port: 5432,
})

const getSubjects = (request, response) => {
	if(request.headers.authorization){
		try {
			let token = jwt.verify(request.headers.authorization, 'openclinica')
		  pool.query('SELECT study_subject.*,subject.*, status.name as status, study.name FROM study_subject, subject,status, study where study_subject.subject_id = subject.subject_id and status.status_id = study_subject.study_id and study.study_id = study_subject.study_id', (error, results) => {
		    if (error) {
		      throw error
		    }
		    response.status(200).json(results.rows)
		  })
		} catch(err) {
		  response.status(401).json({ message: 'please insert valid token' })
		}
	}else{
		response.status(401).json({ message: 'please insert valid token' })
	}
	
}
const createSubjects = (request, response) => {
	if(request.headers.authorization){
		try {
			let token = jwt.verify(request.headers.authorization, 'openclinica')
			const { subjectId, personId, enrollmentDate, sex, dateOfBirth, studyEvent, startDate } = request.body

		  pool.query('SELECT * FROM subject where unique_identifier = $1', [personId], (error, results) => {
		    if (error) {
		      throw error
		    }
		    if(results.rows.length < 1){
		    	pool.query('insert into subject (status_id, date_of_birth, gender, unique_identifier, date_created, owner_id, dob_collected) values (1, $1, $2, $3, $4, $5, TRUE)  RETURNING subject_id', [dateOfBirth, sex, personId, new Date(), token.id ], (error, result) => {
				    if (error) {
				      throw error
				    };
				    let insertId = result.rows[0].subject_id;
				    pool.query('insert into study_subject (label, subject_id, study_id, status_id, enrollment_date, date_created, owner_id, oc_oid) values ($1, $2, 1, 1, $3, $4, $6, $5)', [subjectId, insertId, enrollmentDate, new Date(), 'SS_'+subjectId.toUpperCase(), token.id ], (error, result) => {
					    if (error) {
					      throw error
					    }
					   response.status(201).json({ message: 'Data has been created' })
					  })
				  })
		    }else{
		    	response.status(401).json({ message: 'Failed. Person already exist' })
		    }
		  })
		 } catch(err) {
		  response.status(401).json({ message: 'please insert valid token' })
		}
	}else{
		response.status(401).json({ message: 'please insert valid token' })
	}
}
const login = (request, response) => {
  const { username, password } = request.body
  var crypto = require('crypto')
	var shasum = crypto.createHash('sha1')
	shasum.update(password)
  pool.query('SELECT * FROM  user_account where user_name = $1 and passwd = $2 ', [username, shasum.digest('hex')], (error, results) => {
    if (error) {
      throw error
    }
    if(results.rows.length < 1){
    	response.status(401).json({ message: 'Login failed, Please check your username and password' })
    }else{
    	let token = jwt.sign({id:results.rows[0].user_id},'openclinica');
    	response.status(201).json({ token: token })
    }
    
  })
}

module.exports = {
  getSubjects,
  createSubjects,
  login
}