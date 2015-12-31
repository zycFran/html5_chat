
// 得到一个 eventproxy 的实例
var eventproxy = require('eventproxy');
var superagent = require('superagent');

var base = "http://114.215.206.113/r/";
var _api = {
	whoAmI: '',

	getContactsList: base + 'message/getContactsList',
	getHistoryList: base + 'message/list',
	saveMessage: base + 'message/send'
};


function Chat_Api() {

}


module.exports = Chat_Api;

Chat_Api.getContactsList = function(params, callback){
	var url = _api.getContactsList;
	console.log("Chat_Api.getContactsList");
	superagent.get(url).query(params).end(function(err, re) {
		var data = JSON.parse(re.text);
		if(callback){
			callback(data);
		}
	});
};

Chat_Api.getHistoryList = function(params, callback){
	var url = _api.getHistoryList;
	console.log("Chat_Api.getHistoryList");
	superagent.get(url).query(params).end(function (err, re) {
		var data = JSON.parse(re.text);
		if(callback){
			callback(data);
		}
	});
};

Chat_Api.saveMessage = function(params, callback){
	var url = _api.saveMessage;
	console.log("Chat_Api.saveMessage");
	superagent.post(url).send(params).end(function (err, re) {
		var data = JSON.parse(re.text);
		if(callback){
			callback(data);
		}
	});
};
