import requests
import json

url = "http://localhost:3000/bfhl"

tests = [
    ["A->B","A->B","A->B","A->B"],
    ["A->D","B->D","C->D"],
    ["A->B","B->C","C->A","D->E"],
    ["A->B","B->C","C->A","C->D"],
    ["A->B","A->C","B->D","C->E","E->F"],
    ["B->C","A->C"],
    ["A->B","hello","X->Y","Y->X"],
    [],
    ["   "]
]

for i, test_data in enumerate(tests, 1):
    print(f"\n--- Test Case {i}: {test_data} ---")
    try:
        response = requests.post(url, json={"data": test_data})
        if response.status_code == 200:
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Failed to connect: {e}")
