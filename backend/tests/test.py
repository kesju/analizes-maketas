from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from pydantic import BaseModel
from pathlib import Path

import sys
from pathlib import Path
import pandas as pd
import json
from util_list import collect_list

my_os=sys.platform
print("OS in my system : ",my_os)

if my_os != 'linux':
    OS = 'Windows'
else:  
    OS = 'Ubuntu'

import warnings
# warnings.filterwarnings("ignore")

# Pasiruošimas

# //////////////// NURODOMI PARAMETRAI /////////////////////////////////////////////////////

# Bendras duomenų aplankas

if OS == 'Windows':
    Duomenu_aplankas = 'D:\\DI'   # variantas: Windows
else:
    Duomenu_aplankas = '/home/kesju/DI'   # arba variantas: UBUNTU, be Docker

# jei variantas Docker pasirenkame:
# Duomenu_aplankas = '/Data/MIT&ZIVE'

pd.set_option("display.max_rows", 6000)
pd.set_option("display.max_columns", 16)
pd.set_option('display.width', 1000)

# Vietinės talpyklos aplankas
db_folder = 'DUOM_2022_RUDUO_2'

# Duomenų aplankas
rec_folder = 'records_selected_tst'

print('\nSkriptas sudaro vietinės ZIVE talpyklos EKG sąrašą')
#  Failų vardai dabar rodo timestamp
# Atnaujintas variantas, po to, kaip padaryti pakeitimai failų varduose 2022 03 26
# Nuorodos į aplankus su EKG duomenų rinkiniu ir duomenų buferiu

db_path = Path(Duomenu_aplankas, db_folder, rec_folder) 
print( 'Duomenų aplankas:', db_path)

df_list = collect_list(db_path)
if (not df_list.empty):
    df_list.reset_index(inplace=True, drop=True)
    print(f'\nRasta įrašų aplanke: {db_path}: {len(df_list)}')
    print(f'\nĮrašų sąrašas\n')
    print(df_list)


result = df_list.to_dict('records')
# Display result
print("Converted Dictionary:\n",result)

for record in result:
    print(record)