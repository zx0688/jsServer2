module.exports = {
	create: create,
	listen: listen,

	size:50
};


function listen(ws) {
	console.log("dfsfsfd");
}

function create(ws) {
	return this.size;
}