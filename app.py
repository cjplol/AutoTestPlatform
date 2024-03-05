from flask import Flask, render_template,send_file,jsonify,request
import json
import paramiko

app = Flask(__name__)

def load_config():
    with open('config.json') as fp:
        return json.load(fp)
config=load_config()

@app.route('/')
@app.route('/index')
def show_index():

    test_stands=list(config.keys()) #台架列表
    test_stand = request.args.get('test_stand') #点击按钮时选择的台架
    version = request.args.get('version')   #点击按钮时输入的版本
    #点击测试按钮后，如果符合条件，则开始测试
    if test_stand=='K4.5' and version:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(config[test_stand]["host"], username=config[test_stand]["username"], password=config[test_stand]["password"])
        command="/home/daa/test_group/manifest/cicd/hil/hil_upgrade_and_test.sh 3843 3843"
        stdin, stdout, stderr = ssh.exec_command(command)
        output = stdout.readlines()
        print(output)
        ssh.close()

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