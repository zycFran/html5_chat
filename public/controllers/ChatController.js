
var socket = io();

socket.on('whoAmI',function(user){
    initUserInfo(user);
});

socket.on('userList',function(userList){
    initUserList(userList);
});

socket.on('toOne',function(msgObj){
    if(msgObj.from.id == chatCtr.friend.id){
        // 是否在聊天中
        addMsgFromUser(msgObj);
    }else if(msgObj.from.id != chatCtr.self.id){
        // 未读消息加1
        var user = chatCtr.findUserById(msgObj.from.id);
        if(user){
            user.unRead ++;
            user.lastMsg = msgObj.msg;
        }
    }
});

socket.on('historyMsg',function(msgList){
    initHistoryMsg(msgList);
});


var chatCtr = avalon.define({
    $id: 'MainController',
    msg: '',

    self: {
        name: '',
        id: ''
    },
    friend: {
        name: '',
        id: ''
    },

    list: [],

    users: [],

    chatHandler: function(friend){
        if(chatCtr.friend.id == friend.id){
            return;
        }
        chatCtr.friend = {
            name: friend.name,
            id: friend.id
        };

        // 设置 聊天房间名
        $("#metaTitle").text(friend.name);
        $("#unread").hide();
        friend.unRead = 0;

        //1. self 设置聊天对象
        socket.emit('talk',chatCtr.self.id, friend.id);
    },

    sendHandler: function(){
        if(!chatCtr.msg){
            Tip.alert("发送的消息不能为空");
            return;
        }
        var msgObj = {
            from: chatCtr.self.$model,
            to: chatCtr.friend.$model,
            msg: chatCtr.msg
        };
        addMsgFromUser(msgObj);
        chatCtr.msg = '';

        socket.emit('toOne',msgObj);
    },

    findUserById: function(id){
        var user = null;
        avalon.each(chatCtr.users,function(i ,it){
            if(it['id'] == id){
                user = it;
            }
        });
        return user;
    },

    total:0,

    active: 'users',

    init: function(){
        X.initSize();

        var selfId = AjaxFunc.getQueryStringByName('from');
        socket.emit('whoAmI', selfId);
    }
});

avalon.scan();
chatCtr.init();

/* userList 格式
user = {
     name: '',
     id: '',
     unRead: 0,
     head: '',
     thumbUrl: ''
};
*/
/* msgObj 格式
msgObj = {
    from: {
        name: '',
        id: '',
        head: '',
        thumbUrl: ''
    },
    to: {
        name: '',
        id: '',
        head: '',
        thumbUrl: ''
    },
    msg: ''
};
*/

var base_head_img = 'images/user/head.png';

function initUserInfo(user){
    chatCtr.self = user;
}
function initUserList(userList){
    var t = 0;
    userList = userList || [];
    avalon.each(userList, function(i, it){
        it['id'] = it['contactPerson']['openid'];
        it['name'] = it['contactPerson']['nickname'];
        it['head'] = it['contactPerson']['headimgurl'];
        it['thumbUrl'] = it['contactPerson']['headimgurl'] || base_head_img;
        it['unRead'] = Number(it['unreadCounts']);
        t += it['unreadCounts'];
    });
    chatCtr.users.pushArray(userList);
    chatCtr.total = t;

    var hash = location.hash.replace('#', '');
    if(hash){
        //location.hash = '';
        var toId = hash.split("chat_to_")[1];
        if(toId){
            var friend = chatCtr.findUserById(toId);
            chatCtr.chatHandler(friend);
            chatCtr.active = 'chat';
        }
        //location.hash = '#chat_to_' + toId;
    }
    window.onhashchange = updatePage;
}

function initHistoryMsg(msgList){
    chatCtr.list.clear();
    var pd = [];
    msgList = msgList || [];
    msgList = msgList.reverse();
    avalon.each(msgList, function(i, it){
        pd.push({
            from: {
                thumbUrl:  it['from']['headimgurl'] || base_head_img,
                id: it['from'].id,
                nickname: it['from'].nickname,
                openid: it['from'].openid
            },
            to: {
                thumbUrl:  it['from']['headimgurl'] || base_head_img,
                id: it['from'].id,
                nickname: it['from'].nickname,
                openid: it['from'].openid
            },
            msg: it['content']
        });
    });
    chatCtr.list.pushArray(pd);

    //滚动条一直在最底
    window.scrollTo(0, $(".inner").height() - $(window).height())
}
function addMsgFromUser(msgObj){
    chatCtr.list.push(msgObj);

    //滚动条一直在最底
    window.scrollTo(0, $(".inner").height() - $(window).height())
}

function updatePage(){
    var widgetName = location.hash.replace('#', '');
    if(widgetName === ''){
        chatCtr.active = 'users';
        // 从聊天中退出
        socket.emit('logout', chatCtr.self.id);
        chatCtr.friend.id = null;
        chatCtr.friend.name = '';
    }else{
        chatCtr.active = 'chat';
    }
}