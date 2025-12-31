import pandas as pd
import numpy as np

def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Build ML features from OHLCV data.
    Expects columns: open, high, low, close, volume (or tick_volume)
    """
    features = pd.DataFrame(index=df.index)
    
    close = df['close'].astype(float)
    high = df['high'].astype(float)
    low = df['low'].astype(float)
    open_price = df['open'].astype(float)
    
    volume = df.get('volume', df.get('tick_volume', pd.Series(0, index=df.index))).astype(float)
    
    features['returns_1'] = close.pct_change(1)
    features['returns_5'] = close.pct_change(5)
    features['returns_10'] = close.pct_change(10)
    
    features['sma_10'] = close.rolling(10).mean()
    features['sma_20'] = close.rolling(20).mean()
    features['sma_50'] = close.rolling(50).mean()
    
    features['sma_ratio_10_20'] = features['sma_10'] / features['sma_20']
    features['sma_ratio_10_50'] = features['sma_10'] / features['sma_50']
    features['price_to_sma_10'] = close / features['sma_10']
    features['price_to_sma_20'] = close / features['sma_20']
    
    features['std_10'] = close.rolling(10).std()
    features['std_20'] = close.rolling(20).std()
    
    features['bb_upper'] = features['sma_20'] + 2 * features['std_20']
    features['bb_lower'] = features['sma_20'] - 2 * features['std_20']
    features['bb_position'] = (close - features['bb_lower']) / (features['bb_upper'] - features['bb_lower'])
    
    delta = close.diff()
    gain = delta.where(delta > 0, 0).rolling(14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
    rs = gain / loss.replace(0, np.nan)
    features['rsi_14'] = 100 - (100 / (1 + rs))
    
    ema_12 = close.ewm(span=12, adjust=False).mean()
    ema_26 = close.ewm(span=26, adjust=False).mean()
    features['macd'] = ema_12 - ema_26
    features['macd_signal'] = features['macd'].ewm(span=9, adjust=False).mean()
    features['macd_hist'] = features['macd'] - features['macd_signal']
    
    features['atr_14'] = pd.concat([
        high - low,
        (high - close.shift(1)).abs(),
        (low - close.shift(1)).abs()
    ], axis=1).max(axis=1).rolling(14).mean()
    
    features['high_low_range'] = (high - low) / close
    features['body_size'] = (close - open_price).abs() / close
    features['upper_shadow'] = (high - pd.concat([close, open_price], axis=1).max(axis=1)) / close
    features['lower_shadow'] = (pd.concat([close, open_price], axis=1).min(axis=1) - low) / close
    
    if volume.sum() > 0:
        features['volume_sma_10'] = volume.rolling(10).mean()
        features['volume_ratio'] = volume / features['volume_sma_10'].replace(0, np.nan)
    else:
        features['volume_sma_10'] = 0
        features['volume_ratio'] = 1
    
    features['momentum_10'] = close - close.shift(10)
    features['momentum_20'] = close - close.shift(20)
    
    features = features.replace([np.inf, -np.inf], np.nan)
    features = features.fillna(0)
    
    return features


def build_labels(df: pd.DataFrame, horizon: int = 10, threshold: float = 0.001) -> pd.Series:
    """
    Build labels for classification:
    1 = price goes up by threshold within horizon
    0 = price goes down or stays flat
    """
    close = df['close'].astype(float)
    future_return = close.shift(-horizon) / close - 1
    labels = (future_return > threshold).astype(int)
    return labels
