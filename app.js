var express = require('express');
var projection = require('./projection.js')

var app = express();
app.listen(777,function(){
    console.log('node server running on port 777')
});

app.get('/api', function(req,res){
    projection.project(req,res);
});

app.get('/*', function(req,res){
    var params = {
        'error message' : 'API URL must be as -> localhost:777/api?lon=39.611374&lat=24.467611&out_proj=UTM37N'
    };
    res.status(200);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(params));
});

