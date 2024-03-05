function checkVersion(){
    //开始测试按钮
    var start_test_btn=document.getElementById('start_test_btn')
    // 获取输入框的值
    var version = document.getElementById('version').value;

    // 正则表达式验证四位数
    var versionRegex = /^\d{4,6}$/;

    // 判断版本号是否符合四位数
    if(versionRegex.test(version)) {
        // 版本号格式正确，可以进行后续操作
        //开始测试按钮置灰
        //start_test_btn.disabled = true;
        // 这里可以添加开始测试的代码
        return true
    } else {
        // 版本号格式不正确，显示错误消息
        alert("请输入正确的版本号！（四位数以上）");
        return false
    }
}

// 按钮点击事件监听
//document.getElementById('start_test_btn').addEventListener('click', checkVersion);

// 提交表单监听
document.getElementById('test_form').addEventListener('submit',function(event){
    result=checkVersion();
    console.log(result);
    if (result==false){
        event.preventDefault(); //阻止表单提交
    }
});