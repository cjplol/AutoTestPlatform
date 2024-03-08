from flask import Flask, render_template,send_file,url_for,request,redirect
from utils import load_json,ssh_link,ssh_cmd,check_test_status,ssh_close,check_test_percent

app = Flask(__name__)

config=load_json('config.json') #读取config.json文件
@app.route('/',methods=['GET','POST'])
def show_index():
    test_stands = list(config.keys())  # 台架列表
    if request.method=='POST':
        #如果点击开始测试按钮
        if request.form['action']=='start':
            test_stand = request.form['test_stand'] #点击按钮时选择的台架
            version_radio_value=request.form['version_radio']   #点击按钮时选择的测试版本：specific或current
            print(version_radio_value)
            #如果测试指定版本
            if version_radio_value=="specific":
                version = request.form['version']  # 点击按钮时输入的版本
                ssh=ssh_link(config,test_stand)
                command = f"/home/daa/test_group/manifest/cicd/hil/hil_upgrade_and_test.sh {version} {version}"
                print(command)
                output=ssh_cmd(ssh,command)
                print(output)

            #如果测试当前版本
            if version_radio_value=="current":
                ssh=ssh_link(config,test_stand)
                command = "auto_airline"
                output=ssh_cmd(ssh,command)
                print(output)

            return redirect(url_for('show_index'))

        #如果点击查看状态按钮
        if request.form['action']=='check':
            test_stand = request.form['test_stand']  # 选择的台架类型
            ssh=ssh_link(config,test_stand)     #与台架建立ssh连接
            check_xpu_version_command='ssh xpu "ht_app version" | grep Version | grep -oE "[0-9]+\.[0-9]+\.[A-Z0-9]+-[0-9]+"'
            xpu_version=ssh_cmd(ssh,check_xpu_version_command)[0].strip('\n')   #XPU软件版本号
            test_status=check_test_status(config,test_stand,ssh)   #测试状态：闲置中、版本更新中、自动测试中、暂停中
            test_percent=check_test_percent(config,test_stand,ssh)  #测试进度：xx/xxx
            ssh_close(ssh)
            print(test_stand,xpu_version,test_status,test_percent)
            return render_template('check_result.html', test_stands=test_stands,test_stand=test_stand,xpu_version=xpu_version,test_status=test_status,test_percent=test_percent)

    else:
        return render_template('index.html', test_stands=test_stands)

#测试结果页面
@app.route('/test_results')
def show_test_results():
    return render_template('test_results.html')

#测试报告页面
@app.route('/test_reports')
def show_test_reports():
    #return render_template('test_reports.html')
    return send_file('templates/03-04-1518.html')

@app.route('/check_result')
def show_check_result():
    test_stands = list(config.keys())  # 台架列表
    return render_template('check_result.html')

if __name__ == '__main__':
    app.run(debug=True,host='0.0.0.0',port=1234)
    # test_stand="K4.5"
    # ssh = ssh_link(config, test_stand)
    # print(ssh_cmd(ssh,"ps aux | grep hil_upgrade | grep /bin/bash | wc -l"))