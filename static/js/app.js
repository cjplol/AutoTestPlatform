
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

// 按钮点击事件监听
//document.getElementById('start_test_btn').addEventListener('click', checkVersion);

// 提交表单监听
document.getElementById('test_form').addEventListener('submit',function(event){
    // 检查触发提交事件的元素
    var submitter=event.submitter || document.activeElement;
    // 如果触发提交的元素的 value 是 'check'，则不执行 checkVersion
    if (submitter && submitter.value=='check'){
        return;
    }

    var result=checkVersion();
    console.log(result);
    if (result==false){
        event.preventDefault(); //阻止表单提交
    }
});


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

$(document).ready(function(){
    $('#pause_test_button').click(function(){
        var test_stand=$('#test_stand_value').text();
        var xpu_version=$('#xpu_version_value').text();
        var test_status=$('#test_status_value').text();
        var test_percent=$('#test_percent_value').text();
        $.ajax({
            type: "POST",
            url: "/pause_test",
            contentType: 'application/json;charset=UTF-8',
            data:JSON.stringify({ 'test_stand': test_stand, 'xpu_version':xpu_version, 'test_status':test_status, 'test_percent':test_percent}),
            success: function(response){
                console.log(response.status);
            }
        });
    });
});