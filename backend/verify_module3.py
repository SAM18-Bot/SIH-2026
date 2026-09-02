import time
import subprocess
import requests
import asyncio
import websockets
import json
import sys

async def connect_and_verify():
    uri = "ws://localhost:8000/ws"
    try:
        async with websockets.connect(uri) as websocket:
            print("[+] WS Connected. Fetching initial route...")
            r = requests.get("http://localhost:8000/route").json()
            if r['status'] == "wait":
                print("[-] Initial route is WAIT. Cannot verify dynamic reroute.")
                return
                
            pred_route = r['predictive_route']
            print(f"[+] Initial predictive route established. Nodes: {len(pred_route)}, Max Risk: {r['predictive_max_risk']:.3f}")
            
            # Pick a node in the middle of the route to spike
            mid_idx = len(pred_route) // 2
            u, v = pred_route[mid_idx], pred_route[mid_idx+1]
            
            print(f"\n[*] Injecting localized rainfall spike at edge {u}-{v}...")
            requests.post("http://localhost:8000/test_spike", json={"u": u, "v": v})
            
            print("[*] Waiting for background monitoring loop to detect and reroute (up to 10s)...")
            msg = await asyncio.wait_for(websocket.recv(), timeout=10.0)
            data = json.loads(msg)
            
            print(f"\n[+] Event received from WebSocket: {data['event']}")
            print(f"    Reason: {data['reason']}")
            print(f"    Status: {data['status']}")
            if data['new_route'] != pred_route:
                print("\n[SUCCESS] Route was successfully updated dynamically via the background loop!")
            else:
                print("\n[FAILED] Route did not change.")
    except asyncio.TimeoutError:
        print("\n[FAILED] No WebSocket message received within 10 seconds.")
    except Exception as e:
        print(f"\n[!] Verification error: {e}")

if __name__ == "__main__":
    print("Starting FastAPI server in background...")
    # Use python -m uvicorn instead of uvicorn to ensure it uses the venv
    server_process = subprocess.Popen([sys.executable, "-m", "uvicorn", "main:app", "--port", "8000"])
    
    try:
        time.sleep(4) # Allow time for server and graph to load
        asyncio.run(connect_and_verify())
    finally:
        print("Cleaning up server...")
        server_process.terminate()
        server_process.wait()
