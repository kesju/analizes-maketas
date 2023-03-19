# kas reikalinga AFIB Zive EKG įrašuose aptikimui

import numpy as np
import pandas as pd
from math import floor

def create_RdR_map(RR_frag):
    # RR_frag - 1-dimensional numpy array
    # RdR_map - 2-dimensional numpy array
    len_RR = len(RR_frag)-1
    RdR_map = np.zeros(shape=(len_RR,2), dtype=int)
    for i in range(len_RR):
        RdR_map[i,0] = RR_frag[i]
        RdR_map[i,1] = RR_frag[i+1] - RR_frag[i]
    return RdR_map

def ann2RR(ann_arr, fs):
# Iš anotacijų locacijų sukūria RR seką
    return (np.diff(ann_arr) * 1000./fs).astype(int)

def get_pred_for_afib_from_RdR(RR_arr, segm_len, NEC_threshold, edge):
# Skriptas AFIB atpažinimui iš RR sekų panaudojant RdR map
# afib nustatinėjamas RR segmentuose, kurių skaičius yra 
# sveikas skaičius, t.y. segm_count = int(len(RR_arr)/segm_len)
# 
# Įėjimo paramentrai:
# - RR_arr - RR sekos masyvas (numpy array, int, ms)
# - segm_len - RR sekos analizuojamų segmentų (nepersiklojančių) ilgis
# - NEC_threshold - NEC slenkstis (int)
# - edge - celės briaunos ilgis (ms)
# 
# Atiduodamas numpy masyvas y_pred su elementais 0 arba 1:
# 1, jei segmento NEC viršija NEC_threshold, priešingu atveju - 0.

    signal_len = len(RR_arr)
    segm_count = int(signal_len/segm_len)
    if segm_count == 0:
        raise Exception(f"Attrial Fibrillation detection: Signal too short!") 
    
    # Automatiškai priskiriamos segmentų klasės

    y_pred = np.zeros(shape=segm_count, dtype='int')
    for segm_nr in range(segm_count):
        segm_start = segm_nr*segm_len
        segm_end = segm_start + segm_len

        segment = RR_arr[segm_start:segm_end]
        RdR_map = create_RdR_map(segment)

    # RdR map segmentuose analizė
        dict_lst = {}
        for i in range(len(RdR_map)):
            index_x = floor(RdR_map[i,0]/edge)
            index_y = floor(RdR_map[i,1]/edge)
            key = (index_x, index_y)
    # The math.floor() method rounds a number DOWN to the nearest integer 
            if key not in dict_lst.keys():
                dict_lst[key] = 1
        NEC = len(dict_lst)    # NEC - Non zero cells 
        if (NEC > NEC_threshold):
            y_pred[segm_nr] = 1
    return y_pred


def GetAtrialFibrillationEpisodes(r_indexes):
# Funkcija AFIB segmentų aptikimui
# Algoritmas: A Simple Method to Detect Atrial Fibrillation Using RR Intervals
# Jie Lian, PhD, Lian Wang, MS, Dirk Muessig, PhD
# https://www.ajconline.org/article/S0002-9149(11)00340-7/fulltext

# Paduodamas parametras:
# - atr_sample: R dantelių indeksai EKG masyve (iš json failo)
# Atiduodami parametrai:
# - [{start, end}, ...] kur start ir end yra semplų indeksai signale. 
# - [] jei segmentų nerasta,


# Fiksuoti algoritmo parametrai 
    segm_len = 64 # segmento ilgis analizei
    edge = 25 # RdR map grid rezoliucija (ms)
    NEC_threshold = 46 # NEC slenkstis

 # sukuriama RR seka
    RR_arr = ann2RR(r_indexes, 200)
 # afib segmentų paieška
    y_pred = get_pred_for_afib_from_RdR(RR_arr, segm_len, NEC_threshold, edge)

    episodes = []
    
    segm_count = 0

    for i in range(len(y_pred)):
        if (y_pred[i] == 1):
            episode = {}
            episode['start'] = r_indexes[i*segm_len]
            episode['end'] = r_indexes[(i+1)*segm_len]
            episodes.append(episode)
            segm_count +=1
    return episodes
