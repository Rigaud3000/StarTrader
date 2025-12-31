#!/usr/bin/env python3
"""
ML Model Training Script

Run this after a backtest to train the ML confidence filter model.

Usage:
    python train_model.py

This will:
1. Load bars from storage/backtests/latest_bars.csv
2. Build features and labels
3. Train a Logistic Regression model
4. Save to storage/ml_lr_model.joblib
"""

import os
import pandas as pd

def main():
    bars_path = "storage/backtests/latest_bars.csv"
    
    if not os.path.exists(bars_path):
        print(f"Error: No training data found at {bars_path}")
        print("")
        print("To generate training data:")
        print("1. Go to the Backtesting page in the dashboard")
        print("2. Run a backtest with any strategy")
        print("3. The bars will be saved automatically")
        print("4. Then run this script again")
        return
    
    print(f"Loading bars from {bars_path}...")
    df = pd.read_csv(bars_path)
    print(f"Loaded {len(df)} bars")
    
    from ml.train_lr import train_lr_model
    
    result = train_lr_model(
        df,
        horizon=10,
        threshold=0.001,
        model_path="storage/ml_lr_model.joblib"
    )
    
    if result["success"]:
        print("\n" + "="*50)
        print("ML MODEL TRAINING COMPLETE")
        print("="*50)
        print(f"Model saved to: {result['model_path']}")
        print(f"Accuracy: {result['metrics']['accuracy']:.2%}")
        print(f"F1 Score: {result['metrics']['f1_score']:.2%}")
        print("\nThe confidence filter is now ready to use!")
    else:
        print(f"\nTraining failed: {result.get('error', 'Unknown error')}")


if __name__ == "__main__":
    main()
