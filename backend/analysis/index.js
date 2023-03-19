const { AmqpLink, WorkConsumer, WorkProducer } = require('@zive-ecg/rabbitmq-framework');
const http = require('https');
const fs = require('fs');
const { spawnSync, spawn } = require('child_process');

const amqpLink = new AmqpLink({ url: process.env.RABBITMQ_URL });

const resultProducer = new WorkProducer({
  amqpLink,
  exchange: 'ecg-analysis-results'
});

const downloadFile = ({ url, filename }) => new Promise((resolve, reject) => {
  const file = fs.createWriteStream(filename);
  const request = http.get(url, (response) => {
    response.pipe(file);
  });
  request.on('error', reject);
  file.on('close', resolve);
  file.on('error', reject);
});

const spawnAsync = (...args) => new Promise((resolve, reject) => {
  const asyncProcess = spawn(...args);

  let result = '';

  asyncProcess.stdout.on('data', (data) => {
    result += data.toString('utf8');
  });

  asyncProcess.stderr.on('data', (data) => {
    console.log(data.toString('utf8'));
  });

  asyncProcess.on('exit', () => resolve(result));
  asyncProcess.on('error', (error) => reject(error));
});

const handleGenerationRequest = async ({
  recordingId,
  recordingUrl,
  channelCount,
  rpeakSampleIndexes
}) => {
  console.log(`Processing ${recordingId}`);
  let result;

  try {
    await downloadFile({ url: recordingUrl, filename: '/tmp/ecg' });
    console.log(`Downloaded ${recordingId}`);

    const pythonArgs = [
      'analyse.py',
      '/tmp/ecg',
      '--channelCount',
      channelCount,
      '--recordingId',
      recordingId
    ];

    if (!!rpeakSampleIndexes) {
      console.log('Recording is being reanalysed, sending --rpeakSampleIndexes argument to Python');
      pythonArgs.push('--rpeakSampleIndexes');
      pythonArgs.push(JSON.stringify(rpeakSampleIndexes));
    }

    const pythonOutput = await spawnAsync('python', pythonArgs);

    result = JSON.parse(pythonOutput);
  } catch (error) {
    result = {
      status: {
        success: false,
        error: `Invoking python or parsing output failed: ${error.toString()}`
      },
      recording_id: recordingId
    };
    console.log(`${recordingId} processing failed: ${error.toString()}`);
    console.log(error);
    await resultProducer.sendMessage(result);
    return; // We'll not retry analyzing this again
  } finally {
    spawnSync('rm', [ '-f', '/tmp/ecg' ])
  }

  console.log(`${recordingId} processing success`);

  await resultProducer.sendMessage(result);
};

new WorkConsumer({
  amqpLink,
  exchange: 'ecg-analysis-requests',
  queue: 'analysis',
  handler: handleGenerationRequest
});
