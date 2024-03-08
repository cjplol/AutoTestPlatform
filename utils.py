import json
import paramiko

#读取json文件
def load_json(json_path):
    with open(json_path) as fp:
        return json.load(fp)

#建立ssh连接
def ssh_link(config,test_stand):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(config[test_stand]["host"], username=config[test_stand]["username"],password=config[test_stand]["password"])
    return ssh

#ssh执行命令，前提：建立了ssh连接
def ssh_cmd(ssh,command):
    stdin, stdout, stderr = ssh.exec_command(command)
    output = stdout.readlines()
    return output

def ssh_close(ssh):
    ssh.close()

'''
查询测试状态，参数（配置字典，台架类型，ssh对象）,返回测试状态：闲置中、版本更新中、自动测试中、暂停中
判断逻辑：
1.自动测试进程数>2时，状态：自动测试中
2.自动测试进程数<=2且更新版本进程数>1时，状态：版本更新中
3.自动测试进程数<=2且更新版本进程数<=1且测试数据文件为空时，状态：闲置中
4.自动测试进程数<=2且更新版本进程数<=1且测试数据文件不为空时，状态：暂停中
'''
def check_test_status(config,test_stand,ssh):
    test_status=''  #测试状态
    '''获取必要数据'''
    auto_test_process_num = int(ssh_cmd(ssh, 'ps aux | grep auto.sikuli | wc -l')[0].strip('\n'))  # 自动测试进程数，>2表示有该进程
    upgrade_process_num=int(ssh_cmd(ssh,'ps aux | grep hil_upgrade | grep /bin/bash | wc -l')[0].strip('\n'))    #更新版本进程数，>1表示有该进程
    test_record_path=config[test_stand]["record_json_path"]  #记录测试数据的json文件路径
    json_nums=int(ssh_cmd(ssh,f'wc -m {test_record_path}')[0].strip('\n').split(' ')[0])  #json文件字符数量
    json_is_empty=True if json_nums<=1 else False   #json文件是否为空
    #print(auto_test_process_num,upgrade_process_num,json_is_empty)
    '''逻辑判断'''
    if auto_test_process_num>2:
        test_status="自动测试中"
    if auto_test_process_num<=2 and upgrade_process_num>1:
        test_status="版本更新中"
    if auto_test_process_num<=2 and upgrade_process_num<=1 and json_is_empty:
        test_status="闲置中"
    if auto_test_process_num<=2 and upgrade_process_num<=1 and json_is_empty==False:
        test_status = "暂停中"

    return test_status

'''
查询测试进度，参数（配置字典，台架类型，ssh对象）
返回测试进度：xx/xxx（例如共测试100条航线，已测试了25条，即25/100)
'''
def check_test_percent(config,test_stand,ssh):
    test_percent=''
    test_status=check_test_status(config,test_stand,ssh)    #查询测试状态
    if test_status=="闲置中" or test_status=="版本更新中":
        test_percent="无测试任务"
    else:
        sftp=ssh.open_sftp()
        with sftp.file(config[test_stand]["record_json_path"]) as remote_file:
            try:
                record_json_list=json.load(remote_file)
                finished_num=str(len(record_json_list))  #已完成的航线数量
            except:
                finished_num='0'
        total_num=ssh_cmd(ssh,f'ls {config[test_stand]["airline_path"]} | wc -l')[0].strip('\n')
        test_percent=finished_num+'/'+total_num
    return test_percent
