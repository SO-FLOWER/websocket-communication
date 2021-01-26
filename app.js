// 启动聊天服务器
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
//定义一个数组判断当前用户名是否存在
const users = [];

//用express处理静态资源，把public目录设置为静态资源目录
app.use(require('express').static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
     socket.on('login',data => {
       console.log(data);
       let user = users.find(item => item.username === data.username);
       if(user){
         //用户名存在登录失败
         socket.emit('loginError',{msg:'登录失败'})
         //console.log('登录失败');
       }else{
         //用户不存在登录成功，将用户名存入数组users里
         users.push(data)
         //告诉用户登录成功
         socket.emit('loginSuccess',data)
         //console.log('登录成功');
       }
       //socket.emit给特定的用户发消息   io.emit给所以的用户发消息
       io.emit('addUser',data);
       //告诉浏览器，一共有多少用户
       io.emit('userList',users);

       //把登录成功的用户名和头像存起来
       socket.username = data.username;
       socket.avatar = data.avatar;
     })

     //用户断开连接的功能，监听用户断开连接
      socket.on('disconnect',() => {
        //把用户信息从users中删除
        let idx = users.findIndex(item => item.username === socket.username);
        //删除掉断开连接的这个人
        users.splice(idx,1);
        //告诉所有人，有人离开了聊天室
        io.emit('delUser',{
          username:socket.username,
          avatar:socket.avatar
        })
        //告诉所有人，userlist发生了更新
        io.emit('userList',users);
      })

      //用户发送信息的功能
      socket.on('sendMessage',data => {
        console.log(data);
        //广播给所以用户
      io.emit('receiveMessage',data)
      })

      //监听图片聊天信息
      socket.on('sendImage',data => {
        //广播给所有用户
        if(data.toName === '群聊'){
          io.emit('receiveImage',data)
        }else{
        //广播给指定用户
           var toSocket = null
           for(const key in io.sockets.sockets){
             if(io.sockets.sockets[key].username === data.toName){
               toSocket = key
               break
              }
           }
           if(toSocket){
             //发送给指定用户
             socket.to(toSocket).emit('receiveImage',data)
             //发送给自己
             socket.emit('receiveImage',data)
           }else{
             data.msg = 0
             socket.emit('receiveImage',data)
           }
        }
      })

      //私聊功能的实现
  socket.on('sendMessageToOne',data => {
    //广播给指定用户
    var toSocket = null
    for(const key in io.sockets.sockets){
      if(io.sockets.sockets[key].username === data.username){
        toSocket = key
        break
      }
    }
    if(toSocket){
      socket.to(toSocket).emit('receiveMessage', data)
      socket.emit('receiveMessage', data)
    }

  })
});


http.listen(3000, () => {
  console.log('listening on *:3000');
});