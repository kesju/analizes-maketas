#!/usr/bin/python

'''
Performs heart rate analysis.

Arguments:
  * sample_rate
	
	* hr_avg_interval - time interval over which to calculate heart rate
  
  * bradycardia_min_rate - heart_rate < bradycardia_min_rate is considered to be bradycardia
  * bradycardia_min_duration - duration > bradycardia_min_duration is considered to be bradycardia
	
	* pause_min_duration - RR interval > pause_min_duration is considered to be pause

Returns JSON:
  heartrate:{
		min,
    max,
    average,
    total beats
  },
  bradycardia:{
		episodes:[
			{
				heart_rate,
				duration_s
			}
		]
  },
  pause: {
		episodes:[
			{
				onset_sampleno,
				length
			}
		]
  }


'''


from flask import Flask, render_template, request, redirect, url_for, abort, send_from_directory
from werkzeug.utils import secure_filename
from waitress import serve
import os

import json

from zive_analysis import *

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024
app.config['UPLOAD_EXTENSIONS'] = ['.DAT']
app.config['UPLOAD_PATH'] = 'uploads'

@app.route("/")
def index():
  return render_template("./upload_form.html")

@app.route("/heart_rate", methods=["POST"])
def heart_rate():
  sampling_rate = int(request.form.get('sampling_rate'))
  avg_time_s = int(request.form.get('avg_time_s'))
  bradycardia_min_rate = int(request.form.get('bradycardia_min_rate'))
  bradycardia_min_duration = int(request.form.get('bradycardia_min_duration'))
  pause_min_duration_s = float(request.form.get('pause_min_duration_s'))

  uploaded_file = request.files['file']
  filename = secure_filename(uploaded_file.filename)
  if filename != '':
      file_ext = os.path.splitext(filename)[1]
      if file_ext not in app.config['UPLOAD_EXTENSIONS']:
          abort(400)
      local_filename = os.path.join(app.config['UPLOAD_PATH'], filename)
      uploaded_file.save(local_filename)
  results = hr_analysis(zive_read_file_1ch(local_filename), 
                        sampling_rate = sampling_rate, 
                        avg_time_s = avg_time_s,
                        bradycardia_min_rate = bradycardia_min_rate,
                        bradycardia_min_duration = bradycardia_min_duration,
                        pause_min_duration_s = pause_min_duration_s)
  return results

if __name__ == '__main__':
    # app.run(debug=True)
    serve(app, host="0.0.0.0", port=8000)