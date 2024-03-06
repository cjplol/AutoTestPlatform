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
    ssh.close()
    return output