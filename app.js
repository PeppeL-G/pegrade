const express = require('express')
const expressHandlebars = require('express-handlebars')
const data = require('./data.js')

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

app.get('/', function(request, response){
	response.render('start.hbs')
})

app.get('/movies', function(request, response){
	
	const model = {
		movies: data.movies
	}
	
	response.render('movies.hbs', model)
	
})

app.get("/movies/create", function(request, response){
	response.render("create-movie.hbs")
})

app.post("/movies/create", function(request, response){
	
	const title = request.body.title
	const grade = request.body.grade
	
	data.movies.push({
		id: data.movies.at(-1).id + 1,
		title: title,
		grade: grade
	})
	
	response.redirect("/movies")
	
})

// GET /movies/1
// GET /movies/2
app.get("/movies/:id", function(request, response){
	
	const id = request.params.id
	
	const movie = data.movies.find(m => m.id == id)
	
	const model = {
		movie: movie,
	}
	
	response.render('movie.hbs', model)
	
})

app.listen(8080)