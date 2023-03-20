import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

import argparse
import numpy as np
import pandas as pd
import json
import neurokit2 as nk
from pathlib import Path # dedant į Zive - išmesti
# Taip pat yra užblokuota klasterizacija - Užblokuota laikinai


from quality_analysis import EstimateQuality
from heartrate_analysis import AnalyseHeartrate, DelineateQRS
from zive_cnn_fda_vu_v2_su_cluster import classify_clusterise_cnn_fda_vu_v1, zive_read_file_1ch, zive_read_file_3ch
from runs import EctopicRunsAnalysis

import warnings
warnings.filterwarnings("ignore")

parser = argparse.ArgumentParser()

parser.add_argument('fileName', metavar="FILE", type=str, help="Path to file containing ECG recording")
parser.add_argument('--channelCount', metavar='COUNT', type=int, choices=(1,3), required=True, help='Number of channels in the file')
parser.add_argument('--recordingId', metavar='REC_ID', type=str, required=True, help='Recording Id')
parser.add_argument('--rpeakSampleIndexes', metavar='R_PEAK_SAMPLE_INDEXES', type=json.loads, required=False, help='Sample indexes of R-peaks')
parser.add_argument('--rpeaksOnly', required=False, action="store_true", help='Only discover and return R-peaks in ECG file')
args = parser.parse_args()
print('args.fileName:', args.fileName)
print('args.channelCount:', args.channelCount)
print('args.recordingId:', args.recordingId)
print('args.rpeaksOnly:', args.rpeaksOnly)

results = {
  'status': {
      'success': True
  },
  'recording_id': args.recordingId
}

def EmptyAnalysisResults():
  analysis_results = {
  'heartrate':{
      'min':-1,
      'max':-1,
      'avg':-1,
      'beats':0,
      'rate':[]
      }
  }
  analysis_results['bradycardia']={
      'episodes' : []
  }
  analysis_results['pause'] = {
      'episodes' : []
  }
  analysis_results['afib'] = {
    'episodes' : []
  }
  return analysis_results

hr_analysis_success = True
try:  
  if args.channelCount == 3:
    ecg_signal_df = pd.DataFrame(zive_read_file_3ch(args.fileName), columns=['orig'])
  elif args.channelCount == 1:
    ecg_signal_df = pd.DataFrame(zive_read_file_1ch(args.fileName), columns=['orig'])

  if not args.rpeakSampleIndexes and not args.rpeaksOnly:
    quality = EstimateQuality(ecg_signal_df, method="variance")
    results['quality'] = quality
  else:
    results['quality'] = None

  try:
    if args.rpeakSampleIndexes:
      rpeaks = args.rpeakSampleIndexes
    else:
      _, rpeaks = nk.ecg_peaks(ecg_signal_df['orig'], sampling_rate=200, correct_artifacts=False)
      rpeaks = rpeaks['ECG_R_Peaks'].tolist()
    if not args.rpeaksOnly:
      analysis_results = AnalyseHeartrate(ecg_signal_df, rpeaks)
    else:
      analysis_results = EmptyAnalysisResults()

  except Exception as error:
    rpeaks = []
    analysis_results = EmptyAnalysisResults()
    raise error

  if not args.rpeakSampleIndexes:
    results['rpeaks'] = rpeaks
  else:
    results['rpeaks'] = None

  results['rate'] = analysis_results['heartrate']['rate']
  results['heartrate'] = analysis_results['heartrate']
  results['bradycardia'] = analysis_results['bradycardia']
  results['pause'] = analysis_results['pause']
  results['afib'] = analysis_results['afib']

  if not args.rpeakSampleIndexes and not args.rpeaksOnly:
    delineation = DelineateQRS(ecg_signal_df, rpeaks)

    results['qpeaks'] = delineation['ECG_Q_Peaks']
    results['ppeaks'] = delineation['ECG_P_Peaks']
    results['speaks'] = delineation['ECG_S_Peaks']
    results['tpeaks'] = delineation['ECG_T_Peaks']
  else:
    results['qpeaks'] = None
    results['ppeaks'] = None
    results['speaks'] = None
    results['tpeaks'] = None

  if rpeaks and not args.rpeaksOnly: 
    classification, clusterization = classify_clusterise_cnn_fda_vu_v1(zive_read_file_1ch(args.fileName), rpeaks=rpeaks, 
                                                  model_dir='model_cnn_fda_vu_v1', prediction_labels=['N', 'S', 'V', 'U'])
    results['automatic_classification'] = classification
    # results['automatic_clusterization'] = clusterization # Užblokuota laikinai
    results['ectopic_runs'] = EctopicRunsAnalysis(classification)

    # Čia reiktų įdėti klasifikacijos rezultatų skaičiavimą iš classification ir klusterizacijos skaičius iš clusterisation,
    # kad būtų galima sulyginti su 1_ziveo_clasterization_neurokit_v1.ipynb

except Exception as error:
  results['status']['success'] = False
  results['status']['error'] = str(error)
else:
  pass

# print(json.dumps(results)) # Šitą reikia dedant į Zive atstatyti

# Priedas rezultatu įrašymui analizės makete

# Create a Path object
p = Path(args.fileName)
rsl_string = str(p).replace("data", "results")
rsl_path = Path(rsl_string)
rsl_parent = rsl_path.parent

rsl_filename = rsl_path.name + '_rsl.json'
rsl_path = Path(rsl_parent, rsl_filename)
print(rsl_path)


with open(rsl_path, 'w') as f:
    # Write the dictionary to the file as a JSON object
    json.dump(results, f)