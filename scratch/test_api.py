import urllib.request
import json
import urllib.error

url = 'https://script.google.com/macros/s/AKfycbzHOhY1PhbOa3V-avg3l3mGUFuBHLQcOwH_uippgP8yBHk6X3BT_WFk9nxzGynX1YFr/exec'
payload = {
    'action': 'get_data',
    'tables': ['user']
}

data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(
    url, 
    data=data,
    headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'}
)

print("Sending request to:", url)
try:
    with urllib.request.urlopen(req) as response:
        print("Status Code:", response.getcode())
        print("Redirected to:", response.geturl())
        response_data = response.read().decode('utf-8')
        print("Response Content:")
        print(response_data)
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print(e.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
