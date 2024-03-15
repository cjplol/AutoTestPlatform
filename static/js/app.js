
var start_test_btn=document.getElementById('start_test_btn');    //开始测试按钮
var versionNumberInput=document.getElementById("version");   //版本号输入框
var testNameInput=document.getElementById("test_name");  //测试名输入框
var currentVersionRadio=document.getElementById("current_version"); //当前版本单选框
var specificVersionRadio=document.getElementById("specific_version");   //指定版本单选框
var versionNumberHint=versionNumberInput.placeholder;   //版本号输入框提示语
var testNameInputHint=testNameInput.placeholder;  //测试名输入框提示语
var standCategoryValue=document.getElementById('stand_category').querySelector('.status-value') //台架类型内容span
var xpuVersionValue=document.getElementById('xpu_version').querySelector('.status-value') //XPU版本内容span
var testStatusValue=document.getElementById('test_status').querySelector('.status-value') //测试状态内容span
var testPercentValue=document.getElementById('test_percent').querySelector('.status-value') //测试进度内容span

//选择台架后，将台架类型传给后端，再将后端输出的相关数据展示到前端
$("#test_stand").on("change",function(){
    var test_stand=$(this).val()
    $.ajax({
            type: "POST",
            url: "/check_status",
            contentType: 'application/json;charset=UTF-8',
            data:JSON.stringify({ 'test_stand': test_stand}),
            success: function(data){
                console.log(data);
                if(data["result"]=="disconnected"){
                    alert("连接失败，请确认台架是否关机或断网");
                    }
                else if(data["result"]=="failed"){
                    alert("状态获取失败，请确认台架能否连上XPU！");
                    $("#test_stand_value").text('');
                    $("#xpu_version_value").text('');
                    $('#test_status_value').text('');
                    $('#test_percent_value').text('');
                }
                else{
                    xpu_version=data["xpu_version"];
                    test_status=data["test_status"];
                    test_percent=data["test_percent"];
                    $("#test_stand_value").text(test_stand).attr("class","status-value");
                    $("#xpu_version_value").text(xpu_version).attr("class","status-value");
                    $('#test_status_value').text(test_status).attr("class","status-value");
                    $('#test_percent_value').text(test_percent).attr("class","status-value");
                    if (test_status=="自动测试中"){
                        $("#pause_test_button").prop("disabled",false)
                    }
                    if (test_status=="暂停中"){
                        $("#continue_test_button").prop("disabled",false)
                    }
                }
            }
        });
})

function checkVersion(){
    if (currentVersionRadio.checked==true){
        return;
    }
    var version = document.getElementById('version').value; // 获取输入框的值
    // 正则表达式验证四位数
    var versionRegex = /^\d{4,7}$/;
    // 判断版本号是否符合四位数
    if(versionRegex.test(version)) {
        // 版本号格式正确，可以进行后续操作
        //开始测试按钮置灰
        //start_test_btn.disabled = true;
        // 这里可以添加开始测试的代码
        return true
    } else {
        // 版本号格式不正确，显示错误消息
        console.log(version);
        alert("请输入正确的版本号！（四位数以上）");
        return false
    }
}

//点击测试按钮后，弹出提示框
function confirmSubmit() {
    var test_stand =$("#test_stand_value").text();
    var xpu_version =$("#xpu_version_value").text();
    var test_status =$('#test_status_value').text();
    var test_percent =$('#test_percent_value').text();

    if (test_stand=="未选择台架"){
        alert("请先选择台架！");
        return false;
    }

    else if (test_stand==''){
        alert("请获取台架状态后再启动测试！");
        return false;
    }

    else if (test_status == "版本更新中") {
        alert(test_stand + "台架版本更新中，无法启动测试！");
        return false;
    }

    else if (test_status=="自动测试中"){
        alert("请先暂停测试再启动新测试！");
        return false;
    }

     else {
        console.log("进入到判断")
        var message = "台架类型：" + test_stand + "\n测试状态：" + test_status + "\n测试进度：" + test_percent + "\n是否开启新的测试？开始后将停止当前测试！";
        var confirmMessage = confirm(message);
        return confirmMessage;
    }
}

// 提交表单监听
document.getElementById('test_form').addEventListener('submit', function(event) {
    // 检查触发提交事件的元素
    var submitter=event.submitter || document.activeElement;
    // 如果触发提交的元素的 value 是 'check'，则不执行 checkVersion
    if (submitter && submitter.value=='start'){
    var result=checkVersion();
    if (result==false){
    event.preventDefault(); //阻止表单提交
    return;
    }
    }

    //根据台架状态判断是否可以开始测试，不行则不提交表单
    confirmResult=confirmSubmit();
    if (confirmResult==false){
        event.preventDefault(); // 阻止表单的默认提交行为
        return;
    }


});

//点击开始测试按钮
$(document).ready(function(){
    $("#start_test_btn").click(function(){
        var test_stand=$('#test_stand_value').text();
        var whether_specific=$("#specific_version").prop("checked");    //是否选中指定版本
        var version_text=$("#version").text();  //版本号填写的内容
        var test_name=$("#test_name").text();   //测试命名
        //如果指定版本测试，则检查输入的版本号是否正确，若正确则开始测试
        if (whether_specific){
            if (checkVersion()==false){
                return;
            }
        }
        //如果经过检查，达到开启测试条件，则开启测试
        if(confirmSubmit()){
            $.ajax({
                type:"POST",
                url:"/start_test",
                contentType:"application/json;charset=UTF-8",
                data:JSON.stringify({
                    "test_stand": test_stand,
                    "whether_specific":whether_specific,
                    "version_text":version_text
                }),
                success: function(data){
                    if(data["result"]=="disconnected"){
                    alert("连接失败，请确认台架是否关机或断网");
                    }
                    else if(data["result"]=="failed"){
                        alert("状态获取失败，请确认台架能否连上XPU！");
                        $("#test_stand_value").text('');
                        $("#xpu_version_value").text('');
                        $('#test_status_value').text('');
                        $('#test_percent_value').text('');
                    }
                    else{
                        console.log(data)
                        xpu_version=data["xpu_version"];
                        test_status=data["test_status"];
                        test_percent=data["test_percent"];
                        $("#test_stand_value").text(test_stand).attr("class","status-value");
                        $("#xpu_version_value").text(xpu_version).attr("class","status-value");
                        $('#test_status_value').text(test_status).attr("class","status-value");
                        $('#test_percent_value').text(test_percent).attr("class","status-value");
                        if (test_status=="自动测试中"){
                            $("#pause_test_button").prop("disabled",false)
                        }
                        if (test_status=="暂停中"){
                            $("#continue_test_button").prop("disabled",false)
                        }
                    }
                },
                error: function(xhr, status, error) {
                    console.error("AJAX请求失败：", status, error);
                }
            })
        }
    })
})


//两个输入框根据测试版本单选框的情况决定可用或不可用
function versionRadioChange(){
    currentRadioChecked=currentVersionRadio.checked;    //当前版本是否被选中
    versionNumberInput.disabled=currentRadioChecked;
    testNameInput.disabled=currentRadioChecked;
    versionNumberInput.placeholder="";
    testNameInput.placeholder="";
    versionNumberInput.classList.add('disabled-input');
    testNameInput.classList.add('disabled-input');
}

function specificVersionRadioChange(){
    currentRadioChecked=currentVersionRadio.checked;    //当前版本是否被选中
    versionNumberInput.disabled=currentRadioChecked;
    testNameInput.disabled=currentRadioChecked;
    versionNumberInput.placeholder=versionNumberHint;
    testNameInput.placeholder=testNameInputHint;
    versionNumberInput.classList.remove('disabled-input');
    testNameInput.classList.remove('disabled-input');
    versionNumberInput.focus();
}
//监听：单选框“当前版本”被选中时，下面两个输入框不可用，否则可用
currentVersionRadio.addEventListener('change',versionRadioChange);
specificVersionRadio.addEventListener('change',specificVersionRadioChange);

//点击查看按钮后，将相关数据展示到前端
function viewStatus(){
    var test_stand="{{ test_stand }}";  //台架类型
    var xpu_version="{{ xpu_version }}" //XPU软件版本号
    var test_status="{{ test_status }}" //测试状态：闲置中、版本更新中、自动测试中、暂停中
    var test_percent="{{ test_percent }}" //测试进度：xx/xxx

    standCategoryValue.textContent=test_stand;
    standCategoryValue.classList.remove('status-not-viewed');
    console.log(test_stand)
}

//点击暂停按钮，
$(document).ready(function(){
    $('#pause_test_button').click(function(){
        var confirmMessage=confirm("确定暂停测试吗？\n提示：若未完成第1个航线测试，将直接停止该次测试，无法继续测试！")
        if (confirmMessage){
            var test_stand=$('#test_stand_value').text();
            var test_percent=$("#test_percent_value").text();
            $.ajax({
                type: "POST",
                url: "/pause_test",
                contentType: 'application/json;charset=UTF-8',
                data:JSON.stringify({ 'test_stand': test_stand}),
                success: function(data){
                    if(data["result"]=="disconnected"){
                        alert("与台架连接断开，请检查！");
                        }
                    else if(data["result"]=="failed"){
                        alert("出现异常错误！");
                    }
                    else{
                        //如果测试进度为0/x，则直接终止测试而不是暂停
                        if (test_percent.charAt(0)=="0"){
                            $("#pause_test_button").prop("disabled",true);
                            $("#test_status_value").text("闲置中");
                            $("#test_percent_value").text("无测试任务");
                        }
                        else{
                            $("#pause_test_button").prop("disabled",true);
                            $("#continue_test_button").prop("disabled",false);
                            $("#test_status_value").text("暂停中");
                        }
                    }
                }
            });
        }

    });
});