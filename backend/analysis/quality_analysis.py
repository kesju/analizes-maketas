import pandas as pd
import numpy as np

def ZhaoToNumeric(df):
    df['quality'] = 0
    mask_excellent = df['q'] == 'Excellent'
    mask_unacceptable = df['q'] == 'Unacceptable'
    mask_barely = df['q'] == 'Barely Acceptable'
    df.loc[mask_excellent, 'quality'] = 1
    df.loc[mask_barely, 'quality'] = 0.5
    df.loc[mask_unacceptable, 'quality'] = 0
    return df

def ZhaoWindowed(df, signal, window, sampling_rate):
    df['q'] = 0
    for i in range(0, len(df), window):
        # df['q'][i:i+window] = nk.ecg_quality(df[signal][i:i+window], rpeaks=None, sampling_rate=sampling_rate, method="zhao2018", approach="fuzzy")
        try:
          quality = nk.ecg_quality(df[signal][i:i+window], rpeaks=None, sampling_rate=sampling_rate, method="zhao2018", approach="fuzzy")
        except Exception as e:
          quality = 'Unacceptable'
        
        df.loc[i:i+window, 'q'] = quality
    return ZhaoToNumeric(df)

def Consolidate(dt, minwidth, column):
    for t, tt in dt.groupby((dt[column].shift() != dt[column]).cumsum()):
        # print(len(tt))
        if len(tt) < minwidth:
            if tt[column].sum() == 0:
                dt[column][tt.index] = 1
            else:
                dt[column][tt.index] = 0
    return dt

def AddRollingVariance(df, from_col, to_col, sampling_rate = 200, window_s = 30):
    """ Calculates rolling variance of the signal

    variance value is estimated for every signal sample that is in the centre of the window
    """
    df[to_col] = df[from_col].rolling(sampling_rate * window_s).var()
    df[to_col] = df[to_col].shift(-int(sampling_rate * window_s / 2))
    return df

def GetVarianceLimits(df, window_s):
    """Estimate variance limits of the signal

    :returns var_min, var_max

    We assume that normal ECG signal is well within +-2mV, thus we clip the original signal at this threshold.
    Rolling variance is applied to this clipped signal. Interquartile range q1 - q3 is used as normal limits of variance in the signal

    """
    df['orig_clipped'] = df['orig']
    mask_gt = df['orig'] > 2
    mask_lt = df['orig'] < -2
    df.loc[mask_gt, 'orig_clipped'] = np.nan
    df.loc[mask_lt, 'orig_clipped'] = np.nan
    
    df = AddRollingVariance(df, 'orig_clipped', 'var', window_s)

    q1 = df['var'].quantile(0.25)
    q3 = df['var'].quantile(0.75)
    iqr = q3 - q1
    var_min = q1 - iqr*1.5
    var_max = q3 + iqr*1.5
    
    df.drop('orig_clipped', inplace=True, axis=1)
    df.drop('var', inplace=True, axis=1)
    return var_min, var_max

def RollingVariance(df, sampling_rate, window_s):
    """ Estimates quality by the use of rolling variance

    returns a value for every sample in the signal:
     * 0 - clean signal
     * 1 - noise

    variance outliers are identified and thresholds are estimated
    rolling variance with the windos_s is applied to the signal 
    samples that have variance exceeding thresholds are marked as '1'
    resulting quality estimates are low-pass filtered to 'lump' together several noisy episodes that are close in time.
    """
    var_min, var_max = GetVarianceLimits(df, window_s)
    AddRollingVariance(df, 'orig', 'var', window_s)
    df['quality'] = np.zeros(len(df))
    mask_gt = df['var'] > var_max
    mask_lt = df['var'] < var_min
    df.loc[mask_gt, 'quality'] = 1
    df.loc[mask_lt, 'quality'] = 1

    window = np.hanning(window_s * sampling_rate)
    window = window / window.sum()

    # low pass filter the quality estimate to adjoin nearby bad quality episodes in the signal 
    df['quality_filtered']= np.convolve(window, df['quality'], mode='same')

    df.loc[df['quality_filtered'] > 0, 'quality'] = 1
    
    return df['quality']


def EstimateQuality(ecg_signal_df, sampling_rate = 200, method="variance"):
    """ Estimates quality of the signal

    returns a value for every sample in the signal:
     * 0 - clean signal
     * 1 - noise

    method 'variance' uses rolling varinace
    method 'zhao' uses neurokit quality estimate 
    """
    if method == "zhao":
        try:
            dd = ZhaoWindowed(ecg_signal_df, signal= 'orig', window = sampling_rate * 21, sampling_rate = 200 )
            # dd = Consolidate(dd, sampling_rate * 10, 'quality')
        except:
            dd['quality'] = np.array([])

        return dd['quality'].astype("uint32").tolist()
    elif method == "variance":
        average_window_s = 30
        if len(ecg_signal_df) / 200 > average_window_s: 
            return RollingVariance(ecg_signal_df, sampling_rate = 200, window_s=30).astype("uint32").tolist()
        else:
            return np.ones(len(ecg_signal_df)).tolist()