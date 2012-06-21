var restify = require('restify');
var WebSocketServer = require('websocket').server;
var http = require('http');

var activeusers = {};
var subscriptions = {};
//Create an instance of http for the websocket server.
var wshttpserver = http.createServer(function(request, response) {
	console.log((new Date()) + ' Received request for ' + request.url);
	response.writeHead(404);
	response.end();
});
wshttpserver.listen(9091, function() {
	console.log((new Date()) + " server is listening on port 9091 for websockets");
});

wsServer = new WebSocketServer({
	httpServer: wshttpserver,
	autoAcceptConnections: false
});

//Create server for restify. I believe this inherits directly from http instead of using an http object...
var restserver = restify.createServer();
restserver.post('/notify', doNotification);

function processWS(data, connid)
{
wsmessage = JSON.parse(data);
console.log("Processing %s , with data %s", connid, wsmessage.auth);
if(activeusers[connid]){
	//Device is already connected and I haven't written any device commands. 
	wsServer.connections[connid].sendUTF("no client commands support besides auth, or already logged in");
}else{
	if(wsmessage.auth){
		if(wsmessage.auth.username == 'bryan' && wsmessage.auth.key == 'password')
		{
		wsmessage.auth['subscription'] = wsmessage.subscription;
		activeusers[connid] = wsmessage.auth;
			if(subscriptions[wsmessage.subscription]){
				subscriptions[wsmessage.subscription][connid] = 1;
			}else{
			subscriptions[wsmessage.subscription] = {};
			subscriptions[wsmessage.subscription][connid] = 1;
			}
		wsServer.connections[connid].sendUTF(JSON.stringify({"status": 200, "message" : "login succesful"}));
		}else{
			wsServer.connections[connid].sendUTF(JSON.stringify({"status":403,"message": "bad authorization data"}));}
			console.log(subscriptions);}
}
}

//Processes the rest interface /notify
function doNotification(req, res, next){
// send to websocket
	var body = '';
	req.on('data', function (data) {
		body += data;
	});
	req.on('end', function () {
	 	var notification = JSON.parse(body);
	        sendToSubscribers(notification, 'test');	
	});	

	res.send({status: 'ok'});
}

function sendToSubscribers(notification,subscription)
{
	
	if(subscriptions[subscription]){
	var sublist = subscriptions[subscription];
	console.log(sublist);	
	notification['request'] = 'notification';
	Object.keys(sublist).forEach(function(connid){
		//Sends to an individual user connid is the unique id for every connected websocket.	
		wsServer.connections[connid].sendUTF(JSON.stringify(notification));
	});
	}
}



restserver.listen(9090, function(){
	console.log('%s listening at %s', restserver.name, restserver.url);
});




//This runs when a websocket connection handshake happens.
wsServer.on('request', function(request) {

    var connection = request.accept('ws-tunnel', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
           	console.log(JSON.stringify(message.utf8Data)); 
		//connection.connid is the unique identifier for the individual connect. Put these in a table with deviceid's to match them up.	
		processWS(message.utf8Data,connection.connid);
		
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
        }
    });
    connection.on('close', function(reasonCode, description) {
        var user = activeusers[connection.connid];
	console.log(user); 
	delete subscriptions[user.subscription][connection.connid]; 
	console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});



