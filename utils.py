import json
import paramiko
import requests
from io import BytesIO


#读取json文件
def load_json(json_path):
    with open(json_path,'r',encoding='utf-8') as fp:
        return json.load(fp)

#建立ssh连接
def ssh_link(config,test_stand):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(config[test_stand]["host"], username=config[test_stand]["username"],password=config[test_stand]["password"],timeout=1)
    return ssh

#ssh执行命令，前提：建立了ssh连接
def ssh_cmd(ssh,command,detach=False):
    # 是否作为独立进程运行，默认为否
    if detach:
        command = f"nohup {command} > /dev/null 2>&1 &"
    stdin, stdout, stderr = ssh.exec_command(command)
    output = stdout.readlines()
    err = stderr.readlines()
    return output

def ssh_close(ssh):
    ssh.close()

'''
查询测试状态，参数（配置字典，台架类型，ssh对象）,返回测试状态：闲置中、版本更新中、自动测试中、暂停中、人工接管中
判断逻辑：
1.自动测试进程数>2时，状态：自动测试中
2.自动测试进程数<=2且更新版本进程数>1时，状态：版本更新中
3.自动测试进程数<=2且更新版本进程数<=1且测试数据文件为空时，状态：闲置中
4.自动测试进程数<=2且更新版本进程数<=1且测试数据文件不为空时，状态：暂停中
5.manual_takeover中若对应台架status为Manual：人工接管中（测试人员姓名）
'''
def check_test_status(manual_dict,config,test_stand,ssh):
    test_status=''  #测试状态

    '''如果当前是人工接管，返回人工接管中'''
    manual_status=manual_dict[test_stand]['status']
    if manual_status=="Manual":
        staff_name=manual_dict[test_stand]['name']
        test_status=f"人工接管中({staff_name})"
        return test_status

    '''如果不是人工接管，获取必要数据'''
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
def check_test_percent(manual_dict,config,test_stand,ssh):
    test_status=check_test_status(manual_dict,config,test_stand,ssh)    #查询测试状态
    if test_status=="闲置中":
        test_percent="无测试任务"
    else:
        sftp=ssh.open_sftp()
        with sftp.file(config[test_stand]["record_json_path"]) as remote_file:
            try:
                record_json_content=json.load(remote_file)
                finished_num=str(len(record_json_content["performance"]))  #已完成的航线数量
            except:
                finished_num='0'

        sftp = ssh.open_sftp()
        with sftp.file(config[test_stand]["airline_list_path"]) as remote_file:
            try:
                record_json_content = json.load(remote_file)
                total_num = str(len(record_json_content))  # 已完成的航线数量
            except:
                total_num = '0'

        test_percent=finished_num+'/'+total_num
        if int(finished_num)==int(total_num) and int(finished_num)!=0:
            test_percent="已测试完毕"
    return test_percent

#获取测试版本类型：“指定版本”或“当前版本”
def get_version_form(config,test_stand,ssh):
    record_json_path=config[test_stand]["record_json_path"]
    sftp = ssh.open_sftp()
    with sftp.file(record_json_path) as remote_file:
        record_json_content = json.load(remote_file)
    version_from=record_json_content["version_form"]

    return version_from

#通过版本名，返回版本号（目前是4位数）
def get_version_num(version_name):
    #MR
    if 'MR' in version_name:
        return version_name.split('-')[1]
    #非MR
    else:
        return version_name.split('-')[0]

#获取xpu版本名
def get_xpu_version(ssh):
    check_xpu_version_command = "ssh xpu ht_app version | grep Version | awk '{print $2}'"
    xpu_version = ssh_cmd(ssh, check_xpu_version_command)  # XPU软件版本号
    xpu_version = xpu_version[0].strip('\n')
    #MR版本
    if 'MR' in xpu_version:
        version_name=xpu_version.split('-')[0]
        version_num=xpu_version.split('-')[1]
    else:
        version_name=xpu_version.split('-')[1]
        version_num = xpu_version.split('-')[0]
    return version_name,version_num

#获取指定台架的可选航线列表
def get_airlines(config,camps_config,user_config,test_stand,ssh):
    get_airlines_py_path=config[test_stand]["get_airlines_py_path"]
    airlines=eval(ssh_cmd(ssh,f"python3 {get_airlines_py_path} no_write")[0])   #no_write表示不写入route_names.json文件
    for airline in airlines:
        airline["camp_name"]=camps_config[str(airline["camp_id"])]
        try:
            airline["user_name"]=user_config[str(airline["user_id"])]
        except:
            airline["user_name"] = "未知"
    #print(airlines_list)
    #airlines_list=[row['title'] for row in airlines_list]
    #print(airlines_list)

    return airlines

#查看测试进度详情
def get_finished_airlines(config,test_stand,ssh):
    check_airlines_result=[]
    check_airlines_result = {"total_num": 0, "finished_num": 0, "success_num": 0, "success_rate":0.0,"airlines": []}
    #获取所有航线id
    sftp = ssh.open_sftp()
    with sftp.file(config[test_stand]["airline_list_path"]) as remote_file:
            record_json_content = json.load(remote_file)
            #total_airlines_id=[item['airline_id'] for item in record_json_content]
            total_airlines_id_name=[{"airline_id":item['airline_id'],"title":item['title']} for item in record_json_content]

    check_airlines_result["total_num"]=len(total_airlines_id_name)     #总航线数量

    #获取已完成航线
    with sftp.file(config[test_stand]["record_json_path"]) as remote_file:
        record_json_content = json.load(remote_file)
        #finished_airlines=[item["airline_name"] for item in record_json_content["performance"]]
        finished_airlines_id_name=[{"airline_id":item["airline_id"],"title":item["airline_name"]} for item in record_json_content["performance"]]

    check_airlines_result["finished_num"]=len(finished_airlines_id_name)   #已完成航线数量
    print([item["airline_id"] for item in finished_airlines_id_name])
    print([item["airline_id"] for item in total_airlines_id_name])
    for i in range(len(total_airlines_id_name)):
        if total_airlines_id_name[i]["airline_id"] in [item["airline_id"] for item in finished_airlines_id_name]:
            indices = [index for index, flight in enumerate(record_json_content["performance"]) if flight['airline_id'] == total_airlines_id_name[i]["airline_id"]]
            if record_json_content["performance"][indices[0]]["finished"]==True:
                try:
                    title=total_airlines_id_name[i]["title"]
                    if title.startswith("Lab_"):
                        shape=title.split('_')[2]   #航线形状
                    else:
                        shape = title.split('_')[1]  # 航线形状
                except:
                    shape="unknown"
                check_airlines_result["airlines"].append({"airline_id":total_airlines_id_name[i]["airline_id"],"title":total_airlines_id_name[i]["title"],"status":"yes","category":"成功","shape":shape})
            else:
                try:
                    title = total_airlines_id_name[i]["title"]
                    if title.startswith("Lab_"):
                        shape = title.split('_')[2]  # 航线形状
                    else:
                        shape = title.split('_')[1]  # 航线形状
                except:
                    shape="unknown"
                check_airlines_result["airlines"].append({"airline_id":total_airlines_id_name[i]["airline_id"],"title":total_airlines_id_name[i]["title"], "status": "abnormal","category":record_json_content["performance"][indices[0]]["category"],"shape":shape})
        else:
            check_airlines_result["airlines"].append({"airline_id":total_airlines_id_name[i]["airline_id"],"title":total_airlines_id_name[i]["title"], "status": "no"})
    try:
        check_airlines_result["success_num"]=len([item for item in check_airlines_result["airlines"] if item["status"]=="yes"])  #成功航线数量
    except:
        pass
    try:
        check_airlines_result["success_rate"]=str(round(check_airlines_result["success_num"]/check_airlines_result["finished_num"]*100,2))+'%'  #成功率
    except:
        pass
    print(check_airlines_result)
    return check_airlines_result

#获取指定台架的自动化测试日志内容
def get_log_content(config,test_stand,ssh):
    log_path=config[test_stand]["autotest_log_path"]
    get_log_cmd=f"cat {log_path}"
    log_content=ssh_cmd(ssh,get_log_cmd)

    return log_content

# 自定义函数来格式化饼图的标签
def make_autopct(values):
    def my_autopct(pct):
        total = sum(values)
        val = int(round(pct*total/100.0))
        return '{v:d} ({p:.1f}%)'.format(p=pct, v=val)
    return my_autopct

def save_statist_plt(total_result):
    import matplotlib.pyplot as plt
    import numpy as np
    '''航线成功、失败类型统计'''
    statist_result=total_result['statist_result']
    total_num = sum(statist_result.values())  # 总数量
    success_num = statist_result.get('成功', 0)  # 成功数量
    fail_num = total_num - success_num  # 失败数量
    total_success_rate = float(success_num) / float(total_num) * 100 if total_num != 0 else 0  # 成功率
    # 从字典中提取信息
    categorys = list(statist_result.keys())  # 航线结果类别
    nums = list(statist_result.values())  # 航线结果数量

    '''航线形状的数量和成功率统计'''
    shape_result=total_result['shape_result']
    shapes = []
    counts = []
    success_counts = []
    success_rates = []

    for key, value in shape_result.items():
        if not key.endswith("_success"):
            # 形状名称
            shapes.append(key)
            # 总数
            counts.append(value)
            # 成功数
            success_key = f"{key}_success"
            success_count = shape_result.get(success_key, 0)
            success_counts.append(success_count)
            # 成功率
            success_rate = (success_count / value) * 100 if value != 0 else 0
            success_rates.append(success_rate)

    '''失败航线的形状数量统计'''
    fail_shapes=[]
    fail_counts=[]
    fail_shape_result=total_result['fail_shape_result']

    for key, value in fail_shape_result.items():
        # 失败名称
        fail_shapes.append(key)
        # 失败总数
        fail_counts.append(value)

    '''各形状的失败航线异常类型数量统计'''
    fail_category_result=total_result['fail_category_result']
    #fail_categorys = fail_category_result.keys()
    fail_shapes2=[]
    fail_categorys=[]
    for key, value in fail_category_result.items():
        shape=key.split('_')[0]
        if shape not in fail_shapes2:
            fail_shapes2.append(shape)
        category=key.split('_')[1]
        if category not in fail_categorys:
            fail_categorys.append(category)




    '''绘图'''
    plt.rcParams['font.sans-serif'] = ['SimHei']  # Windows下使用SimHei字体
    plt.rcParams['font.family'] = 'sans-serif'
    plt.rcParams['axes.unicode_minus'] = False  # 解决负号'-'显示为方块的问题

    ''' 第一个子图：展示航线成功、失败类型统计饼图'''
    plt.figure(figsize=(10, 6))
    # 绘制饼图并将数量和成功率放置在饼图对应的扇区中
    patches, texts, autotexts = plt.pie(nums, labels=categorys, autopct=make_autopct(nums), startangle=90,
                                        textprops={'fontsize': 14})

    # 为了确保饼图的百分比文本不会超出饼图的边界，我们可以设置文本的颜色
    for autotext in autotexts:
        autotext.set_color('black')

    # 设置标题，并调整位置以避免和文本重叠
    plt.title('成功数、失败数、成功率', fontsize=18, pad=20)

    # 获取当前轴（Axes），以便在轴的坐标系中放置文本
    ax = plt.gca()

    # 添加总数量、成功数、失败数、成功率信息，位置使用轴的分数坐标
    plt.text(-2, 1, f'总数量: {total_num}', fontsize=12)
    plt.text(-2, 0.8, f'成功数: {success_num}', fontsize=12)
    plt.text(-2, 0.6, f'失败数: {fail_num}', fontsize=12)
    plt.text(-2, 0.4, f'成功率: {total_success_rate:.1f}%', fontsize=12)

    plt.axis('equal')
    plt.savefig('static/chart1.png')
    plt.close()

    '''第二个子图：展示航线形状的数量和成功率统计条形图'''
    plt.figure(figsize=(10, 6))
    index = np.arange(len(shapes))
    bar_width = 0.35
    y_max = max(counts) * 1.2  # 设置y轴的上限为最大条形数的1.2倍

    # 绘制总数和成功数的条形图
    bars_total = plt.bar(index, counts, bar_width, label='总数', color='orange')
    bars_success = plt.bar(index + bar_width, success_counts, bar_width, label='成功数', color='green')

    # 添加标签和标题
    plt.xlabel('形状')
    plt.ylabel('数量')
    plt.title('各形状的数量、成功数和成功率', fontsize=18)
    plt.xticks(index + bar_width / 2, shapes)
    plt.ylim(0, y_max)  # 应用y轴的上限

    # 在每个条形图上显示数量和成功率
    for idx, (rect_total, rect_success) in enumerate(zip(bars_total, bars_success)):
        # 显示总数
        height_total = rect_total.get_height()
        text_position_total = height_total + 0.03 * y_max if height_total < 0.9 * y_max else height_total - 0.05 * y_max
        text_color_total = 'black' if height_total < 0.9 * y_max else 'white'
        plt.text(rect_total.get_x() + rect_total.get_width() / 2., text_position_total, f'{counts[idx]}', ha='center',
                 va='bottom', color=text_color_total)

        # 显示成功数
        height_success = rect_success.get_height()
        text_position_success = height_success + 0.03 * y_max if height_success < 0.9 * y_max else height_success - 0.05 * y_max
        text_color_success = 'black' if height_success < 0.9 * y_max else 'white'
        plt.text(rect_success.get_x() + rect_success.get_width() / 2., text_position_success, f'{success_counts[idx]}',
                 ha='center', va='bottom', color=text_color_success)

        # 显示成功率
        success_rate = success_rates[idx]
        y_value = height_total + 0.08 * y_max if height_total < 0.9 * y_max else height_total - 0.05 * y_max
        plt.text(rect_total.get_x() + rect_total.get_width(), y_value, f'{success_rate:.1f}%', ha='center', va='bottom',
                 color=text_color_total)

    plt.legend(loc='upper left')  # 将图例放置在图表的右上角
    # 调整布局
    plt.tight_layout()
    plt.savefig('static/chart2.png')
    plt.close()

    '''第三个子图：展示失败航线的形状数量统计饼图'''
    plt.figure(figsize=(10, 6))
    plt.pie(fail_counts, labels=fail_shapes, autopct=make_autopct(fail_counts), startangle=90,
            textprops={'fontsize': 14})
    plt.title('失败航线的形状数量统计', fontsize=18)
    plt.axis('equal')
    plt.savefig('static/chart3.png')
    plt.close()

    '''第四个子图：展示各形状的失败航线异常类型数量统计条形图'''
    plt.figure(figsize=(10, 6))
    bar_width = 0.35
    index = np.arange(len(fail_shapes2))
    color_map = plt.get_cmap('tab10')
    for i, category in enumerate(fail_categorys):
        category_counts = [fail_category_result.get(f"{shape}_{category}", 0) for shape in fail_shapes2]
        plt.bar(index + i * bar_width, category_counts, bar_width, label=category, color=color_map(i))
    plt.title('各形状的失败航线异常类型数量统计')
    plt.xlabel('形状')
    plt.ylabel('异常类型数量')
    plt.xticks(index + bar_width * (len(fail_categorys) - 1) / 2, fail_shapes2)
    plt.legend(title='异常类型')
    plt.savefig('static/chart4.png')
    plt.close()

#截屏并获取图片内容
def get_check_screen(config,ssh,test_stand):
    screenshot_cmd = f"python3 {config[test_stand]['screen_shot_py_path']} {config[test_stand]['HOMEPATH']} platform_screenshot"
    output = ssh_cmd(ssh, screenshot_cmd)
    print(output)
    screenshot_path=f"{config[test_stand]['HOMEPATH']}/Pictures/platform_screenshot.png"
    print(screenshot_path)
    # 使用paramiko的sftp客户端下载图片
    sftp = ssh.open_sftp()
    file_like_object = BytesIO()
    sftp.getfo(screenshot_path, file_like_object)
    file_like_object.seek(0)
    sftp.close()
    ssh.close()

    return file_like_object

#获取自驾中心人员列表
def get_adc_staff():
    url = "http://usermdm.aeroht.local:7080/mdm/token"

    payload = json.dumps({
        "serverName": "ADC-CICD",
        "secretKey": "ebk2UCGpAZgeYb5"
    })
    headers = {
        'Content-Type': 'application/json'
    }

    response = requests.request("POST", url, headers=headers, data=payload)

    print(response.text)
    token = response.text

    url = "http://usermdm.aeroht.local:7080/mdm/orgEmployee/all"

    payload = {}
    headers = {
        'token': token
    }

    response = requests.request("GET", url, headers=headers, data=payload)

    # print(type(response.text))
    staff_list = response.json()
    adc_group_list = ['测试组', "软件平台组", "仿真平台组", "感知算法组", "决策规划组", "系统工程组", "自动驾驶中心",
                      "空中地图组", "大数据组"]
    adc_staff_list = [staff["empname"] for staff in staff_list if staff["orgdepartname"] in adc_group_list]

    return adc_staff_list

if __name__ == '__main__':
    import os
    record_path = os.path.join(os.path.dirname(__file__), 'record.json')
    a=load_json(record_path)

