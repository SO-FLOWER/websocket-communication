//聊天室的主要功能

//链接socket.io服务

var socket = io('http://localhost:3000');
var username, avatar
var toName = '群聊'

//实现登录功能

$('#login_avatar li').on('click',function(){
    $(this).addClass('now').siblings().removeClass('now')
})

//点击登录按钮
$('#loginBtn').on('click',function(){
    //获取用户名
   var username = $('#username').val().trim();
   if(!username){
       window.alert('请输入用户名')
       return
   }
   if(username === '群聊'){
       window.alert('用户名已存在')
       return
}
   //获取头像
   var avatar = $('#login_avatar li.now img').attr('src');
   //console.log(username, avatar);   

   //需要告诉socket.io服务，登录
    socket.emit('login',{
        username:username,
        avatar:avatar
    })

})

//浏览器监听登录失败
    socket.on('loginError',data => {
        alert('用户名已经存在')
    })
//浏览器监听登录成功
    socket.on('loginSuccess',data => {
        //alert('登录成功了')
        $('.login_box').fadeOut();
        $('.container').fadeIn();

        $('.user-list .avatar_url').attr('src',data.avatar)
        $('.user-list .username').text(data.username)

        username = data.username;
        avatar = data.avatar;
    })
//监听添加用户信息
    socket.on('addUser',data => {
        $('.box-bd').append(`<div class="system">
                                <p class="message_system">
                                <span class="content">${data.username} 上线了</span>
                                </p>
                            </div>`)
                            scrollIntoView()
    })
//监听用户离开信息
    socket.on('delUser',data => {
        $('.box-bd').append(`<div class="system">
                                <p class="message_system">
                                <span class="content">${data.username} 下线了</span>
                                </p>
                            </div>`)
                            scrollIntoView()
    })
//监听用户列表信息
    socket.on('userList',data => {
        $('.user-list ul').html('');
        $('.user-list ul').append(`
            <li class="user">
            <div class="avatar"><img src="images/群聊.jpg" alt=""></div>
            <div class="name">群聊</div>
        </li>
        `)
        data.forEach(item => {
            $('.user-list ul').append(`<li class="user">
                    <div class="avatar"><img src="${item.avatar}" alt=""></div>
                    <div class="name">${item.username}</div>
                </li>`)
        })

        $('#userCount').text(data.length);
        clickUser()
    })

//发送按钮
    $('.btn-send').on('click',() => {
       var content = $('#content').html().trim();
       $('#content').html('');
       if(!content){
           return alert('文本不能为空')
       }
       socket.emit('sendMessage',{
           msg:content,
           username:username,
           avatar:avatar
       })
    })

    socket.on('receiveMessage',data => {
    if(data.toName === '群聊'){
       if( data.username = username){
          $('.box-bd').append(`
          <div class="message-box">
            <div class="my message">
                <img src="${data.avatar}" alt="" class="avatar">
                <div class="content">
                <div class="bubble">
                    <div class="bubble_cont">${data.msg}</div>
                </div>
            </div>
          </div>
        </div>
          `)
       }else{
            $('.box-bd').append(`
                <div class="message-box">
                    <div class="other message">
                        <img src="${data.avatar}" alt="" class="avatar">
                        <div class="nickname">${data.username}</div>
                        <div class="content">
                        <div class="bubble">
                            <div class="bubble_cont">${data.msg}</div>
                        </div>
                        </div>
                    </div>
                </div>
            `)
       }
    } else {
        if (username === data.username) {
          // 自己的消息
          $('.box-bd').append(`
            <div class="message-box">
              <div class="my message">
                <img src="${data.avatar}" alt="" class="avatar">
                <div class="content">
                  <div class="bubble">
                    <div class="bubble_cont">${data.msg}</div>
                  </div>
                </div>
              </div>
            </div>
          `)
        } else {
          // 别人的消息
          $('.box-bd').append(`
            <div class="message-box">
              <div class="other message">
                <img src="${data.avatar}" alt="" class="avatar">
                <div class="nickname">${data.username}</div>
                <div class="content">
                  <div class="bubble">
                    <div class="bubble_cont">${data.msg}</div>
                  </div>
                </div>
              </div>
            </div>
          `)
        }
      }
      scrollIntoView()
    })

    //发送图片的功能
    $('#file').on('change',function(){
        var file = this.files[0]
        //需要把这个图片发送到服务器，借助于H5新增的fileReader
        var fr = new window.FileReader()
        fr.readAsDataURL = function(){
            socket.emit('sendImage',{
                username,
                avatar,
                img:fr.result,
                toName
            })
        }
    })

    //监听接收图片信息
    socket.on('receiveImage',data => {
        if(username === data.username){
            // 自己的消息
            $('.box-bd').append(`
            <div class="message-box">
            <div class="my message">
                <img src="${data.avatar}" alt="" class="avatar">
                <div class="content">
                <div class="bubble">
                    <div class="bubble_cont">
                    <img src="${data.img}">
                    </div>
                </div>
                </div>
            </div>
            </div>
         `)
        }else {
            // 别人的消息
            $('.box-bd').append(`
              <div class="message-box">
                <div class="other message">
                  <img src="${data.avatar}" alt="" class="avatar">
                  <div class="nickname">${data.username}</div>
                  <div class="content">
                    <div class="bubble">
                      <div class="bubble_cont">
                        <img src="${data.img}">
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `)
          }
        //等待图片加载完成
        $('.box-bd img:last').on('load',function(){
            scrollIntoView()
        })
    })
    
    //初始化jq-emoji插件
    $('.face').on('click',function(){
        $('#content').emoji({
            button: '.face',
            showTab: false,
            animation: 'slide',
            position: 'topRight',
            icons: [{
            name: 'QQ表情',
            path: 'lib/jquery-emoji/img/qq/',
            maxNum: 91,
            excludeNums: [41, 45, 54],
            file: '.gif'
          }]
        })
    })

    //私聊功能
    $('#btn-send').on('click',() => {
        var content = $('#content').html().trim()
        $('$content').html('')
        if(!content){
            return window.alert('请输入内容')
        }
        if(toName == '群聊'){
            socket.emit('sendMessage',{
                msg:content,
                username,
                avatar,
                toName
            })
        }else{
            socket.emit('sendMessageToOne',{
                msg:content,
                username,
                avatar,
                toName:toName
            })
        }
    })


    //当有消息时，将滑动到底部
    function scrollIntoView(){
        $('.box-bd').children(':last').get(0).scrollIntoView(false)
    }

    //点击用户绑定事件
    function clickUser() {
        $('.user').on('click',function(){
            $(this).addClass('active').siblings().removeClass('active')
            var to = $(this).children('.name').text()
            $('#chatName').text(to)
            toName = to
        })
    }