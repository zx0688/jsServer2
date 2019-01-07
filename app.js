const size = 20;

var WebSocketServer = require('ws');
var wss = new WebSocketServer.Server({port: 8081});
var clients = {};
var maze = [];
var prize = {x:0, y:0};

Object.size = function (obj) {
	var size = 0, key;
	for (key in obj) {
		if (obj.hasOwnProperty(key)) size++;
	}
	return size;
};

wss.on('connection', function (ws) {

	var id = 0;
	var available = false;

	if (Object.size(clients) == 0) {
		generateWorld();
	}

	for (var i = 0; i < 4; i++) {
		if (!clients.hasOwnProperty(i)) {
			id = i;
			//создаем игрока
			clients[id] = {x: 0, y: 0, direction: 0, ws: ws, id: id};
			available = true;
			break;
		}
	}

	if (!available) {
		console.log("достигнут максимум соединений");
		return;
	}

	createPosition(clients[id]);

	ws.on('message', function (data) {
		//console.log("получено")
		//console.log(data);
		listen(data, clients[id], id);
	});

	ws.on('close', function () {
		console.log('connection closed' + id);
		clients[id] = null;
		delete clients[id];
	});

});

function createPosition(client) {

	var r = size / 2;
	var offsetX = parseInt((30 - 15) / 2);
	var angle = Math.random() * 6.282;

	var rx = r * Math.cos(angle);
	var ry = r * Math.sin(angle);

	client.x = parseInt(rx + size / 2) * 30 + offsetX;
	client.y = parseInt(ry + size / 2) * 30 + offsetX;
	client.direction = -1;
}

function generateWorld() {

	maze = [];

	for (var i = 0; i < size * size; i++)
		maze.push(parseInt(Math.random() * 4));

	prize.x = parseInt(Math.random()*size);
	prize.y = parseInt(Math.random()*size);
}

function updatePlayers() {

	var answer = [1];

	for (var key in clients) {
		var p = clients[key];
		answer = answer.concat([p.id, p.x, p.y, p.direction]);
	}

	//отправляем всем клиентам о текущем состоянии игроков
	for (var key in clients) {
		send(clients[key].ws, answer);
	}
}

function str2ab(str) {
	return JSON.parse(str);
}

function send(ws, ar) {
	var st = JSON.stringify(ar);

	//console.log("отправлено")
	//console.log(ar);
	ws.send(st);
}

function listen(message, client, id) {

	var ws = client.ws;

	var data = str2ab(message);

	switch (data[0]) {
		//запрос карты
		case 0:
			send(ws, [0, id, client.x, client.y, size, size, prize.x, prize.y].concat(maze));
			break;
		//кто-то сообщил о своем передвижении
		case 1:
			clients[id].x = data[1];
			clients[id].y = data[2];
			clients[id].direction = data[3];

			//сообщаем всем
			updatePlayers();
			break;

		//кто-то выйграл
		case 2:
			generateWorld();

			for (var key in clients) {
				createPosition(clients[key]);
			}

			for (var key in clients) {
				var client = clients[key];
				send(clients[key].ws, [0, key, client.x, client.y, size, size, prize.x, prize.y].concat(maze));
			}

			break;

		default:
			//console.log("неверная команда");
	}
}
