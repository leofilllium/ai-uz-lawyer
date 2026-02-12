"""
Script to check disk usage of ChromaDB inside the container.
"""
import os
import subprocess

def get_size(start_path = 'data/chroma_db'):
    total_size = 0
    for dirpath, dirnames, filenames in os.walk(start_path):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            # skip if it is symbolic link
            if not os.path.islink(fp):
                total_size += os.path.getsize(fp)

    return total_size

try:
    size = get_size('/app/data/chroma_db')
    print(f"ChromaDB Size: {size / (1024*1024):.2f} MB")
    
    # Also check memory info
    with open('/proc/meminfo', 'r') as f:
        print("Memory Info:")
        for line in f:
            if 'MemTotal' in line or 'MemAvailable' in line:
                print(line.strip())
                
except Exception as e:
    print(f"Error: {e}")
