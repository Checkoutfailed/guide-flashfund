const express = require('express');
const cors = require('cors')
const app = express();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { default: axios } = require('axios');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors())
app.use(cookieParser());

app.use(express.static(__dirname + '/static'));
const config = JSON.parse(fs.readFileSync(__dirname + '/config.json', 'utf8'));


config.port = process.env.PORT || config.port || 3000;
config.host = process.env.HOST || config.host || 'localhost';

app.listen(config.port, config.host);
console.log(`Listening on ${config.host}:${config.port}`);



app.get('/', async (req, res)=>{
    console.log(req.cookies['x-access-token'])
    const token = req.cookies['x-access-token'];

    const _token = req.query.auth;



    if(!token && !_token) return res.redirect('/login');

    if(_token) {
        res.cookie('x-access-token', _token, {maxAge:90000, httpOnly:false});

        return res.redirect('/');
    }

    try {
        const isAuthenticated = await axios({
            method:"GET",
            url: "https://reliant-admin.herokuapp.com/api/v1/user/info",
            headers: {
                clientId:27590,
                Authorization: token
            }
        })

        console.log(isAuthenticated.data)
        if(isAuthenticated.data.success == false) return res.redirect('/login');

        if(isAuthenticated.data.isUser == false) return res.redirect('/login');
        
        return res.sendFile(path.join(__dirname, '/static/guide.html'));
    } catch (error) {
        return res.redirect('/login');
    }
});

app.get('/login', async (req, res) => {
    try {
        const response = await axios({
            method:"GET",
            url:"https://reliant-admin.herokuapp.com/login",
            headers: {
                callback: "http://localhost:3000/"
            }
        });

        const data = response.data;

        return res.redirect(data.loginUrl);
    } catch (error) {
        return error;
    }
});

app.get('*', function(req, res){
    res.redirect('/')
});