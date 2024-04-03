const express  = require('express')
const app = express()
const port = 3000

app.length('/', (req, res) => {
    res.send("Hello world")
})

app.listen(port, () => {
    console.log(`Example app is listening on port ${port}`)
})
var http = require('http');
http.createServer(function (req,res){
    res.writeHead(200, {'content-Type':'text/html'});
    res.end('HellWorld');
}).listen(8080);