#!/usr/bin/env node
var WebSocketClient = require('websocket').client;
var http = require('http');
var client = new WebSocketClient();
var connectionState = "connecting"; client.on('connectFailed', function(error) { console.log('Connect Error: ' + error.toString()); });

client.on('connect', function(connection) {
    console.log('WebSocket client connected');
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('Connection Closed');
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
           	processWS(message.utf8Data); 
        }
    });

    function sendAuth() {
	
        if (connection.connected && connectionState == "connecting") {
            console.log('sending authorization ', connectionState, connection.connected);
	    connectionState = "connecting";
	    var auth = {auth:{username:"bryan",key:"password"}, subscription: "test"}; 
		connection.sendUTF(JSON.stringify(auth));
            setTimeout(sendAuth, 5000);
        }
    }
    sendAuth();
});


function processWS(data)
{
	wsmessage = JSON.parse(data);
	console.log(wsmessage.status);
	if(wsmessage.status == 200 && connectionState == "connecting"){
	connectionState = "connected";
	console.log('setting state to ', connectionState);
	}else if(wsmessage.request == 'notification'){
	console.log('Received a notification');
	console.log(wsmessage);
	}else{
	console.log('error in data');
	}
	
}

client.connect('ws://localhost:9091/', 'ws-tunnel');
//Every 5 seconds post to the api
setInterval(function(){
	var options = {
  	host: 'localhost',
  	port: 9090,
  	path: '/notify',
  	method: 'POST'
	};

	var req = http.request(options, function(res) {
  	console.log('STATUS: ' + res.statusCode);
  	console.log('HEADERS: ' + JSON.stringify(res.headers));
  	res.setEncoding('utf8');
  	res.on('data', function (chunk) {
    	console.log('BODY: ' + chunk);
  	});
	});

	req.on('error', function(e) {
  	console.log('problem with request: ' + e.message);
	});

	// write data to request body
	req.write(JSON.stringify({action: 'Do something', app: 'app2', random: rstring()}));
	req.end();			

}, 5000);

function rstring() 
{ return Math.floor(Math.random()*1e6).toString();}   
