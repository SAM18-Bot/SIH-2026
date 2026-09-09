import networkx as nx
import os

GRAPH_PATH = os.path.join(os.path.dirname(__file__), '..', 'gis-data', 'data', 'corridor_graph.graphml')
_G = None

def get_graph():
    global _G
    if _G is None:
        _G = nx.read_graphml(GRAPH_PATH)
        for n, data in _G.nodes(data=True):
            data['x'] = float(data['x'])
            data['y'] = float(data['y'])
        for u, v, k, data in _G.edges(keys=True, data=True):
            if 'length' in data:
                data['length'] = float(data['length'])
    return _G
