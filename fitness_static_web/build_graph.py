import json
import os

def build_graph():
    input_file = 'exercises.json'
    output_file = 'graph_data.json'

    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found.")
        return

    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    nodes = {}
    links = []
    
    # Helper to add node if not exists
    def add_node(id_val, name, category, value=10):
        if id_val not in nodes:
            nodes[id_val] = {
                "id": id_val,
                "name": name,
                "category": category,
                "symbolSize": value,
                "value": value
            }
        else:
            # Increase weight if referred multiple times
            nodes[id_val]["symbolSize"] += 2
            nodes[id_val]["value"] += 2

    # Categories for legend
    categories = [
        {"name": "Exercise"},
        {"name": "Muscle"},
        {"name": "Equipment"},
        {"name": "Level"},
        {"name": "Category"}
    ]

    print(f"Processing {len(data)} exercises...")

    for ex in data:
        ex_name = ex.get('name')
        if not ex_name:
            continue
            
        ex_id = f"ex_{ex_name}"
        
        # 1. Add Exercise Node
        # Base size 20 for exercises
        if ex_id not in nodes:
            nodes[ex_id] = {
                "id": ex_id,
                "name": ex_name,
                "category": 0, # Exercise
                "symbolSize": 20,
                "value": 20,
                # Store extra info for tooltip
                "instructions": ex.get('instructions', []),
                "images": ex.get('images', [])
            }

        # 2. Process Muscles (Primary) -> Category 1
        for muscle in ex.get('primaryMuscles', []):
            m_id = f"mus_{muscle}"
            add_node(m_id, muscle, 1, 30) # Muscles are important hubs
            links.append({"source": ex_id, "target": m_id, "name": "targets"})

        # 3. Process Muscles (Secondary) -> Category 1
        for muscle in ex.get('secondaryMuscles', []):
            m_id = f"mus_{muscle}"
            add_node(m_id, muscle, 1, 20)
            links.append({"source": ex_id, "target": m_id, "name": "uses"})

        # 4. Process Equipment -> Category 2
        eq = ex.get('equipment')
        if eq:
            eq_id = f"eq_{eq}"
            add_node(eq_id, eq, 2, 25)
            links.append({"source": ex_id, "target": eq_id, "name": "requires"})

        # 5. Process Level -> Category 3
        lvl = ex.get('level')
        if lvl:
            lvl_id = f"lvl_{lvl}"
            add_node(lvl_id, lvl, 3, 40) # Levels are big clusters
            links.append({"source": ex_id, "target": lvl_id, "name": "difficulty"})

        # 6. Process Category (Force/Type) -> Category 4
        cat = ex.get('category')
        if cat:
            cat_id = f"cat_{cat}"
            add_node(cat_id, cat, 4, 30)
            links.append({"source": ex_id, "target": cat_id, "name": "is_a"})

    # Convert nodes dict to list
    final_nodes = list(nodes.values())
    
    # Construct final JSON
    graph_data = {
        "nodes": final_nodes,
        "links": links,
        "categories": categories
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(graph_data, f, ensure_ascii=False, indent=2)

    print(f"Graph built! {len(final_nodes)} nodes, {len(links)} links.")
    print(f"Saved to {output_file}")

if __name__ == "__main__":
    build_graph()
