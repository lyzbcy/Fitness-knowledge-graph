import json

with open('graph_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

nodes = data['nodes']
print(f"Total nodes: {len(nodes)}")

# Search for Chest
term = "chest"
match = None
for n in nodes:
    # Mimic JS logic: n.category === 1 && n.name.toLowerCase().includes(term)
    if n.get('category') == 1 and term in n.get('name', '').lower():
        match = n
        break

if match:
    print("FOUND MATCH!")
    print(match)
else:
    print("NO MATCH FOUND.")
    # Print all category 1 nodes
    print("Available Category 1 Nodes:")
    for n in nodes:
        if n.get('category') == 1:
            print(f"- {n.get('name')}")
