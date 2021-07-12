// Entry server for the SPS system
// currently, the ES does all the voronoi calculations and assigns the relevant matcher to clients. 

// still need to implement matcher moving, disconnections, etc.

//imports
const { Console } = require('console');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"]
	}
});
const voronoi = require("./VAST/lib/voronoi/vast_voro.js");

var voro = new voronoi();

var matchersList = {}; // Data structure to store ID, address, port, position of mathchers
var matcherMap = {}; // Map to link socket IDs and Matcher IDs
var matcherID = -1;
var connectionsMap =  {};

//serve html file. clients join via browser
app.get('/', function(req, res)
{
    res.sendFile(__dirname + '/index.html');
});

//handle a connection
io.on('connection', function(socket){
    var tempID = matcherID + 1; // if connecting party is matcher, give them an ID
	console.log("somebody joined, asking for info");

    // request info from connecting party.
	socket.emit('join_info', tempID);
			
    // A matcher is joining
    socket.on('matcher_join', function(info){
        console.log("matcher is attempting to join");
		var socketID = socket.id;
		
		// does socket correspond to an existing matcher?
		if (matcherMap.hasOwnProperty(socketID)){
			var matchID = matcherMap[socketID];
			var matcherInfo = matchersList[matchID];
			socket.emit("existing_matcher", matcherInfo);

			console.log("matcher already exists: " + matcherInfo);

		} else {
			console.log("attempting to add matcher");
			if (!_insertMatcher(socketID, info)){
				console.log("failed to add new matcher");
				socket.disconnect();
			}
		}
    });

	//A client is joining
	socket.on('client_join', function(info){
		console.log('a client is attempting to join');

		if (typeof info.matcher === 'undefined'){
			var matchID = voro.closest_to(info.position);
			var matcher = matchersList[matchID]; // get info of closest matcher
			console.log('found matcher: ');
			console.log(matcher);
			socket.emit('assign_matcher', matcher); // send matcher info to client
		}else{
			console.log('failed to add client');
			socket.disconnect();
		}
	});

	//handle a disconnect
	socket.on('disconnect', function(id){
		//var id = connectionsMap[socket.id];
		//delete connectionInfoList[id];
		//console.log("connection <"+id+"> disconnected");

		return false;
	});

	// move matcher
	socket.on('move_matcher', function(msg){
		
	});

});

//helper functions

var _insertMatcher = function (socketID, info){			
	matcherID++;
	matcherMap[socketID] = matcherID;

	var matcher = new MatcherInfo();
	matcher.id = matcherID;
	matcher.address = info.address;
	matcher.port = info.port;
	matcher.position = info.position;
	
	console.log('inserted matcher: ');
	console.log(matcher);

	var succ = voro.insert(matcher.id, matcher.position);

	if (succ){
		matchersList[matcherID] = matcher;
		console.log("Matcher joined: " + matcher);
		return true;
	}else{
		console.log("matcher join unsuccessful");
		matcherID--;
		return false;
	}
}

http.listen(3000, 'localhost');

// Object Constructors
function MatcherInfo(id, address, port, position){
	this.id = id;
	this.address = this.address;
	this.port = port;
	this.position = this.position;

//	this.toString = function(){
//		return ('ID: '+this.id+' position: ['+this.position.x+','+this.position.y+']')
//	}
};

function Position(x, y){
	this.x = x;
	this.y = y;
}