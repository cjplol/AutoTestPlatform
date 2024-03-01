// 按钮点击事件监听
document.getElementById('start_test_btn').addEventListener('click', function() {
    // 获取输入框的值
    var version = document.getElementById('version').value;
    // 正则表达式验证四位数
    var versionRegex = /^\d{4}$/;

    // 清除之前的错误消息
    document.getElementById('error-msg').textContent = '';

    // 判断版本号是否符合四位数
    if(versionRegex.test(versionNumber)) {
        // 版本号格式正确，可以进行后续操作
        console.log("版本号正确，开始测试...");
        // 这里可以添加开始测试的代码
    } else {
        // 版本号格式不正确，显示错误消息
        document.getElementById('error-msg').textContent = '请输入四位数版本号！';
    }
});