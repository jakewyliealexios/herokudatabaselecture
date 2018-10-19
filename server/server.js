const express = require('express');
const bodyParser = require('body-parser');

//Node Module that will connect to postgresql
const pg = require('pg');
const url = require('url');

//setup PG to connect to the database
const Pool = pg.Pool;
const pool = new Pool({
    database: 'songs', //database name
    host: 'localhost', //where to find the database
    port: 5432,        //port for finding the database
    max: 10,           //max # of connections for the port
    idleTimeoutMillis: 30000 //30 secs before timeout/cancel query
});

//the following will be handy for troubleshooting, if needed
pool.on('connect', () => {
    console.log('CONNECTED to the database');
})
pool.on('error', (error) => {
    console.log('ERROR with database', error);   
})

//now, to setup EXPRESS as usual
const app = express();

//setup body-parser
app.use( bodyParser.urlencoded({ extended: true}) );
app.use( bodyParser.json() );

//static files ...
app.use( express.static('public/static') );

//setup a GET route to get all the songs from the database
app.get('/songs',  (req, res) => {
    //when all songs are fetched, sort by artist (ASC is implied/alphabetical)
    const sqlText = `SELECT * FROM songs ORDER BY artist`;
    pool.query(sqlText)
        .then( (result) => {
            console.log(`Got stuff back from the database`, result);
            res.send(result.rows);
        })
        .catch( (error) => {
            console.log(`Error making database query ${sqlText}`, error);
            res.sendStatus(500); //good server always responds            
        })
})

//setup a POST rout to add a new song to the databse
app.post('/songs', (req, res) => {
    const newSong = req.body;
    const sqlText = `INSERT INTO songs (rank, artist, track, published) VALUES ($1, $2, $3, $4)`;
    //let sql sanitize your inputs (no Bobby Drop Tables = https://xkcd.com/327/)
    pool.query(sqlText, [newSong.rank, newSong.artist, newSong.track, newSong.published])
        .then( (result) => {
            console.log(`Added song to the database`, newSong);   
        })
        .catch( (error) => {
            console.log(`Error making database query ${sqlText}`, error);
            res.sendStatus(500);
        })
})

const port = process.env.PORT || 5000;
app.listen(port, function () {
    console.log(`Express is now listening on port #${port}...`);
});