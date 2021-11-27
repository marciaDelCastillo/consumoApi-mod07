const path = require('path');
const db = require('../database/models');
const sequelize = db.sequelize;
const { Op } = require("sequelize");
const moment = require('moment');
const fetch = require('node-fetch');


//Aqui tienen otra forma de llamar a cada uno de los modelos
const Movies = db.Movie;
const Genres = db.Genre;
const Actors = db.Actor;
const API = 'http://www.omdbapi.com/';
const APIkey = 'apikey=b81ce4b6';
//const API = 'http://www.omdbapi.com/?i=tt3896198&apikey=b59ecc8e';


const moviesController = {
    'list': (req, res) => {
        db.Movie.findAll({
            include: ['genre']
        })
            .then(movies => {
                res.render('moviesList.ejs', {movies})
            })
    },
    'detail': (req, res) => {
        db.Movie.findByPk(req.params.id,
            {
                include : ['genre']
            })
            .then(movie => {
                res.render('moviesDetail.ejs', {movie});
            });
    },
    'new': (req, res) => {
        db.Movie.findAll({
            order : [
                ['release_date', 'DESC']
            ],
            limit: 5
        })
            .then(movies => {
                res.render('newestMovies', {movies});
            });
    },
    'recomended': (req, res) => {
        db.Movie.findAll({
            include: ['genre'],
            where: {
                rating: {[db.Sequelize.Op.gte] : 8}
            },
            order: [
                ['rating', 'DESC']
            ]
        })
            .then(movies => {
                res.render('recommendedMovies.ejs', {movies});
            });
    },
    //Aqui debo modificar para crear la funcionalidad requerida
    'buscar': async (req, res) => {
        let query = req.body.titulo;
        try{
            let movie = await Movies.findOne({
                where:{
                    title: {
                        [Op.substring]: query,
                      },
                }
                
            });
            if(movie){
                res.render("moviesDetail",{
                    movie
                })
            }else
            {
                let response = await fetch(API+"?t="+query+"&"+APIkey);
                let result = await response.json();
                movie = {
                    Poster: result.Poster,
                    Title: result.Title,
                    Awards: result.Awards,
                    Year: result.Year,
                    Runtime: result.Runtime
                };
                res.render("moviesDetailOmdb",{
                    movie
                })
            }
            
            
        }catch(error){
            console.log(error);
        }

    },
    //Aqui dispongo las rutas para trabajar con el CRUD
    add: async (req, res) =>{
        try{
            let response = await fetch("http://127.0.0.1:3001/api/genres");
            let result = await response.json();
            let allGenres = result.data;
            response = await fetch("http://127.0.0.1:3001/api/actors");
            result = await response.json();
            let allActors = result.data;
            return res.render(path.resolve(__dirname, '..', 'views',  'moviesAdd'), {allGenres,allActors})
        }catch(error){
            console.log(error);
        }
    },
    create: async (req,res) =>{
        try{
            let response = await fetch("http://127.0.0.1:3001/api/movies/create",
            {
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                },
                method: "POST",
                body: JSON.stringify(req.body)
            });
            let result = await response.json();
            return res.redirect("/movies");
        }catch(error){
            console.log(error);
        }
    },
    edit: async (req,res)=> {
        try{
            let response = await fetch("http://127.0.0.1:3001/api/genres");
            let result = await response.json();
            let allGenres = result.data;
            response = await fetch("http://127.0.0.1:3001/api/actors");
            result = await response.json();
            let allActors = result.data;
            response = await fetch("http://127.0.0.1:3001/api/movies/"+req.params.id);
            result = await response.json();
            let Movie = result.data;
            return res.render(path.resolve(__dirname, '..', 'views',  'moviesEdit'), {Movie,allGenres,allActors})
        }catch(error){
            console.log(error);
        }
    },
    update: async (req,res) =>{
        let movieId = req.params.id;
        try{
            let response = await fetch("http://127.0.0.1:3001/api/movies/update/"+movieId,
            {
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                },
                method: "PUT",
                body: JSON.stringify(req.body)
            });
            let result = await response.json();
            return res.redirect("/movies");
        }catch(error){
            console.log(error);
        }
        
    },
    delete: (req,res) =>{
        let movieId = req.params.id;
        Movies
        .findByPk(movieId)
        .then(Movie => {
            return res.render(path.resolve(__dirname, '..', 'views',  'moviesDelete'), {Movie})})
        .catch(error => res.send(error))
    },
    destroy: async (req,res)=> {
        let movieId = req.params.id;
        try{
            let response = await fetch("http://127.0.0.1:3001/api/movies/delete/"+movieId,
            {
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                },
                method: "DELETE",
                //body: JSON.stringify(req.body)
            });
            let result = await response.json();
            return res.redirect("/movies");
        }catch(error){
            console.log(error);
        }
        /* let movieId = req.params.id;
        Movies
        .destroy({where: {id: movieId}, force: true}) // force: true es para asegurar que se ejecute la acción
        .then(()=>{
            return res.redirect('/movies')})
        .catch(error => res.send(error))  */
    }
}

module.exports = moviesController;