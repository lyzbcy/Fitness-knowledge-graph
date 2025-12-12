import json
try:
    with open('graph_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        print(f"Nodes: {len(data['nodes'])}")
        print(f"Links: {len(data['links'])}")
except Exception as e:
    print(f"Error: {e}")
