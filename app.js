const express = require('express')
const expressHandlebars = require('express-handlebars')
const sqlite3 = require('sqlite3')
const expressSession = require('express-session')

const MOVIE_TITLE_MAX_LENGTH = 100
const ADMIN_USERNAME = "Alice"
const ADMIN_PASSWORD = "abc123"

const db = new sqlite3.Database("pegrade-database.db")

db.run(`
	CREATE TABLE IF NOT EXISTS movies (
		id INTEGER PRIMARY KEY,
		title TEXT,
		grade INTEGER
	)
`)

const app = express()

app.engine('hbs', expressHandlebars.engine({
	defaultLayout: 'main.hbs',
}))

app.use(
	express.static('public')
)

app.use(
	express.urlencoded({
		extended: false
	})
)

app.use(
	expressSession({
		saveUninitialized: false,
		resave: false,
		secret: "fdgfdskdjslakfj"
	})
)

app.use(
	function(request, response, next){
		response.locals.session = request.session
		next()
	}
)

app.get('/', function(request, response){
	response.render('start.hbs')
})

app.get('/movies', function(request, response){
	
	const query = `SELECT * FROM movies`
	
	db.all(query, function(error, movies){
		
		const errorMessages = []
		
		if(error){
			errorMessages.push("Internal server error")
		}
		
		const model = {
			errorMessages,
			movies,
		}
		
		response.render('movies.hbs', model)
		
	})
	
})

app.get("/movies/create", function(request, response){
	response.render("create-movie.hbs")
})

app.post("/movies/create", function(request, response){
	
	const title = request.body.title
	const grade = parseInt(request.body.grade, 10)
	
	const errorMessages = []
	
	if(title == ""){
		errorMessages.push("Title can't be empty")
	}else if(MOVIE_TITLE_MAX_LENGTH < title.length){
		errorMessages.push("Title may be at most "+MOVIE_TITLE_MAX_LENGTH+" characters long")
	}
	
	if(isNaN(grade)){
		errorMessages.push("You did not enter a number for the grade")
	}else if(grade < 0){
		errorMessages.push("Grade may not be negative")
	}else if(10 < grade){
		errorMessages.push("Grade may at most be 10")
	}
	
	if(!request.session.isLoggedIn){
		errorMessages.push("Not logged in")
	}
	
	if(errorMessages.length == 0){
		
		const query = `
			INSERT INTO movies (title, grade) VALUES (?, ?)
		`
		const values = [title, grade]
		
		db.run(query, values, function(error){
			
			if(error){
				
				errorMessages.push("Internal server error")
				
				const model = {
					errorMessages,
					title,
					grade
				}
				
				response.render('create-movie.hbs', model)
				
			}else{
				
				response.redirect("/movies")
				
			}
			
		})
		
	}else{
		
		const model = {
			errorMessages,
			title,
			grade
		}
		
		response.render('create-movie.hbs', model)
		
	}
	
})

// GET /movies/1
// GET /movies/2
app.get("/movies/:id", function(request, response){
	
	const id = request.params.id
	
	const query = `SELECT * FROM movies WHERE id = ?`
	const values = [id]
	
	db.get(query, values, function(error, movie){
		
		const model = {
			movie,
		}
		
		response.render('movie.hbs', model)
		
	})
	
})

app.get("/login", function(request, response){
	response.render("login.hbs")
})

app.post("/login", function(request, response){
	
	const username = request.body.username
	const password = request.body.password
	
	if(username == ADMIN_USERNAME && password == ADMIN_PASSWORD){
		
		request.session.isLoggedIn = true
		
		response.redirect("/")
		
	}else{
		
		const model = {
			failedToLogin: true
		}
		
		response.render('login.hbs', model)
		
	}
	
})

app.listen(8080)