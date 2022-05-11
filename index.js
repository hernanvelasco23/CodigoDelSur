const express = require('express');
const fs = require('fs');
const jwt = require("jsonwebtoken");
const axios = require('axios');
const auth = require("./middleware/auth");
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const app = express();
dotenv.config();

app.use(express.json());

app.post('/user', (req, res)=> {

    // Get user fields
    const { firstname, lastname, email, password } = req.body;

    // Validate user fields not empty
    if (!(email && password && firstname && lastname)) {
        return res.status(400).send("All fields are required");
    }

    //validate email
    const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const valid = regex.test(email);

    if(!valid)
        return res.status(400).send("The email field is invalid.");

    const encriptedPwd = bcrypt.hashSync(password, 5);

    const user = {
        email: email,
        firstname: firstname,
        lastname: lastname,
        password: encriptedPwd
    }

    //read the file
    fs.readFile('./files/user.txt', 'utf8', (err, data) => {

        if (err) {
            console.log(`Error reading file: ${err}`);
            return res.status(500).json(err);
        } 
        else {

            // parse JSON string to JSON object
            const users = JSON.parse(data);

            var exist = users.find(o => o.email === user.email);

            if(!exist)
            {
                users.push(user);
                // write new data back to the file
                fs.writeFile('./files/user.txt', JSON.stringify(users, null, 2), (err) => {
                    if (err) {
                        console.log(`Error writing file: ${err}`);
                        return res.status(500).json(err);
                    }
                });

                // return new user
                return res.status(201).json(user);
            }
            else
                return res.status(409).send("User Already Exist. Please Login");
        }

    });
    
});

app.post('/login', (req, res) => {

    // Get user input
    const { email, password } = req.body;

    // Validate user input
    if (!(email && password )) {
        return res.status(400).send("All input is required");
    }

    fs.readFile('./files/user.txt', 'utf8', (err, data) => {

        if (err) {
            console.log(`Error reading file: ${err}`);
            return res.status(500).json(err);
        } else {
    
            // parse JSON string to JSON object
            const users = JSON.parse(data);
    
            var dbUser = users.find(o => o.email === req.body.email);
    
            // add a new record
            if(dbUser)
            {
                if(bcrypt.compareSync(password, dbUser.password))
                {

                    let jwtSecretKey = process.env.JWTSECRETKEY;
                    let data = {
                        time: Date(),
                        userId: 12,
                    }
                  
                    const token = jwt.sign(data, jwtSecretKey);
                  
                    res.send(token);
                }
                else
                {
                    return res.status(400).send('user or password is incorrect.');
                }
            }
            else
            {
                return res.status(400).send('user does not exist.')
            }
        }
        });
});

app.get('/movies', auth,  async (req, res, next)=>{
    try {
        
        const data = await getMovies(req.body.keyword ? req.body.keyword : '');

        return res.status(200).json({
          status:200,
          message: `${data.length} movies found`, 
          data
        })
      } catch (err) {
        return next(err);
      }
})

const getMovies = async (keyword) => {

    var query = keyword ? `https://api.themoviedb.org/3/search/multi?api_key=${process.env.API_KEY}&query=${keyword}&page=1`:
    `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.API_KEY}&page=1`

    try {
      let result;
      await axios
        .get(
          query
        )
        .then((response) => {

          result = JSON.parse(JSON.stringify(response.data.results)).map(item => ({ ...item, suggestionScore: Math.floor(Math.random() * 99) + 1 }));
          result = result.sort((a, b) => a['suggestionScore'] < b['suggestionScore'] ? -1 : 1);

        })
        .catch((error) => {
          console.log(error);
        });
      return result;
    } catch (error) {
      console.error(error);
    }
};

app.post('/favorites', auth, (req, res)=> {

    var result = JSON.parse(JSON.stringify(req.body));
    result.addedAt = new Date();
        
    //read the file
    fs.readFile('./files/favorites.txt', 'utf8', (err, data) => {

        if (err) {
            console.log(`Error reading file: ${err}`);
            return res.status(500).json(err);
        } 
        else {

            // parse JSON string to JSON object
            const favorites = JSON.parse(data);

            favorites.push(result);

            fs.writeFile('./files/favorites.txt', JSON.stringify(favorites, null, 2), (err) => {
                if (err) {
                    console.log(`Error writing file: ${err}`);
                }
            });
            
            return res.status(201).send("Movie added correctly.");;
        }

    });
    
});

app.get('/favorites', auth, (req, res)=> {
    
    //read the file
    try
    {
        fs.readFile('./files/favorites.txt', 'utf8', (err, data) => {

            if (err) {
                console.log(`Error reading file: ${err}`);
                return res.status(500).json(err);
            }

            result = JSON.parse(data).map(item => ({ ...item, suggestionForTodayScore: Math.floor(Math.random() * 99) + 1 }));
            result = result.sort((a, b) => a['suggestionForTodayScore'] < b['suggestionForTodayScore'] ? -1 : 1);

            return res.status(200).json(result);

        });
    }
    catch (err) {
        return res.status(500).json(err);
    }

});

app.listen(process.env.PORT, () => {
    console.log(`Server on port ${process.env.PORT}`);
});

module.exports = app;

