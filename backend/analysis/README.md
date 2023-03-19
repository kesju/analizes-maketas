# analysis
conda activate ecg_lnx38 

python analyse.py test/1625400.796 --channelCount 1 --recordingId 1 > results.json
python analyse_new.py test/1625400.796 --channelCount 1 --recordingId 1 > results.json
python analyse.py ../zive_test_data/1625400.796  --channelCount 1 --recordingId 1 > results.json
python analyse.py ../data/1626931.201  --channelCount 1 --recordingId 1 > 1626931.201_rsl.json
python analyse.py test/1642627.410 --channelCount 1 --recordingId 1

