from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from pydantic import BaseModel
from pathlib import Path

import os
import sys
from pathlib import Path
import pandas as pd
from neurokit2 import signal_filter
import numpy as np

import json
from util_list import collect_list, get_list, zive_read_file_1ch, AnalyseHeartrate, read_json_file


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
    # Duomenu_aplankas = '/home/kesju/DI'   # arba variantas: UBUNTU, be Docker
    Duomenu_aplankas = '/home/kesju/DI'   # arba variantas: UBUNTU, be Docker

# jei variantas Docker pasirenkame:
# Duomenu_aplankas = '/Data/MIT&ZIVE'

pd.set_option("display.max_rows", 6000)
pd.set_option("display.max_columns", 16)
pd.set_option('display.width', 1000)

# Vietinės talpyklos aplankas
# db_folder = 'DUOM_2022_RUDUO_2'
db_folder = 'MAKETAS'

# Duomenų aplankas
rec_folder = 'data'

# Analizės rezultatų aplankas
rsl_folder = 'results'

# Įrašo filtravimui
fp = {  'type': 'lowcut',
        'method':'butterworth',
        'order':5,
        'lowcut':0.5,
        'highcut':20 }



print('\nSkriptas sudaro vietinės ZIVE talpyklos EKG sąrašą')
#  Failų vardai dabar rodo timestamp
# Atnaujintas variantas, po to, kaip padaryti pakeitimai failų varduose 2022 03 26
# Nuorodos į aplankus su EKG duomenų rinkiniu ir duomenų buferiu

db_path = Path(Duomenu_aplankas, db_folder, rec_folder) 
print( 'Duomenų aplankas:', db_path)

rsl_path = Path(Duomenu_aplankas, db_folder, rsl_folder) 
print( 'Duomenų aplankas:', rsl_path)

df_list = get_list(db_path)
if (not df_list.empty):
    df_list.reset_index(inplace=True, drop=True)
    print(f'\nRasta įrašų aplanke: {db_path}: {len(df_list)}')
    print(f'\nĮrašų sąrašas\n')
    print(df_list)

    # suformuojamas list of dict, tinkamas siuntimui klientui  
    ekg_list = df_list.to_dict('records')

    # for record in ekg_list:
    #     print(record)

    # Testinis failas su gatavu sąrašu
    # filepath = "list_tst_from_collect.json"
    # with open(filepath,'r', encoding='UTF-8', errors = 'ignore') as f:
    # 	data = json.loads(f.read())
    # ekg_list = data['data']

# Formuojami endpoints

origins = ["http://localhost:3000"]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# endpoint nr. 1: atiduoda visą EKG sąrašą su keys esančiais parametrais
keys = ["file_name","userId", "recordingId", "N", "S", "V", "U", "Tr", "incl", "flag", "comment"]                                                                                                                                                                              
items = []                                                                                                                                                                                            

for row in ekg_list: 
   result = dict((k, row[k]) for k in keys if k in row) 
   items.append(result)
# print(items)

# for row in items:
#     item = {"userId": row["userId"]}
#     print(item)
#     print(row)    

class Item(BaseModel):
    file_name: str
    userId: str
    recordingId: str
    N: int
    S: int
    V: int
    U: int
    Tr: int
    incl: int
    flag: int
    comment: str

@app.get("/", response_model=List[Item])
async def read_items():
    return items

# class ItemProps(BaseModel):
#     file_name: str
#     userId: str
#     recordingId: str
#     N: int
#     S: int
#     V: int
#     U: int
#     incl: int
#     flag: int
#     comment: str
#     recorded_at: str 


# endpoint nr. 2 paduoda uždavus failo vardą fname atiduoda iš sąrašo visus EKG parametrus
# @app.get("/ekgprm/{fname}", response_model=List[ItemProps])
@app.get("/ekgprm/")
async def return_props(fname: str = "1626931.201"):
 Props = [d for d in ekg_list if d['file_name']==fname]
 item = Props[0]
 print("app.get('/ekgprm/{fname}')")
#  print(item)
 return item


# endpoint nr. 3  uždavus failo vardą fname atiduoda iš sąrašo userId
userId: str

# @app.get("/ekg1/{fname}", response_model=ItemProps1)
@app.get("/ekgprm1/{fname}")
async def return_props1(fname: str = ""): 
 Props = [d for d in ekg_list if d['file_name']==fname]
 print("fname:", fname)
 item = {"userId": Props[0]["userId"]}
#  print(item)
 return(item)


# endpoint nr. 4  uždavus fname, at, length atiduoda originalaus EKG įrašo segmentą
# Nenaudojamas
class Value(BaseModel):
    value: float

# https://stackoverflow.com/questions/71102658/how-can-i-return-a-numpy-array-using-fastapi
# Paruo6iamasis darbas: nuskaitau Zive failą, paverčiu jį į json failą,
# įrašau jį į diską data.json ir bandau jį nuskaityti jau JS faile.


class ItemValue(BaseModel):
    idx: int
    value: float

# @app.get("/values/", response_model=List[ItemValue])
@app.get("/values/")
async def return_props3(fname: str = "1626931.201", at: int = 0, length: int = 10):
 fpath = Path(db_path, fname)   
 arr = zive_read_file_1ch(fpath)
 length_arr = len(arr)
 print("fname:", fname)
 until = at + length
 if until > length_arr:
    until = length_arr

#  values = arr[at:until].tolist()
 items = [{'idx':i,'value':arr[i]} for i in range(at,until)]

#  data_json = json.dumps(arr.tolist())
#  print(items)
 return(items)


# endpoint nr. 5 uždavus failo vardą fname atiduoda originalų EKG įrašą

# @app.get("/record/", response_model=List[ItemValue])
@app.get("/record/")
async def return_props3(fname: str = "1626931.201"):
 fpath = Path(db_path, fname)   
 arr = zive_read_file_1ch(fpath)
 length_arr = len(arr)
 print("fname:", fname)
 list = [{'idx':i,'value':arr[i]} for i in range(0, length_arr-1)]
 print("fpath:", fpath)
 print("length:", len(list))
 return(list)

# endpoint nr. 5.1 uždavus failo vardą fname atiduoda EKG įrašo json su gydytojo
# pūpsnių revizuotomis anotacijomis ir rankinėmis triukšmų  žymėmis  

# @app.get("/annotations/", response_model=List[ItemValue])
@app.get("/annotations/")
async def return_props3(fname: str = "1626931.201"):
 fname = fname + '.json';
 fpath = Path(db_path, fname)
 data = read_json_file(fpath)
 if "error" in data:
        return {"error": f"Could not read file '{fpath}'"}
 else:
    return data

# endpoint nr. 6 uždavus failo vardą fname atiduoda filtruotą EKG įrašą

# @app.get("/filtered/", response_model=List[ItemValue])
@app.get("/filtered/")
async def return_props3(fname: str = "1626931.201"):
 fpath = Path(db_path, fname)   
 arr = zive_read_file_1ch(fpath)
 length_arr = len(arr)

 print(f"\nIšlyginta izolinija su {fp['method']}")
 # Žemų dažnumų filtras
 flt_param = f"type: {fp['type']} method: {fp['method']} order: {fp['order']} lowcut: {fp['lowcut'] }"
 sign_filt = signal_filter(signal=arr, sampling_rate=200, lowcut=fp['lowcut'], method=fp['method'], order=fp['order'])

# Aukštų dažnumų filtras
# flt_param = f"method: {fp['method']} order: {fp['order']} highcut: {fp['highcut']}"
# sign_filt = signal_filter(signal=sign_raw, sampling_rate=200, highcut=fp['highcut'], method=fp['method'], order=fp['order'])

# Juostinis filtras
# flt_param = f"method: {fp['method']} order: {fp['order']} lowcut: {fp['lowcut']} highcut: {fp['highcut']}"
# sign_filt = signal_filter(signal=sign_raw, sampling_rate=200, lowcut= fp['lowcut'], highcut=fp['highcut'], method=fp['method'], order=fp['order'])

 print("fname:", fname)
 list = [{'idx':i,'value':sign_filt[i]} for i in range(0,length_arr-1)]
#  list = [{'idx':i,'value':sign_filt[i]} for i in range(0,100)]

#  print({'flt_param':flt_param}, {'values':list})
 return({'flt_param':fp, 'values':list})


# endpoint nr. 6 uždavus failo vardą fname atiduoda EKG rpeaks (rpeaks) su gydytojo anotacijomis (annot), 
# ML anotacijomis (ml), triukšmų žymėmis (noise) : json pavidalu

# Laikinai įdėsiu tik EKG rpeaks, naudosiu Neurokit

@app.get("/analysis/")
async def return_json(fname: str = "1626931.201"):
 rsl_name = fname + '_rsl.json'   
 fpath = Path(rsl_path, rsl_name)     
 data = read_json_file(fpath)
 if "error" in data:
        return {"error": f"Could not find file '{fpath}'"}
 else:
    return data

# async def return_props3(fname: str = "1633444.221"):
#  fpath = Path(db_path, fname)   
#  arr = zive_read_file_1ch(fpath)
# signal_raw = zive_read_file_1ch(fpath)

# Variantas su filtravimu
# # signal = signal_filter(signal=signal_raw, sampling_rate=200, lowcut=0.5, method="butterworth", order=5)
# signal = signal_raw    
# ecg_signal_df = pd.DataFrame(signal, columns=['orig'])

# analysis_results = AnalyseHeartrate(ecg_signal_df)
# rpeaks_from_signal = analysis_results['rpeaks']
# print(f"rpeaks iš signal: {len(rpeaks_from_signal)}")

# endpoint nr. 6.1 uždavus failo vardą fname atiduoda EKG rpeaks (rpeaks), gautus su Neurokit 
@app.get("/nk_rpeaks/")
async def return_props3(fname: str = "1642627.410"):
 fpath = Path(db_path, fname)   
 signal_raw = zive_read_file_1ch(fpath)

# Variantas su filtravimu - užblokuotas
# signal = signal_filter(signal=signal_raw, sampling_rate=200, lowcut=0.5, method="butterworth", order=5)
 signal = signal_raw    
 ecg_signal_df = pd.DataFrame(signal, columns=['orig'])

 analysis_results = AnalyseHeartrate(ecg_signal_df)
 nk_rpeaks = analysis_results['rpeaks']
 print(f"rpeaks iš signal: {len(nk_rpeaks)}")
#  print(nk_rpeaks[:20])
 return(nk_rpeaks)




