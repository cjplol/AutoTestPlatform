import json

from flask import Flask, render_template,send_file,url_for,request,redirect,jsonify
from utils import *
import os
import time

app = Flask(__name__)

config_path=os.path.join(os.path.dirname(__file__),'config.json')   #config.json存储台架配置
config=load_json(config_path) #读取config.json文件

camps_path=os.path.join(os.path.dirname(__file__),'camp.json')     #camp.json存储营地id对应营地名
camps_config=load_json(camps_path)  #读取camp.json文件

user_path=os.path.join(os.path.dirname(__file__),'user.json')     #user.json存储用户id及对应的用户名
user_config=load_json(user_path)  #读取user.json文件

smoke_airlines_path=os.path.join(os.path.dirname(__file__),"smoke_airlines.json")    #保存冒烟测试航线的文件

record_path=os.path.join(os.path.dirname(__file__),'record.json')   #测试记录文件路径

manual_path=os.path.join(os.path.dirname(__file__),'manual_takeover.json')  #人工接管信息路径

@app.route('/',methods=['GET','POST'])
def show_index():
    test_stands = list(config.keys())   #台架列表
    camps=list(camps_config.values())   #营地名列表
    users=list(user_config.values())    #用户名列表
    #staffs=get_adc_staff()      #获取自驾中心人员列表

    return render_template('index.html', test_stands=test_stands,camps=camps,users=users)

#创建航线页面
@app.route('/create_airline')
def show_create_airline():
    return redirect("http://10.32.11.219/login")

#测试结果页面
@app.route('/test_results')
def show_test_results():
    return redirect("https://xiaopeng.feishu.cn/drive/folder/RuYNfFcWblTbTvdgCuWcsq6DnQg")

#测试报告页面
@app.route('/test_reports')
def show_test_reports():
    #return render_template('test_reports.html')
    #return send_file('templates/03-04-1518.html')
    return redirect("https://dataprocess.aeroht.net/dataPro/benchReport")

#查看日志页面
@app.route('/view_log',methods=['GET','POST'])
def view_log():
    data = request.get_json()
    print(data)
    test_stand = data["test_stand"]
    print(test_stand)
    try:
        ssh = ssh_link(config, test_stand)  # 与台架建立ssh连接
    except:
        return jsonify({"result":"disconnected"})
    try:
        log_content=get_log_content(config,test_stand,ssh) #获取日志内容
        ssh_close(ssh)
        return jsonify({"log_content": log_content})
    except:
        return jsonify({"result":"failed"})

@app.route('/start_test',methods=['POST'])
def start_test():
    data=request.get_json() #获取ajax json数据
    print(data)
    test_stand=data["test_stand"]
    version_text=data["version_text"]
    select_airlines_list=data["selected_airlines"]  #列表形式
    select_airlines_list = json.dumps(select_airlines_list).replace('"', '\\"')
    try:
        ssh = ssh_link(config, test_stand)
    except:
        return jsonify({"result": "disconnected"})
    version_name, version_num = get_xpu_version(ssh)  # 获取xpu版本名
    try:
        #如果是指定版本测试
        if data["whether_specific"]:
            #如果输入版本号与当前版本号不同，则更新后再测试
            if version_text!=version_num:
                command = f"""bash -c 'source {config[test_stand]["ros_path"]} && source {config[test_stand]["ros_workspace"]} && {config[test_stand]["update_test_bash_path"]} "{version_text}" "{version_text}" "" "{select_airlines_list}" "{test_stand}"'"""
            #如果输入版本号与当前版本号相同，则直接开始测试
            else:
                command = f"""bash -c 'source {config[test_stand]["ros_path"]} && source {config[test_stand]["ros_workspace"]} && {config[test_stand]["test_bash_path"]} "{version_text}" "{version_text}" "" "{select_airlines_list}" "{test_stand}"'"""
            print(command)
            output=ssh_cmd(ssh, command,detach=True)
            print(output)

        #当前版本测试
        else:
            command = f"""bash -c 'source {config[test_stand]["ros_path"]} && source {config[test_stand]["ros_workspace"]} && auto_airline "" "" "{select_airlines_list}" "{test_stand}"'"""
            print(command)
            output=ssh_cmd(ssh, command,detach=True)
            print(output)

        time.sleep(5)   #等待5s，确保测试进程已经启动，获取正确的测试进度
        version_name,version_num=get_xpu_version(ssh)  #获取xpu版本名
        manual_dict = load_json(manual_path)
        test_status = check_test_status(manual_dict,config, test_stand, ssh)  # 测试状态：闲置中、版本更新中、自动测试中、暂停中
        test_percent = check_test_percent(manual_dict,config, test_stand, ssh)  # 测试进度：xx/xxx
        ssh_close(ssh)
        return jsonify({"result": "connected", "xpu_version": version_name+'-'+version_num, "test_status": test_status, "test_percent": test_percent})
    except:
        return jsonify({"result":"failed"})

#查看状态按钮点击后
@app.route('/check_status',methods=['POST'])
def check_status():
    data=request.get_json() #获取ajax json数据
    test_stand=data.get('test_stand')
    #print(test_stand)
    try:
        ssh = ssh_link(config, test_stand)  # 与台架建立ssh连接
    except:
        return jsonify({"result":"disconnected"})
    try:
        version_name, version_num = get_xpu_version(ssh)  # 获取xpu版本名
        version=version_name+'-'+version_num
    except:
        version="连接xpu失败"
    try:
        manual_dict = load_json(manual_path)
        test_status = check_test_status(manual_dict,config, test_stand, ssh)  # 测试状态：闲置中、版本更新中、自动测试中、暂停中
        test_percent = check_test_percent(manual_dict,config, test_stand, ssh)  # 测试进度：xx/xxx
        ssh_close(ssh)
        return jsonify({"result":"connected","xpu_version":version,"test_status":test_status,"test_percent":test_percent})
    except:
        return jsonify({"result":"failed"})


#暂停测试按钮点击后
@app.route('/pause_test',methods=['POST'])
def pause_test():
    data=request.get_json() #获取JSON数据
    test_stand=data.get('test_stand')
    try:
        ssh = ssh_link(config, test_stand)  # 与台架建立ssh连接
    except:
        return jsonify({"result":"disconnected"})
    #print(test_stand)
    try:
        pause_test_command = 'ps aux | grep "auto.sikuli" | grep -v grep | awk \'{print $2}\' | xargs kill'
        xpu_stop_command= """ssh xpu 'echo "nvidia" | sudo -S ht_app stop'"""
        sim_stop_command=f"echo {config[test_stand]['password']} | sudo -S bash {config[test_stand]['kill_sim_bash_path']}"
        #如果是K4.5台架，还需要关闭Simulink和Fcu
        if "K4.5" in test_stand:
            SimFcu_stop_command="ssh HT@172.20.1.179 'python E:/ht_testkit/MatlabController/MatlabController.py -c'"
            ssh_cmd(ssh, SimFcu_stop_command)  # 停止Simulink和关闭Fcu
        ssh_cmd(ssh, pause_test_command)  # 暂停测试
        ssh_cmd(ssh,xpu_stop_command)   #关闭ht_app
        ssh_cmd(ssh,sim_stop_command)   #停止仿真
        ssh_close(ssh)
        return jsonify({'result':'success'})
    except:
        return jsonify({"result": "failed"})

#继续测试按钮点击后
@app.route('/continue_test',methods=['POST'])
def continue_test():
    data=request.get_json() #获取JSON数据
    test_stand=data.get('test_stand')
    xpu_version=data.get('xpu_version')
    try:
        ssh = ssh_link(config, test_stand)  # 与台架建立ssh连接
    except:
        return jsonify({"result":"disconnected"})

    version_form = get_version_form(config,test_stand,ssh)  # 获取测试版本类型：“指定版本”或“当前版本”
    try:
        #先前启动测试选择的是“指定版本”
        if version_form=="specific":
            version_name, version_num = get_xpu_version(ssh)  # 获取xpu版本名
            print(version_num)
            continue_test_command = f"""bash -c 'source {config[test_stand]["ros_path"]} && source {config[test_stand]["ros_workspace"]} && {config[test_stand]["test_bash_path"]} "{version_num}" "{version_num}" "continue" "" "{test_stand}"'"""
            print(continue_test_command)
            ssh_cmd(ssh, continue_test_command,detach=True)  # 继续测试
        # 先前启动测试选择的是“当前版本”
        if version_form=="current":
            continue_test_command = f"""bash -c 'source {config[test_stand]["ros_path"]} && source {config[test_stand]["ros_workspace"]} && auto_airline "" "continue"'"""
            print(continue_test_command)
            ssh_cmd(ssh, continue_test_command,detach=True)  # 继续测试
        ssh_close(ssh)
        return jsonify({'result':'success'})
    except:
        return jsonify({"result": "failed"})

@app.route('/select_airlines',methods=["POST"])
def select_airlines():
    #return jsonify(AIRLINES)
    data = request.get_json()  # 获取JSON数据
    test_stand = data.get('test_stand')

    try:
        ssh = ssh_link(config, test_stand)  # 与台架建立ssh连接
    except:
        return jsonify({"result":"disconnected"})
    try:
        airlines=get_airlines(config,camps_config,user_config,test_stand,ssh)  #获取可选航线列表
        print(airlines)
        ssh_close(ssh)
        return jsonify(airlines)
    except:
        return jsonify({"result": "failed"})

#查看测试进度详情
@app.route('/check_finished_airlines',methods=["POST"])
def check_finished_airlines():
    data = request.get_json()
    test_stand = data.get('test_stand')
    try:
        ssh = ssh_link(config, test_stand)  # 与台架建立ssh连接
    except:
        return jsonify({"result":"disconnected"})
    #airlines = get_finished_airlines(config, test_stand, ssh)
    try:
        airlines = get_finished_airlines(config,test_stand,ssh) #字典形式
        ssh_close(ssh)
        #print(airlines)
        return jsonify(airlines)
    except Exception as e:
        print(f"错误信息{e}")
        return jsonify({"result": "failed"})

#查看测试进度详情页面，点击饼图后，显示饼图
@app.route('/pie_chart',methods=["POST"])
def show_pie_chart():
    total_result = request.get_json() #统计结果，字典形式
    save_statist_plt(total_result)  #保存统计图
    return jsonify({"result":"success"})

@app.route('/get_screen', methods=["POST"])
def get_screen():
    test_stand = request.get_json()["test_stand"]  # 台架类型
    ssh = ssh_link(config, test_stand)  # 与台架建立ssh连接
    screenshot_file = get_check_screen(config, ssh, test_stand)
    # 将 BytesIO 对象保存为全局变量，以便稍后在 GET 请求中使用
    global image_buffer
    image_buffer = screenshot_file
    # 返回一个成功的响应
    return jsonify({"message": "Screenshot captured successfully."})

@app.route('/check_screen', methods=["GET"])
def check_screen():
    global image_buffer
    if image_buffer:
        image_buffer.seek(0)  # 重置指针到文件的开始位置
        return send_file(image_buffer, mimetype='image/png', as_attachment=False)
    else:
        return "No screenshot available", 404

@app.route('/cicd', methods=['GET'])
def cicd_start_test():
    # 从查询字符串中获取参数
    test_stand = request.args.get('bench')
    airline = request.args.get('airline')
    version_text = request.args.get('version')
    print(f'接收到测试请求，台架：{test_stand}、航线：{airline}，版本号：{version_text}')

    # 检查参数是否已提供
    if not all([test_stand, airline, version_text]):
        print("提供参数有误，拒绝测试")
        return jsonify({"error": "Missing parameters"}), 400

    try:
        ssh = ssh_link(config, test_stand)  # 与台架建立ssh连接
    except:
        print("连接ssh失败，拒绝测试")
        return jsonify({"error": "ssh link error"}), 400

    # 检查测试状态，如果是自动测试中或版本更新中，则拒绝执行测试
    manual_dict = load_json(manual_path)
    status=check_test_status(manual_dict,config, test_stand, ssh)

    #检查是否处于人工测试
    if status.startswith("人工接管中"):
        print("人工接管中，拒绝测试")
        return jsonify({"error": "There are currently in the manual takeover state"}), 400

    #检查测试进度
    test_percent=check_test_percent(manual_dict,config, test_stand, ssh)
    if test_percent!="无测试任务" and test_percent!="已测试完毕":
        print("当前有正在进行的测试任务，拒绝测试")
        return jsonify({"error": "There are currently tasks being tested"}), 400

    if airline=='all':
        command = f"""bash -c 'source {config[test_stand]["ros_path"]} && source {config[test_stand]["ros_workspace"]} && {config[test_stand]["update_test_bash_path"]} "{version_text}" "{version_text}" "" "" "{test_stand}"'"""
    elif airline=='smoke':
        airlines_list=load_json(smoke_airlines_path)
        command = f"""bash -c 'source {config[test_stand]["ros_path"]} && source {config[test_stand]["ros_workspace"]} && {config[test_stand]["update_test_bash_path"]} "{version_text}" "{version_text}" "" "{airlines_list}" "{test_stand}"'"""
    else:
        print("航线参数有误，拒绝测试")
        return jsonify({"error": "parameter airline error!"}), 400

    print(command)
    output = ssh_cmd(ssh, command, detach=True)
    print(output)

    #返回响应
    return jsonify({
        "message": "Test started",
        "bench": test_stand,
        "airline": airline,
        "version": version_text,
    })

@app.route('/get_smoke_airlines',methods=['POST'])
def get_smoke_airlines():
    smoke_airlines=load_json(smoke_airlines_path)
    return jsonify(smoke_airlines)

@app.route('/generate_report',methods=['POST'])
def generate_report():
    test_stand=request.get_json()['test_stand']
    try:
        ssh = ssh_link(config, test_stand)  # 与台架建立ssh连接
    except:
        return jsonify({"result":"disconnected"})
    try:
        version_name, version_num = get_xpu_version(ssh)  # 获取xpu版本名
    except:
        return jsonify({"result":"xpu"})
    try:
        generate_report_cmd=f"python3 {config[test_stand]['generator_report_pyt_path']} {config[test_stand]['record_json_path']} {test_stand.replace('.','')} {version_name} {version_num}"
        ssh_cmd(ssh,generate_report_cmd)
        ssh_close(ssh)
        return jsonify({"result": "success"})
    except:
        return jsonify({"result":"failed"})

#点击接管按钮后，根据台架名和测试人员姓名进行人工接管
@app.route("/manual_takeover",methods=["POST"])
def manual_takeover():
    manual_dict = load_json(manual_path)
    test_stand=request.get_json()['test_stand'] #台架名
    staff_name=request.get_json()['staff_name'] #员工姓名
    try:
        ssh = ssh_link(config, test_stand)
    except:
        return jsonify({"result": "disconnected"})
    try:
        test_status = check_test_status(manual_dict,config, test_stand, ssh)  # 测试状态：闲置中、版本更新中、自动测试中、暂停中
        print(test_status)
        ssh_close(ssh)
        if test_status=="闲置中" or test_status=="暂停中":
        #if test_status:
            #读取字典状态

            # 改变接管状态并写入字典
            manual_dict[test_stand]["status"]="Manual"
            manual_dict[test_stand]["name"] = staff_name
            with open(manual_path,'w') as fp:
                json.dump(manual_dict,fp)
        return jsonify({"test_status":test_status})
    except:
        return jsonify({"result":"failed"})

@app.route("/release_takeover",methods=["POST"])
def release_takeover():
    manual_dict = load_json(manual_path)
    test_stand=request.get_json()['test_stand'] #台架名
    try:
        # 改变接管状态并写入字典
        manual_dict[test_stand]["status"]="Auto"
        manual_dict[test_stand]["name"] = ""
        with open(manual_path,'w') as fp:
            json.dump(manual_dict,fp)
        return jsonify({"result":"success"})
    except:
        return jsonify({"result":"failed"})


if __name__ == '__main__':
    app.run(debug=True,host='0.0.0.0',port=1234)


