from pathlib import Path
import pandas as pd
import numpy as np
import json

with open('data.json') as json_file:
    data = json.load(json_file)
    print(data)