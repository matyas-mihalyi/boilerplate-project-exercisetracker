function runAsyncWrapper (callback) {
  return function (req, res, next) {
    callback(req, res, next)
      .catch(next)
  };
};

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const { Schema } = mongoose;

//Schema and Model defintion
const userSchema = new Schema({
  username: {type: String, required: true},
  count: Number,
  log: [{
    description: String,
    duration: Number,
    date: Date,
  }]
});

const User = mongoose.model('User', userSchema);


//Creating a new user

async function createNewUser (usernameInput = '') {
  const newUser = new User({username: usernameInput, count: 0, log: []});
  await newUser.save();
  return newUser;
};

async function getAllUsers () {
  const allUsers = await User.find().select({'username': 1, '_id': 1});
  return allUsers;
};

//Add exercise data and return it with username and _id
async function addExerciseData (data, id) {
  const { description } = data;
  const date = getDate(data.date);
  const duration = Number(data.duration);

  User.findByIdAndUpdate(id, { 
    $push: {
      log:
      {
        description: description,
        duration: duration,
        date: new Date(date)
      }
    },
    $inc: { 
      count: 1
    }
    },
    (err) => {
      if (err) console.error(err);
    }
  );

  const user = await User.findById(id);

  const response = {
    username: user.username,
    description: description,
    duration: duration,
    date: new Date(date).toDateString(),
    _id: user._id
  }
  return response;

};

//Get all exercise data of a user
async function getLog (userId = '', queries = {}) {
  const fromDate = isValidDate(new Date(queries.from)) ? new Date(queries.from) : false;
  const toDate = isValidDate(new Date(queries.to)) ? new Date(queries.to) : false;
  const limit = Number(queries.limit) || 500;
  console.log(fromDate)
  console.log(toDate)
  console.log(limit)

  
  let dateFilter = {};
  if (fromDate) {
    dateFilter['$gte'] = ['$$log.date', fromDate];
  }
  if (toDate) {
    dateFilter['$lte'] = ['$$log.date', toDate];
  }

  console.log(dateFilter)
  // console.log(filter.log)
  
  // const userData = await User.findById(userId);
  const userData = await User.aggregate([
    {
      '$match': {
        '_id': new ObjectId(userId)
      }
    },
    {$project: {
      username: true,
      count: true,
      _id:true,
      log: { $filter: {
        input: '$log',
        as: 'log',
        cond: dateFilter
      }},
      log : { $slice: ['$log', limit]},
    }},
  ]);

  userData[0].log.map(log => {
    log.date = log.date.toDateString();
    console.log(log.date);
    return log;
  })
  

  return userData[0];
};


function getDate(inputDate = '') {
  return isValidDate(inputDate) ?
  inputDate
  :
  Date.now()
};

function isValidDate(inputDate) {
  const date = new Date(inputDate) 
  return date instanceof Date && !isNaN(date.valueOf());
};


module.exports={ 
  createNewUser,
  getAllUsers,
  addExerciseData,
  getLog,
  runAsyncWrapper 
}



/*

6. GET /api/users/:_id/logs
  parameters: from, to, limit
  from & to: yyyy-mm-dd format dates
  limit: integer -> max this many logs will be sent back

*/