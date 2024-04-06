const mongoose = require('mongoose')
const connectdb = (url) =>{
    mongoose.connect(url).then(() => console.log("successfully connected to the db")).catch((err) => console.log(err))
}
module.exports = connectdb