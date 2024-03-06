from flask import Flask, render_template,send_file,jsonify,request
from utils import load_json,ssh_link,ssh_cmd

app = Flask(__name__)

config=load_json('config.json') #读取config.json文件
@app.route('/')
@app.route('/index')
def show_index():
    test_stands=list(config.keys()) #台架列表
    test_stand = request.args.get('test_stand') #点击按钮时选择的台架
    version = request.args.get('version')   #点击按钮时输入的版本
    version_radio_value=request.args.get('version_radio')   #点击按钮时选择的测试版本：specific或current

    #如果测试指定版本
    if version_radio_value=="specific":
        ssh=ssh_link(config,test_stand)
        command = f"/home/daa/test_group/manifest/cicd/hil/hil_upgrade_and_test.sh {version} {version}"
        output=ssh_cmd(ssh,command)
        print(output)

    #如果测试当前版本
    if version_radio_value=="current":
        ssh=ssh_link(config,test_stand)
        command = "auto_airline"
        output=ssh_cmd(ssh,command)
        print(output)

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



if __name__ == '__main__':
    app.run(debug=True,host='0.0.0.0',port=1234)
    # test_stand="K4.5"
    # ssh = ssh_link(config, test_stand)
    # print(ssh_cmd(ssh,"ps aux | grep hil_upgrade | grep /bin/bash | wc -l"))