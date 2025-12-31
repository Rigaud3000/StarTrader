#!/usr/bin/env python3
"""
ML Signal Prediction Script

Called by the trading engine to get ML confidence for a signal.

Usage:
    python ml/predict_signal.py <json_bars>

Returns JSON with confidence score.
"""

import sys
import json
import os
import numpy as np

def predict_signal(bars_json: str) -> dict:
    """
    Predict confidence for a trading signal based on recent bars.
    """
    try:
        bars = json.loads(bars_json)
        
        model_path = "storage/ml_lr_model.joblib"
        if not os.path.exists(model_path):
            return {
                "success": False,
                "confidence": 0.5,
                "error": "Model not trained yet"
            }
        
        import pandas as pd
        import joblib
        from ml.dataset_builder import build_features
        
        df = pd.DataFrame(bars)
        
        for col in ['open', 'high', 'low', 'close']:
            df[col] = pd.to_numeric(df[col], errors='coerce')
        
        if 'tick_volume' in df.columns:
            df['volume'] = pd.to_numeric(df['tick_volume'], errors='coerce')
        elif 'volume' in df.columns:
            df['volume'] = pd.to_numeric(df['volume'], errors='coerce')
        else:
            df['volume'] = 0
        
        if len(df) < 60:
            return {
                "success": True,
                "confidence": 0.5,
                "warning": f"Not enough bars for prediction ({len(df)} < 60)"
            }
        
        features = build_features(df)
        
        pipeline = joblib.load(model_path)
        model = pipeline['model']
        scaler = pipeline['scaler']
        feature_names = pipeline['feature_names']
        
        X = features[feature_names].iloc[-1:].values
        X_scaled = scaler.transform(X)
        
        if hasattr(model, 'predict_proba'):
            proba = model.predict_proba(X_scaled)
            confidence = float(proba[0][1])
        else:
            confidence = 0.5
        
        return {
            "success": True,
            "confidence": round(confidence, 4),
            "features_used": len(feature_names),
            "bars_analyzed": len(df)
        }
        
    except Exception as e:
        return {
            "success": False,
            "confidence": 0.5,
            "error": str(e)
        }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No bars data provided", "confidence": 0.5}))
        sys.exit(1)
    
    bars_json = sys.argv[1]
    result = predict_signal(bars_json)
    print(json.dumps(result))
