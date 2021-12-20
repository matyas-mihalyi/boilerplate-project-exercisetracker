const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { createNewUser, getAllUsers, addExerciseData, getLog, runAsyncWrapper } = require('./utils.js');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(bodyParser.urlencoded({extended: false}));

app.use(cors());

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//create a new user
app.post('/api/users', runAsyncWrapper(async(req, res)=> {
  const newUserName = req.body.username;
  const newUser = await createNewUser(newUserName);
  res.json({username: newUser.username, _id: newUser._id})
}));

//get the list of users
app.get('/api/users', runAsyncWrapper(async(req, res)=> {
  const allUsers = await getAllUsers();
  res.json(allUsers)
}));

//add description, duration, date to log 
app.post('/api/users/:_id/exercises', runAsyncWrapper(async(req, res)=> {
  res.json(await addExerciseData(req.body, req.params._id));
}));

//get logs
app.get('/api/users/:_id/logs', runAsyncWrapper(async(req, res)=> {  
  res.json(await getLog(req.params._id, req.query));
}));

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
