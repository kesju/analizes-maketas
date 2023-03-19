import pika
import os
import json
import requests


from zive_analysis import *

# Create a global channel variable to hold our channel object in
channel = None

# Step #2
def on_connected(connection):
    """Called when we are fully connected to RabbitMQ"""
    # Open a channel
    print('Opening channel')
    connection.channel(on_open_callback=on_channel_open)

# Step #3
def on_channel_open(new_channel):
    """Called when our channel has opened"""
    global channel
    channel = new_channel
    channel.basic_qos(prefetch_count=1)
    print('Declaring queue')
    channel.queue_declare(queue="ecg-analysis", durable=True, exclusive=False, auto_delete=False, callback=on_queue_declared)

# Step #4
def on_queue_declared(frame):
    """Called when RabbitMQ has told us our Queue has been declared, frame is the response from RabbitMQ"""
    print('Consuming queue')
    channel.basic_consume('ecg-analysis', handle_delivery)

# Step #5
def handle_delivery(channel, method, header, body):
    try:
        """Called when we receive a message from RabbitMQ"""
        print('Processing event')
        recordingData = json.loads(body)
        print('Loaded json');
        print(recordingData)
        recordingId = recordingData["recordingId"]
        recordingUrl = recordingData["recordingUrl"]
        channelCount = recordingData["channelCount"]
        print(recordingId)
        print(recordingUrl)
        request = requests.get(recordingUrl, allow_redirects=True)
        print('Recording file download request success')
        file = open('/tmp/ecg', 'wb')
        file.write(request.content)
        file.close()
        print('Recording written to temporary file')

        results = {
            'status': {
                'success': True
            },
            'recording_id': recordingId
        }

        analysis_success = True
        try:
            if channelCount == 3:
                analysis_results = hr_analysis(zive_read_file_3ch('/tmp/ecg'))
            elif channelCount == 1:
                analysis_results = hr_analysis(zive_read_file_1ch('/tmp/ecg'))
        except Exception as error:
            print('Analysis failed due to error:')
            print(error)
            results['status']['success'] = False
            results['status']['error'] = str(error)
            analysis_success = False

        if analysis_success:
            print('ECG Analysis success')
            results['rpeaks'] = analysis_results['rpeaks']
            import numpy as np
            results['ppeaks'] = np.array(analysis_results['wave_peaks']['ECG_P_Peaks']).astype("uint32").tolist()
            results['qpeaks'] = np.array(analysis_results['wave_peaks']['ECG_Q_Peaks']).astype("uint32").tolist()
            results['speaks'] = np.array(analysis_results['wave_peaks']['ECG_S_Peaks']).astype("uint32").tolist()
            results['tpeaks'] = np.array(analysis_results['wave_peaks']['ECG_T_Peaks']).astype("uint32").tolist()
            results['rate'] = np.array(analysis_results['heartrate']['rate']).astype("uint32").tolist()
            results['quality'] = np.array(analysis_results['quality']).astype("uint32").tolist()
            print('Results assigned')
        else:
            print('ECG Analysis failed')

        channel.queue_declare(queue="ecg-analysis-results", durable=True, exclusive=False, auto_delete=False)
        print("results queue declared")

        channel.basic_publish(exchange='', routing_key='ecg-analysis-results', body=json.dumps(results))
        os.remove("/tmp/ecg")
        print("Done processing event")
        channel.basic_ack(delivery_tag = method.delivery_tag)
    except Exception as error:
        print(error)


# Step #1: Connect to RabbitMQ using the default parameters
print('Going to connect to AMQP now')
parameters = pika.URLParameters(os.getenv('RABBITMQ_URL'))
connection = pika.SelectConnection(parameters, on_open_callback=on_connected)

try:
    # Loop so we can communicate with RabbitMQ
    connection.ioloop.start()
except KeyboardInterrupt:
    # Gracefully close the connection
    connection.close()
    # Loop until we're fully closed, will stop on its own
    connection.ioloop.start()