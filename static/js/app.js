
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
// 创建一个数组来存储选中的航线名
var selectedAirlines = [];
var origin_airlines;
var FinishedAirlines={};  //存储已完成的航线信息

//选择营地后，重置选择的航线
$("#camps").on("change",function(){
    $('#airlinesList').empty();
    $('#selectAll').prop("checked",false);  //全选按钮取消勾选
    $('.select_route span').css("color","red");
    $('.select_route span').text('未选择航线');
    selectedAirlines=[];    //重置需要测试的航线
    $('#smokeCheckbox').prop("checked",false);  //冒烟测试取消勾选
});

//选择用户后，重置选择的航线
$("#users").on("change",function(){
    $('#airlinesList').empty();
    $('#selectAll').prop("checked",false);  //全选按钮取消勾选
    $('.select_route span').css("color","red");
    $('.select_route span').text('未选择航线');
    selectedAirlines=[];    //重置需要测试的航线
    $('#smokeCheckbox').prop("checked",false);  //冒烟测试取消勾选
});

//选择台架后，将台架类型传给后端，再将后端输出的相关数据展示到前端
$("#test_stand").on("change",function(){
    var test_stand=$(this).val()
    $('#airlinesList').empty();
    $('#selectAll').prop("checked",false);  //全选按钮取消勾选
    $('.select_route span').css("color","red");
    $('.select_route span').text('未选择航线');
    selectedAirlines=[];    //重置需要测试的航线
    $('#smokeCheckbox').prop("checked",false);  //冒烟测试取消勾选
    $.ajax({
            type: "POST",
            url: "/check_status",
            contentType: 'application/json;charset=UTF-8',
            data:JSON.stringify({ 'test_stand': test_stand}),
            success: function(data){
                console.log(data);
                if(data["result"]=="disconnected"){
                    alert("连接失败，请确认台架是否关机或断网");
                    $("#check_finished_airlines").hide();
                    $("#check_screen").hide();
                    }
                else if(data["result"]=="failed"){
                    alert("状态获取失败，请确认台架能否连上XPU！");
                    $("#test_stand_value").text('');
                    $("#xpu_version_value").text('');
                    $('#test_status_value').text('');
                    $('#test_percent_value').text('');

                    $("#check_finished_airlines").hide();
                    $("#check_screen").hide();
                }
                else{
                    xpu_version=data["xpu_version"];
                    test_status=data["test_status"];
                    test_percent=data["test_percent"];
                    $("#test_stand_value").text(test_stand).attr("class","status-value");
                    $("#xpu_version_value").text(xpu_version).attr("class","status-value");
                    $('#test_status_value').text(test_status).attr("class","status-value");
                    $('#test_percent_value').text(test_percent).attr("class","status-value");

                    $("#takeover").prop("disabled",false);
                    $("#release").prop("disabled",true);
                    $("#staffs").val("");
                    $("#staffs").prop("disabled",false);

                    if (test_status=="自动测试中"){
                        $("#pause_test_button").prop("disabled",false)
                        $("#continue_test_button").prop("disabled",true)
                    }
                    if (test_status=="暂停中"){
                        $("#continue_test_button").prop("disabled",false)
                        $("#pause_test_button").prop("disabled",true)
                    }
                    if (test_status=="暂停中" && test_percent=="已测试完毕"){
                        $("#pause_test_button").prop("disabled",true)
                        $("#continue_test_button").prop("disabled",true)
                    }
                    if (test_percent=="未选择台架" || test_percent=="无测试任务" || !test_percent){
                        $("#check_finished_airlines").hide();
                        $("#check_screen").hide();
                    }
                    if (test_status.includes("人工接管中")){
                        $("#pause_test_button").prop("disabled",true);
                        $("#continue_test_button").prop("disabled",true);
                        $("#generate_report").prop("disabled",true);
                        $("#takeover").prop("disabled",true);
                        $("#release").prop("disabled",false);
                        $("#staffs").prop("disabled",true);
                        let regex = /\(([^)]+)\)/; // 匹配圆括号内的内容
                        let matches = test_status.match(regex);
                        staff_name=matches[1];
                        $("#staffs").val(staff_name);
                        $("#staffs").prop("disabled",true);

                    }
                    else{
                        $("#check_finished_airlines").show();
                        $("#check_screen").show();
                    }
                }
            }
        });
})

$("#fresh_status").click(function(){
    var test_stand=$("#test_stand").val();
    $("#test_stand_value").text('获取中');
    $("#xpu_version_value").text('获取中');
    $('#test_status_value').text('获取中');
    $('#test_percent_value').text('获取中');
    $("#check_finished_airlines").hide();
    $("#check_screen").hide();
    $("#pause_test_button").prop("disabled",true);
    $("#continue_test_button").prop("disabled",true);
    $.ajax({
            type: "POST",
            url: "/check_status",
            contentType: 'application/json;charset=UTF-8',
            data:JSON.stringify({ 'test_stand': test_stand}),
            success: function(data){
                console.log(data);
                if(data["result"]=="disconnected"){
                    alert("连接失败，请确认台架是否关机或断网");
                    $("#check_finished_airlines").hide();
                    $("#check_screen").hide();
                    }
                else if(data["result"]=="failed"){
                    alert("状态获取失败，请确认台架能否连上XPU！");
                    $("#test_stand_value").text('');
                    $("#xpu_version_value").text('');
                    $('#test_status_value').text('');
                    $('#test_percent_value').text('');

                    $("#check_finished_airlines").hide();
                    $("#check_screen").hide();
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
                        $("#continue_test_button").prop("disabled",true)
                    }
                    if (test_status=="暂停中"){
                        $("#continue_test_button").prop("disabled",false)
                        $("#pause_test_button").prop("disabled",true)
                    }
                    if (test_status=="暂停中" && test_percent=="已测试完毕"){
                        $("#pause_test_button").prop("disabled",true)
                        $("#continue_test_button").prop("disabled",true)
                    }
                    if (test_percent=="未选择台架" || test_percent=="无测试任务" || !test_percent){
                        $("#check_finished_airlines").hide();
                        $("#check_screen").hide();
                    }
                    else{
                        $("#check_finished_airlines").show();
                        $("#check_screen").show();
                    }
                }
            }
        });
});


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

    else if (selectedAirlines.length==0){
        alert("请先选择需要测试的航线！");
        return false;
    }

    else if (test_status.includes("人工接管中")) {
        alert("人工接管中，无法发起测试，请联系接管人释放！");
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
//document.getElementById('test_form').addEventListener('submit', function(event) {
//    // 检查触发提交事件的元素
//    var submitter=event.submitter || document.activeElement;
//    // 如果触发提交的元素的 value 是 'check'，则不执行 checkVersion
//    if (submitter && submitter.value=='start'){
//    var result=checkVersion();
//    if (result==false){
//    event.preventDefault(); //阻止表单提交
//    return;
//    }
//    }
//
//    //根据台架状态判断是否可以开始测试，不行则不提交表单
//    confirmResult=confirmSubmit();
//    if (confirmResult==false){
//        event.preventDefault(); // 阻止表单的默认提交行为
//        return;
//    }
//
//
//});

//点击开始测试按钮
$(document).ready(function(){
    $("#start_test_btn").click(function(){
        var test_stand=$('#test_stand_value').text();
        var whether_specific=$("#specific_version").prop("checked");    //是否选中指定版本
        var version_text=$("#version").val();  //版本号填写的内容
        var test_name=$("#test_name").val();   //测试命名
        //如果指定版本测试，则检查输入的版本号是否正确，若正确则开始测试
        if (whether_specific){
            if (checkVersion()==false){
                return;
            }
        }
        //如果经过检查，达到开启测试条件，则开启测试
        if(confirmSubmit()){
            $('#airlinesList').empty();
            $('#selectAll').prop("checked",false);  //全选按钮取消勾选
            $('.select_route span').css("color","red");
            $('.select_route span').text('未选择航线');

            $("#test_stand_value").text('获取中');
            $("#xpu_version_value").text('获取中');
            $('#test_status_value').text('获取中');
            $('#test_percent_value').text('获取中');
            $("#check_finished_airlines").hide();
            $("#check_screen").hide();
            $("#pause_test_button").prop("disabled",true)
            $("#continue_test_button").prop("disabled",true)
            $.ajax({
                type:"POST",
                url:"/start_test",
                contentType:"application/json;charset=UTF-8",
                data:JSON.stringify({
                    "test_stand": test_stand,
                    "whether_specific":whether_specific,
                    "version_text":version_text,
                    "selected_airlines":selectedAirlines,
                    "test_name":test_name
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
                        $("#check_finished_airlines").show();
                        $("#check_screen").show();
                        if (test_status=="自动测试中"){
                            $("#pause_test_button").prop("disabled",false)
                            $("#continue_test_button").prop("disabled",true)
                        }
                        if (test_status=="暂停中"){
                            $("#pause_test_button").prop("disabled",true)
                            $("#continue_test_button").prop("disabled",false)
                        }
                        selectedAirlines=[];    //重置需要测试的航线
                        $('#smokeCheckbox').prop("checked",false);  //冒烟测试取消勾选
                        $('#selectAll').prop("checked",false);  //全选按钮取消勾选
                        $('.select_route span').css("color","red");
                        $('.select_route span').text('未选择航线');
                    }
                },
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

//点击查看测试日志
$(document).ready(function(){
    $("#view_log").click(function(){
        test_stand=$("#test_stand").val();
        if(!test_stand){
            alert("请先选择台架！");
            return;
        }
        else{
            $.ajax({
                type: "POST",
                url: "/view_log",
                contentType: 'application/json;charset=UTF-8',
                data:JSON.stringify({'test_stand': test_stand}),
                success: function(response){
                    if(response.result=="disconnected"){
                        alert("与台架连接断开，请检查！");
                    }
                    else if(response.result=="failed"){
                        alert("未获取到日志信息！");
                    }
                    else{
                        // 创建新窗口
                        var logWindow = window.open('', '_blank');
                        // 设置新窗口的文档内容
                        logWindow.document.write('<html><head><title>测试日志</title></head><body>');
                        logWindow.document.write('<pre>' + response.log_content + '</pre>');
                        logWindow.document.write('</body></html>');
                        logWindow.document.close(); // 关闭文档流
                    }
                }
            });
        }
    })
})

//点击生成报告按钮
$(document).ready(function(){
    $("#generate_report").click(function(){
        var confirmMessage=confirm("全部航线测完后会自动生成报告，确定现在生成报告吗？")
        if (confirmMessage){
            var test_stand=$('#test_stand_value').text();
            var test_percent=$("#test_percent_value").text();
            $.ajax({
                type: "POST",
                url: "/generate_report",
                contentType: 'application/json;charset=UTF-8',
                data:JSON.stringify({ 'test_stand': test_stand}),
                success: function(data){
                    if(data["result"]=="disconnected"){
                        alert("与台架连接断开，请检查！");
                        }
                    else if(data["result"]=="xpu"){
                        alert("xpu无法连接，无法获取当前版本并生成报告！");
                    }
                    else if(data["result"]=="failed"){
                        alert("出现异常错误！");
                    }

                    else{
                        alert("报告已生成，请在数据平台-台架测试-报告列表刷新查看")
                    }

                }
            });
        }
    })
})

//点击暂停测试按钮
$(document).ready(function(){
    $('#pause_test_button').click(function(){
        var confirmMessage=confirm("确定暂停测试吗？")
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
                        $("#pause_test_button").prop("disabled",true);
                        $("#continue_test_button").prop("disabled",false);
                        $("#test_status_value").text("暂停中");
                    }

                }
            });
        }

    });
});

//点击接管按钮
$(document).ready(function(){
    $("#takeover").click(function(){
        var test_stand=$('#test_stand_value').text();
        var staff_name=$('#staffs').val();
        if (test_stand=="未选择台架"){
            alert("请先选择台架！");
            return false;
        }
        if (!staff_name){
            alert("请选择测试人员！");
            return false;
        }
        var confirmMessage=confirm("测试人员："+staff_name+"\n接管后无法发起自动化测试，请用完及时释放！\n确定人工接管吗？")
        if (confirmMessage){
            $.ajax({
                type: "POST",
                url: "/manual_takeover",
                contentType: 'application/json;charset=UTF-8',
                data:JSON.stringify({'test_stand': test_stand,'staff_name':staff_name}),
                success: function(data){
                    if(data["result"]=="disconnected"){
                        alert("与台架连接断开，请检查！");
                        }
                    else if(data["result"]=="failed"){
                        alert("出现异常错误！");
                    }
                    else if(data["test_status"]=="自动测试中"){
                        alert("自动测试中，请点击暂停测试再接管！")
                    }
                    else if(data["test_status"]=="版本更新中"){
                        alert("版本更新中，请等待更新结束再接管！")
                    }

                    else{
                        $("#pause_test_button").prop("disabled",true);
                        $("#continue_test_button").prop("disabled",true);
                        $("#generate_report").prop("disabled",true);
                        $("#takeover").prop("disabled",true);
                        $("#release").prop("disabled",false);
                        $("#staffs").prop("disabled",true);
                        $("#test_status_value").text("人工接管中("+staff_name+")");
                    }
                    }
            });
        }
    })
})

//点击释放按钮
$(document).ready(function(){
    $("#release").click(function(){
        var test_stand=$('#test_stand_value').text();
        if (test_stand=="未选择台架"){
            alert("请先选择台架！");
            return false;
        }
        var confirmMessage=confirm("释放后，随时可能发起自动化测试，确定释放吗？")
        if (confirmMessage){
            $.ajax({
                type: "POST",
                url: "/release_takeover",
                contentType: 'application/json;charset=UTF-8',
                data:JSON.stringify({'test_stand': test_stand}),
                success: function(data){
                    if(data["result"]=="disconnected"){
                        alert("与台架连接断开，请检查！");
                        }
                    else if(data["result"]=="failed"){
                        alert("出现异常错误！");
                    }
                    else{
                        $("#takeover").prop("disabled",false);
                        $("#release").prop("disabled",true);
                        $("#staffs").val("");
                        $("#staffs").prop("disabled",false);
                        $("#test_status_value").text("已释放，请刷新状态");
                    }
                    }
            });
        }
    })
})

//点击继续测试按钮
$(document).ready(function(){
    $('#continue_test_button').click(function(){
        var confirmMessage=confirm("确定继续当前测试吗？")
        if (confirmMessage){
            var test_stand=$('#test_stand_value').text();
            var xpu_version=$('#xpu_version_value').text()
            $.ajax({
                type: "POST",
                url: "/continue_test",
                contentType: 'application/json;charset=UTF-8',
                data:JSON.stringify({ 'test_stand': test_stand,'xpu_version':xpu_version}),
                success: function(data){
                    if(data["result"]=="disconnected"){
                        alert("与台架连接断开，请检查！");
                        }
                    else if(data["result"]=="failed"){
                        alert("出现异常错误！");
                    }
                    else{
                        $("#pause_test_button").prop("disabled",false);
                        $("#continue_test_button").prop("disabled",true);
                        $("#test_status_value").text("自动测试中");
                    }
                },
                error: function(xhr, status, error) {
                    console.error("AJAX请求失败：", status, error);
                }
            });
        }

    });
});

//点击选择航线按钮
$(document).ready(function() {
    $('#select_route_btn').click(function() {
        console.log($("#test_stand").val())
        if(!$("#test_stand").val()){
            alert("请先选择台架！")
            return
        }
        var nums_li=$("#airlinesList li").length  //选择航线页面中有几个航线
        //console.log(nums_li);
        if (nums_li>0){
            $("#airlinesModal").show()
        }
        else{
            var test_stand=$("#test_stand").val();  //选择的台架
            var camp=$("#camps").val(); //选择的营地
            var user=$("#users").val(); //选择的用户
            //console.log(camp)
            $.ajax({
                type: 'POST',
                url: '/select_airlines',
                data: JSON.stringify({'test_stand':test_stand}),
                contentType: 'application/json;charset=UTF-8',
                success: function(data) {
                    if(data["result"]=="disconnected"){
                        alert("与台架连接断开，请检查！");
                        }
                    else if(data["result"]=="failed"){
                        alert("出现异常错误，可关注是否新增了营地！");
                    }
                    else{
                        // 填充航线列表
                        $.each(data, function(index, airline) {
                            if (camp=="全部" && user=="全部"){
                                $('#airlinesList').append(
                                `<li class="ui-state-default" style="position:relative"><input type="checkbox" style="position:absolute;left:3%" class="airline" value="${airline.title}" airline_id="${airline.airline_id}" camp_id="${airline.camp_id}" id="${airline.airline_id}"  user_id="${airline.user_id}" onchange="airlineChecked(this, '${airline.airline_id}')"><label style="font-size:16px;position:absolute;left:6%" for="${airline.airline_id}">${airline.title}(${airline.camp_name}-${airline.user_name}-${airline.airline_id})</label><input type="checkbox" style="position:absolute;left:70%" class="back" id="${airline.airline_id}_back" onchange="backChecked(this, '${airline.airline_id}')"><label style="font-size:16px;position:absolute;left:73%" for="${airline.airline_id}_back">返航</label><input type="checkbox" style="position:absolute;left:77%" class="specify-position" id="${airline.airline_id}_specify_position" onchange="togglePositionInput(this, '${airline.airline_id}_position_input')"><label style="font-size:16px;position:absolute;left:80%" for="${airline.airline_id}_specify_position">指定返航位置</label><input type="text" style="position:absolute;left:92%;width:25px" id="${airline.airline_id}_position_input" disabled></li>`
                                );
                            }
                            //如果选择了营地，但没有选择用户
                            else if (camp!="全部" && user=="全部"){
                                if (airline.camp_name==camp){
                                 $('#airlinesList').append(
                                `<li class="ui-state-default" style="position:relative"><input type="checkbox" style="position:absolute;left:3%" class="airline" value="${airline.title}" airline_id="${airline.airline_id}" camp_id="${airline.camp_id}" id="${airline.airline_id}"  user_id="${airline.user_id}" onchange="airlineChecked(this, '${airline.airline_id}')"><label style="font-size:16px;position:absolute;left:6%" for="${airline.airline_id}">${airline.title}(${airline.camp_name}-${airline.user_name}-${airline.airline_id})</label><input type="checkbox" style="position:absolute;left:70%" class="back" id="${airline.airline_id}_back" onchange="backChecked(this, '${airline.airline_id}')"><label style="font-size:16px;position:absolute;left:73%" for="${airline.airline_id}_back">返航</label><input type="checkbox" style="position:absolute;left:77%" class="specify-position" id="${airline.airline_id}_specify_position" onchange="togglePositionInput(this, '${airline.airline_id}_position_input')"><label style="font-size:16px;position:absolute;left:80%" for="${airline.airline_id}_specify_position">指定返航位置</label><input type="text" style="position:absolute;left:92%;width:25px" id="${airline.airline_id}_position_input" disabled></li>`
                                );
                                }
                            }
                            //如果选择用户，但没有选择营地
                            else if (camp=="全部" && user!="全部"){
                                if (airline.user_name==user){
                                 $('#airlinesList').append(
                                `<li class="ui-state-default" style="position:relative"><input type="checkbox" style="position:absolute;left:3%" class="airline" value="${airline.title}" airline_id="${airline.airline_id}" camp_id="${airline.camp_id}" id="${airline.airline_id}"  user_id="${airline.user_id}" onchange="airlineChecked(this, '${airline.airline_id}')"><label style="font-size:16px;position:absolute;left:6%" for="${airline.airline_id}">${airline.title}(${airline.camp_name}-${airline.user_name}-${airline.airline_id})</label><input type="checkbox" style="position:absolute;left:70%" class="back" id="${airline.airline_id}_back" onchange="backChecked(this, '${airline.airline_id}')"><label style="font-size:16px;position:absolute;left:73%" for="${airline.airline_id}_back">返航</label><input type="checkbox" style="position:absolute;left:77%" class="specify-position" id="${airline.airline_id}_specify_position" onchange="togglePositionInput(this, '${airline.airline_id}_position_input')"><label style="font-size:16px;position:absolute;left:80%" for="${airline.airline_id}_specify_position">指定返航位置</label><input type="text" style="position:absolute;left:92%;width:25px" id="${airline.airline_id}_position_input" disabled></li>`
                                );
                                }
                            }
                            //如果选择了营地和用户
                            else{
                                if (airline.camp_name==camp && airline.user_name==user){
                                 $('#airlinesList').append(
                                `<li class="ui-state-default" style="position:relative"><input type="checkbox" style="position:absolute;left:3%" class="airline" value="${airline.title}" airline_id="${airline.airline_id}" camp_id="${airline.camp_id}" id="${airline.airline_id}"  user_id="${airline.user_id}" onchange="airlineChecked(this, '${airline.airline_id}')"><label style="font-size:16px;position:absolute;left:6%" for="${airline.airline_id}">${airline.title}(${airline.camp_name}-${airline.user_name}-${airline.airline_id})</label><input type="checkbox" style="position:absolute;left:70%" class="back" id="${airline.airline_id}_back" onchange="backChecked(this, '${airline.airline_id}')"><label style="font-size:16px;position:absolute;left:73%" for="${airline.airline_id}_back">返航</label><input type="checkbox" style="position:absolute;left:77%" class="specify-position" id="${airline.airline_id}_specify_position" onchange="togglePositionInput(this, '${airline.airline_id}_position_input')"><label style="font-size:16px;position:absolute;left:80%" for="${airline.airline_id}_specify_position">指定返航位置</label><input type="text" style="position:absolute;left:92%;width:25px" id="${airline.airline_id}_position_input" disabled></li>`
                                );
                                }
                            }
                        });
                        var nums_airline=$("#airlinesList li").length;
                        origin_airlines=$('#airlinesList').find('li').get(); //获取原始航线列表
                        console.log(nums_airline);

                        //如果选择航线前勾选了冒烟测试，则在航线选择界面要勾选相应航线
                        if ($("#smokeCheckbox").prop("checked")){
                            console.log("airlines is "+selectedAirlines)
                            selectedAirlines.forEach(function(airline) {
                            // 检查页面上是否存在对应的checkbox
                            var checkbox = $('#' + airline.airline_id);
                            console.log("checkbox is "+checkbox)
                            if (checkbox.length) {
                                // 勾选对应的checkbox
                                checkbox.prop('checked', true);
                            }

                            // 如果title包含"Pback"，则勾选对应的_back checkbox
                            if (airline.title.includes('Pback')) {
                                var backCheckbox = $('#' + airline.airline_id + '_back');
                                if (backCheckbox.length) {
                                    // 勾选对应的_back checkbox
                                    backCheckbox.prop('checked', true);
                                }
                            }
                        });
                            var selectedCount = $('.airline:checked').length;
                            // 更新显示的计数
                            $('.modal-content-select span').text('已选择' + selectedCount + '/' + nums_airline + '条航线');
                        }
                        else{
                            $(".modal-content-select span").text("已选择0/"+nums_airline+"条航线");
                        }
                        // 显示新窗口
                        $('#airlinesModal').show();
                    }
                }
            });
        }

    });
    })

//航线取消选中后，自动取消勾选返航和指定位置返航
function airlineChecked(checkbox,airlineId){
    var backCheckbox=document.getElementById(airlineId+"_back")
    var specificCheckbox=document.getElementById(airlineId+"_specify_position")
    var specificText=document.getElementById(airlineId+"_position_input")
    if (!checkbox.checked){
        backCheckbox.checked=false;
        specificCheckbox.checked=false;
        specificText.disabled=true;
        specificText.value='';
    }
}

//返航选中后，自动选中航线选项框，取消选中后，自动取消勾选指定返航
function backChecked(checkbox, airlineId){

    var airlineCheckbox=document.getElementById(airlineId);
    var specificCheckbox=document.getElementById(airlineId+"_specify_position")
    var specificText=document.getElementById(airlineId+"_position_input")
    if (checkbox.checked) {
        airlineCheckbox.checked=true;
    }
    if (!checkbox.checked){
        specificCheckbox.checked=false;
        specificText.disabled=true;
        specificText.value='';

    }
}

// JavaScript函数用于切换输入框的显示状态
function togglePositionInput(checkbox, inputId) {
    console.log(inputId)
    var aid=inputId.split('_')[0];  //航线id
    var airlineCheckbox=document.getElementById(aid);
    var backCheckbox=document.getElementById(aid+"_back");
    if (!backCheckbox.checked){
        backCheckbox.checked=true;
    }
    var input = document.getElementById(inputId);
    if (checkbox.checked) {
        airlineCheckbox.checked=true;
        input.disabled = false;
        input.focus();
    } else {
        input.disabled = true;
        input.value = '';
    }
}

// 全选逻辑
//$('#selectAll').click(function() {
//    $('.airline').prop('checked', this.checked);
//    var nums_li=$("#airlinesList li").length  //选择航线页面中有几个航线
//    if ($('#selectAll').prop("checked")==true){
//        $(".modal-content-select span").text("已选择"+nums_li+"/"+nums_li+"条航线");
//    }
//    else{
//        $(".modal-content-select span").text("已选择0/"+nums_li+"条航线");
//    }
//});

// 绑定全选航线复选框的change事件
$('#selectAll').change(function() {
    // 设置所有航线复选框的选中状态与全选复选框相同
    $('.airline').prop('checked', this.checked).trigger('change');
});

// 绑定全选返航复选框的change事件
$('#selectAllBack').change(function() {
    // 设置所有航线复选框的选中状态与全选复选框相同
    $('.back').prop('checked', this.checked).trigger('change');
});

//根据返航复选框的选中状态，设置对应的返航全选框的状态
$(document).ready(function() {
    $('#airlinesList').on('change', '.back', function() {
        var nums_backCheckbox=$(".back").length;
        var nums_checked=$(".back:checked").length;
        if (nums_checked==nums_backCheckbox){
            $("#selectAllBack").prop("checked",true);
        }
        else{
            $("#selectAllBack").prop("checked",false);
        }
    });
});

//选中航线中的某个多选框逻辑,如果选中，当前选中数+1，如果取消选中则-1
$('#airlinesList').on('change', '.airline', function() {
    var nums_li=$("#airlinesList li").length  //选择航线页面中有几个航线
    // 计算当前选中的复选框数量
    var selectedCount = $('.airline:checked').length;
    console.log(selectedCount);
    // 更新显示的计数
    $('.modal-content-select span').text('已选择' + selectedCount + '/' + nums_li + '条航线');
    // 检查是否所有的多选框都被选中了
    var allChecked = $('.airline').length === selectedCount;
    // 设置全选框的状态
    $('#selectAll').prop('checked', allChecked);
});

// 关闭选择航线模态框按钮逻辑
$('#cancelSelection,.close-btn').click(function() {
    $('.modal').hide();
});

//点击航线选择确定按钮
$('#confirmSelection').click(function() {
    selectedAirlines=[];
    //$('#smokeCheckbox').prop("checked",false);  //冒烟测试取消勾选
    var validInput = true; // 增加一个标志变量来跟踪输入是否有效
    // 遍历所有选中的航线复选框并将其值添加到数组中
    $('.airline:checked').each(function() {
        var airline_id=this.getAttribute("airline_id")
        //生成随机的返航高度，值范围为25-35的整数
        var height=Math.floor(Math.random()*11+25);
        //生成随机的返航速度，值范围为18-54的整数
        var speed=Math.floor(Math.random()*37+18);

        if ($(this).next().next().prop("checked")==true){
            if ($(this).next().next().next().next().prop("checked")==true){     //指定返航位置被选中
                var pos_ratio_input="#"+airline_id+"_position_input"
                var pos_ratio=$(pos_ratio_input).val()
                var judge = Number(pos_ratio); // 将字符串转换为数字
                if (isNaN(judge) || judge < 30 || judge > 70) {
                    alert("请输入30~70的数（在航线30%~70%之间的位置返航）");
                    validInput=false;
                    return;
                }
            }
            else{
                //如果航线名不包含“_Back”，则在航线名后加上“_Back_返航位置_返航高度_返航速度”
                //生成随机的返航位置，值范围为30-70
                var pos_ratio = Math.floor(Math.random() * 41) + 30;


            }
            if(this.value.indexOf("_Back")==-1){
                title=this.value+"_Pback_"+pos_ratio+"_"+height+"_"+speed;  //Pback表示Platform Back，即由平台发起的返航
            }
        }
        else{
            console.log(this.value)
            title=this.value;
        }
        selectedAirlines.push({"airline_id":this.getAttribute("airline_id"),"title":title,"camp_id":this.getAttribute('camp_id'),"user_id":this.getAttribute('user_id')});
        console.log(selectedAirlines)
    });

    // 在继续之前检查输入是否有效
    if (!validInput) {
        // 如果输入无效，不再执行后续代码
        return;
    }

    // 将选中的航线名列表存储在一个变量中
    if (selectedAirlines.length==0){
        alert("请至少选择1条航线！");
        return;
    }
    else{
        // 以下为演示目的，可以在控制台打印出来或进行其他操作
        $('#airlinesModal').hide();
        var nums_li=$("#airlinesList li").length  //总共有几个航线
        var nums_selected=selectedAirlines.length;  //选中了几条航线
        $('.select_route span').css("color","black");
        $('.select_route span').text('已选择' + nums_selected + '/' + nums_li + '条航线');
    }
});

//设置选择台架、选择营地、选择用户的选项框长度相同
$(document).ready(function(){
    // 获取3个select元素的宽度
    var widthTestStand = $('#test_stand').outerWidth();
    var widthCamps = $('#camps').outerWidth();
    var widthUsers = $('#users').outerWidth();
    var widthStaffs = $('#staffs').outerWidth();

    // 确定4者之间的最大宽度
    var maxWidth = Math.max(widthTestStand, widthCamps, widthUsers);

    // 设置两个select元素的宽度为最大宽度
    $('#test_stand').css('width', maxWidth);
    $('#camps').css('width', maxWidth);
    $('#users').css('width', maxWidth);
    $('#staffs').css('width', maxWidth-5);
});

//点击查看屏幕按钮
$(document).ready(function(){
    $("#check_screen").click(function(){
        var test_stand = $("#test_stand").val();
        $.ajax({
            type: 'POST',
            url: '/get_screen',  // 注意这里改为 '/get_screen'
            data: JSON.stringify({'test_stand': test_stand}),
            contentType: 'application/json;charset=UTF-8',
            success: function(data){
                // POST 请求成功后，打开一个新窗口进行 GET 请求以获取图片
                window.open('/check_screen', '_blank');
            },
            error: function(xhr, status, error){
                console.error("Error: " + status + " " + error);
            }
        });
    });
});

//点击查看测试进度详情链接
$(document).ready(function(){
    $("#check_finished_airlines").click(function(){
        var test_percent=$("#test_percent_value").text();
        if (test_percent=="未选择台架" || test_percent=="无测试任务" || !test_percent){
            alert("请先选择台架！");
        }
        else{
            var test_stand=$("#test_stand").val();  //选择的台架
            //console.log(camp)
            $.ajax({
                type: 'POST',
                url: '/check_finished_airlines',
                data: JSON.stringify({'test_stand':test_stand}),
                contentType: 'application/json;charset=UTF-8',
                success: function(data) {
                    if(data["result"]=="disconnected"){
                        alert("与台架连接断开，请检查！");
                        }
                    else if(data["result"]=="failed"){
                        alert("出现异常错误！");
                    }
                    else{
                        FinishedAirlines=data;
                        console.log(data)
                        $("#airlines_total_num").text("航线数: "+data["total_num"]);
                        $("#airlines_finish_num").text("完成数: "+data["finished_num"]);
                        $("#airlines_success_num").text("成功数: "+data["success_num"]);
                        $("#airlines_success_rate").text("成功率: "+data["success_rate"]);
                        // 填充航线列表
                        $('#testPercentList').empty();
                        $.each(data["airlines"], function(index, airline) {
//                            $('#testPercentList').append(
//                                `<li><span>${airline.title}</span> <span class="test_status_span">${airline.status}</span></li>`
//                                );
                            if (airline.status=="yes"){
                                $('#testPercentList').append(
                                `<li style="position:relative"><span style="position:absolute;left:10%">${airline.title}</span> <span class="test_status_span" style="position:absolute;left:75%; color: green">✔</span></li>`
                                );
                            }
                            else if (airline.status=="abnormal"){
                                $('#testPercentList').append(
                                `<li style="position:relative"><span style="position:absolute;left:10%">${airline.title}</span> <span class="test_status_span" style="position:absolute;left:75%">❌(${airline.category})</span></li>`
                                );
                            }
                            else{
                                $('#testPercentList').append(
                                `<li style="position:relative"><span style="position:absolute;left:10%">${airline.title}</span> <span class="test_status_span" style="position:absolute;left:75%">未测试</span></li>`
                                );
                            }
                        });
                        // 显示新窗口
                        $('#testPercentModal').show();
                    }
                }
            });
        }
    })
})


$(document).ready(function(){
    //点击饼图按钮，显示饼图
    $("#pie_button").click(function(){
        airlines=FinishedAirlines["airlines"];  //航线字典
        console.log(airlines);
        total_result={};  //存储统计结果

        //使用reduce函数来统计特定键的值出现的频率
        let statist_result = airlines.reduce((acc, obj) => {
            // 检查"category"键是否存在
            if (obj.category) {
                // 如果已经有这个category的计数，则增加，否则初始化为1
                acc[obj.category] = (acc[obj.category] || 0) + 1;
            }
            return acc;
        },{});
        total_result["statist_result"]=statist_result;

        //统计航线形状的数量和成功率
        let shape_result=airlines.reduce((acc, obj) => {
            // 检查"category"键是否存在
            if (obj.shape) {
                // 如果已经有这个category的计数，则增加，否则初始化为1
                acc[obj.shape] = (acc[obj.shape] || 0) + 1;
                if (obj.status=="yes"){
                    acc[obj.shape+"_success"] = (acc[obj.shape+"_success"] || 0) + 1;
                }
            }
            return acc;
        },{});
        total_result["shape_result"]=shape_result;

        //统计失败航线中，航线类型的数量
        let fail_shape_result=airlines.reduce((acc, obj) => {
            // 检查"category"键是否存在
            if (obj.status=="abnormal") {
                // 如果已经有这个category的计数，则增加，否则初始化为1
                acc[obj.shape] = (acc[obj.shape] || 0) + 1;
            }
            return acc;
        },{});
        total_result["fail_shape_result"]=fail_shape_result;

        //统计各航线失败的类型数量
        let fail_category_result=airlines.reduce((acc, obj) => {
            // 检查"category"键是否存在
            if (obj.status=="abnormal") {
                // 如果已经有这个category的计数，则增加，否则初始化为1
                acc[obj.shape+"_"+obj.category] = (acc[obj.shape+"_"+obj.category] || 0) + 1;
            }
            return acc;
        },{});
        total_result["fail_category_result"]=fail_category_result;
        console.log(total_result);

    //ajax传递统计结果到后端
    $.ajax({
        type: 'POST',
        url: '/pie_chart',
        data: JSON.stringify(total_result),
        contentType: 'application/json;charset=UTF-8'
    })
})
})

//点击常规排序按钮
$("#sort_by_speed").on('click', function() {
    // 获取所有航线列表项
    var airlines = $('#airlinesList').find('li').get();

    // 解析速度并排序
    airlines.sort(function(a, b) {
        var titleA = $(a).find('input.airline').val();
        var titleB = $(b).find('input.airline').val();

        var priorityA = getPriorityFromTitle(titleA);
        var priorityB = getPriorityFromTitle(titleB);

        // 如果优先级相同，再根据高度排序
        if (priorityA === priorityB) {
            return getAltitudeFromTitle(titleA) - getAltitudeFromTitle(titleB);
        }

        // 优先级小的在前面，因此比较时用 a - b
        return priorityA - priorityB;
    });
    // 清空列表并重新添加排序后的列表项
    $('#airlinesList').empty().append(airlines);
});

function getPriorityFromTitle(title) {
    // 检查是否为变速或变高航线
    var variableMatch = title.match(/_(V|H)\d+-\d+/);
    if (variableMatch) {
        // 变速或变高航线的优先级设置为最高（即排在最后）
        return Number.MAX_SAFE_INTEGER;
    }

    // 提取速度，用作主要排序依据
    var speedMatch = title.match(/_V(\d+)$/);
    if (speedMatch) {
        return parseInt(speedMatch[1], 10);
    }

    // 如果没有速度信息，则返回最大值
    return Number.MAX_SAFE_INTEGER;
}

function getAltitudeFromTitle(title) {
    // 提取高度，用作次要排序依据
    var altitudeMatch = title.match(/_H(\d+)(?=_V\d+$)/);
    if (altitudeMatch) {
        return parseInt(altitudeMatch[1], 10);
    }

    // 如果没有高度信息，则返回最大值
    return Number.MAX_SAFE_INTEGER;
}


//点击原始排序按钮
$("#sort_by_default").on('click', function() {
    // 清空列表并重新添加原始序列
    $('#airlinesList').empty().append(origin_airlines);
});

//点击随机排序按钮
$("#sort_by_random").on('click', function() {
    // 获取所有航线列表项
    var airlines = $('#airlinesList').find('li').get();

    // 随机排序
    airlines.sort(function(a, b) {
        return Math.random() - 0.5;
    });

    // 清空列表并重新添加排序后的列表项
    $('#airlinesList').empty().append(airlines);
});

$(document).ready(function() {
            $('#smokeCheckbox').change(function() {
                var test_stand =$("#test_stand_value").text();
                if (test_stand=="未选择台架"){
                    alert("请先选择台架！");
                    $(this).prop('checked',false)
                    return false;
                }
                var isChecked = $(this).is(':checked');
                if (isChecked){
                    $.ajax({
                    url: '/get_smoke_airlines',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ isChecked: isChecked }),
                    success: function(response) {
                        // 处理返回的数据
                        selectedAirlines = response;
                        console.log(selectedAirlines);
                        // 你可以在这里将 selectedAirlines 传递给其他函数或者处理逻辑
                        var nums_selected=selectedAirlines.length;  //选中了几条航线
                        $('.select_route span').css("color","black");
                        if ($('.select_route span').text()=="未选择航线"){
                            $('.select_route span').text('已选择冒烟测试' + nums_selected +'条航线');
                        }

                    }
                });
                }
            });
        });


