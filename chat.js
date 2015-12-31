var io = require('socket.io')();
var _ = require('underscore');
var Api = require('./models/api');

//api
/*
socket.emit('message', "this is a test");  // send to current request socket client

socket.broadcast.emit('message', "this is a test");  // sending to all clients except sender

socket.broadcast.to('game').emit('message', 'nice game');  // sending to all clients in 'game' room(channel) except sender

io.sockets.emit('message', "this is a test"); // sending to all clients, include sender
 
io.sockets.in('game').emit('message', 'cool game'); // sending to all clients in 'game' room(channel), include sender

io.sockets.socket(socketid).emit('message', 'for your eyes only'); // sending to individual socketid
*/

/*user list
Format:[
	{
		name: '1',
		unRead: 0,
		head: "/images/1.jpg",
		thumbUrl: "/images/1.jpg",
		id: '1',
		talkId: '',
		lastMsg: ''
	}
]
*/
/*Msg list
Format:[
 	{
 		from: {
 			name: '1',
 			head: "/images/1.jpg",
 			thumbUrl: "/images/1.jpg",
 			id: '1'
 		},
 		to:{
 			name: '3',
 			head: "/images/3.jpg",
 			thumbUrl: "/images/3.jpg",
 			id: '3'
 		},
 		msg: 'see额'
 	}
]
*/

var talkList = [];
var userList = [];

io.on('connection',function(socket){
	socket.on('whoAmI',function(selfId){
		var user = _.findWhere(talkList, {id:selfId});
		if(!user){
			// 获取用户信息
			user = {
				id: selfId
			};
			user.sid = socket.id;
			talkList.push(user);
		}
		user.sid = socket.id;
		socket.emit('whoAmI', user);

		getUserListByUser({openId: user.id, start: 0, limit: 20}, function(list){
			socket.emit('userList',list);
		})
	});

	socket.on('talk',function(selfId, friendId){
		var user = _.findWhere(talkList,{id: selfId});
		user.talkId = friendId;

		var pd = {
			from_openId: selfId,
			to_openId: friendId,
			start: 0,
			limit: 30
		};
		getMsgListByUser(pd, function(list){
			socket.emit('historyMsg', list);
		});
	});

	//log out
	socket.on('disconnect',function(){
		var user = _.findWhere(talkList,{sid: socket.id});
		if(user){
			talkList = _.without(talkList, user);
			//console.log("logout:" + user.name);
		}
	});
	socket.on('logout',function(selfId){
		var user = _.findWhere(talkList,{id:selfId});
		if(user){
			user.talkId = null;
		}
	});

	//send to one
	socket.on('toOne',function(msgObj){
		var to = _.findWhere(talkList,{id: msgObj.to.id});

		var pd = {
			content: msgObj.msg,
			from: {
				openid: msgObj.from.id
			},
			to: {
				openid: msgObj.to.id
			},
			read: 0,
			state: 1
		};
		if(to){
			// 聊天中
			var toSocket = _.findWhere(io.sockets.sockets,{id: to.sid});
			if(!toSocket){
				return;
			}
			toSocket.emit('toOne', msgObj);
			if(to.talkId == msgObj.from.id){
				// 设置为已读消息
				pd['read'] = 1;
			}else{
				// 设置为未读消息
				pd['read'] = 0;
			}
		}else{
			// to 不在线或 to不在和from聊天
			// 设置为未读消息
			pd['read'] = 0;
		}
		saveMessage(pd);
	});
});

function getUserListByUser(params, callback){
	Api.getContactsList(params, function(data){
		if(!data.success){
			console.log("出错了：");
			console.log(data.message);
		}else{
			if(callback){
				callback(data.list);
			}
		}
	});
	//var p = [];
	//for(var i = 0; i < userList.length; i++){
	//	if(userList[i].id != user.id){
	//		p.push(userList[i]);
	//	}
	//}
	//return p;
}
function getMsgListByUser(params, callback){
	Api.getHistoryList(params, function(data){
		if(!data.success){
			console.log("出错了：");
			console.log(data.message);
		}else{
			console.log("getMsgList success");
			if(callback){
				callback(data.list);
			}
			//return data.list;
		}
	});
	//var p = [];
	//for(var i = 0; i < msgList.length; i++){
	//	if((msgList[i].from.id == fromId && msgList[i].to.id == toId) ||
	//		(msgList[i].to.id == fromId && msgList[i].from.id == toId)){
	//		p.push(msgList[i]);
	//	}
	//}
    //
	//return p;
}
function saveMessage(params, callback){
	Api.saveMessage(params, function(data){
		if(!data.success){
			console.log("出错了：");
			console.log(data.message);
		}else{
			if(callback){
				callback(data.value);
			}
			//return data.list;
		}
	});
	//var p = [];
	//for(var i = 0; i < msgList.length; i++){
	//	if((msgList[i].from.id == fromId && msgList[i].to.id == toId) ||
	//		(msgList[i].to.id == fromId && msgList[i].from.id == toId)){
	//		p.push(msgList[i]);
	//	}
	//}
    //
	//return p;
}

exports.listen = function(_server){
	io.listen(_server);
};