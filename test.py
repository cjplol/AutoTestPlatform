from utils import  *
import os

config=load_json('config.json')
test_stand='K4.5'
ssh=ssh_link(config, test_stand)  # 与台架建立ssh连接

cmd="bash -c 'source /opt/ros/noetic/setup.bash && source /home/ht/hulu-2.0-dev/hulu-2.0/sim_platform/sim_msgs/devel/setup.bash && python3 /home/ht/test_group/ht_testkit/AutoAirlineK45/auto.sikuli/get_remain_dis.py'"
output,err=ssh_cmd(ssh,cmd,detach=True)
print(err)