
require.paths = ['/root/.node_modules'];
var ios = require('socket.io'); 
var mongo = require('mongoskin');
var conffile = require('./include/configs.js');
var router = require('./include/router.js');
var rooms = require('./include/rooms.js');
var fserv = require('./include/fileserv.js');
var plugins = require('./include/plugins.js');



global.time = function(){return parseInt(new Date().getTime()/1000)};
global.isset = function(vr){return typeof(vr)!=='undefined'};
global.obLen = function(ob){var cc=0; for(var i in ob) cc++; return cc};
global.obj2arr = function(ob){var ar=[]; for(var i in ob) ar.push(i); return ar};


global.config = [];
global.startTime = time();
global.anonims = {};
global.allUsers = {};
global.allRooms = {};
global.login2nick = {};


conffile.readConfig(function(data){ 
	config = data;

	global.db = mongo.db('mongodb://admin:123456@'+config['mongoServer']+':'+config['mongoPort']+'/'+config['mongoBaseName']+'?auto_reconnect');
	global.dbusers = db.collection('users');
	global.dbmess = db.collection('messages');
	global.dbrooms = db.collection('rooms');
	global.dbhist = db.collection('history');
	global.dbhistEv = db.collection('historyEvents');
	
	global.io = ios.listen(config['socketPort'] * 1);
		
	global.serverHost = config['serverIp'];
	//console.log('!!!!!!!!!!!!!!readConfig!!!!!!!!!!!!!!!!!');	
	//console.log(global.db);
	//console.log('!!!!!!!!!!!!!!readConfig!!!!!!!!!!!!!!!!!');//
	// ������� ������ - ��� ����� �����������
	dbusers.update({'socket': {$ne:''}}, {$set: {'socket':''}}, {'multi':true}, function(err,res){});
	// ������� ������� �� ������
	dbrooms.update({}, {$set: {'userscount':0, 'users':{}}}, {'multi':true}, function(err,res){});
	
	// ���������� ���� ���� ������	
	dbusers.find({}).toArray(function(e,r){
		for(var i=0; i < r.length; i++){
			login2nick[r[i].login] = r[i].nick;	
		}
	});
	

	
	
	
	io.set('log level', 1);

	
io.sockets.on('connection', function (socket) {

	socket.profile = {};
	socket.isLogin = false;
	socket.rooms = [];
	
	socket.on('message', function(data){
		router.rout(data, socket);
	});


	
	socket.on('disconnect', function() {
	
		// ������������� ����� ����� �� �����������
		dbusers.update({'socket':socket.id}, {$set: {'socket':''}}, function(err,res){});
		rooms.leaveAllRooms(socket);
		//console.log('Client disconnected: ' + socket.handshake.address.address);
		delete socket;
		
	});
	
	//console.log('Client connected: ' + socket.handshake.address.address);
	
});

fserv.startHttp();
	console.log('server start');
	//console.log(plugins);
plugins.load('testbot.js');	//console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
	
});