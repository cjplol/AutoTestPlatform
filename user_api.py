import requests
import json

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

#print(type(response.text))
staff_list=response.json()
adc_group_list=['测试组',"软件平台组","仿真平台组","感知算法组","决策规划组","系统工程组","自动驾驶中心","空中地图组","大数据组"]
adc_staff_list=[staff["empname"] for staff in staff_list if staff["orgdepartname"] in adc_group_list]
#print(staff_list)

for adc_staff in adc_staff_list:
  print(adc_staff)