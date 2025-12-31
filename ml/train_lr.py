import pandas as pd
import numpy as np
import os

try:
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import StandardScaler
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
    import joblib
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

from ml.dataset_builder import build_features, build_labels


def train_lr_model(
    df: pd.DataFrame,
    horizon: int = 10,
    threshold: float = 0.001,
    model_path: str = "storage/ml_lr_model.joblib",
    test_size: float = 0.2
) -> dict:
    """
    Train a Logistic Regression model for trade prediction.
    
    Args:
        df: DataFrame with OHLCV data
        horizon: Number of bars to look ahead for labels
        threshold: Minimum return to consider as profitable
        model_path: Where to save the trained model
        test_size: Fraction of data for testing
    
    Returns:
        dict with training metrics
    """
    if not SKLEARN_AVAILABLE:
        return {
            "success": False,
            "error": "scikit-learn not installed. Run: pip install scikit-learn joblib"
        }
    
    print(f"Building features from {len(df)} bars...")
    X = build_features(df)
    y = build_labels(df, horizon=horizon, threshold=threshold)
    
    valid_idx = ~(X.isna().any(axis=1) | y.isna())
    valid_idx = valid_idx & (valid_idx.index < len(df) - horizon)
    
    X = X[valid_idx]
    y = y[valid_idx]
    
    print(f"Training samples: {len(X)}")
    print(f"Class distribution: {y.value_counts().to_dict()}")
    
    if len(X) < 100:
        return {
            "success": False,
            "error": f"Not enough training data: {len(X)} samples (need at least 100)"
        }
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42, shuffle=False
    )
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    print("Training Logistic Regression model...")
    model = LogisticRegression(
        C=1.0,
        max_iter=1000,
        random_state=42,
        class_weight='balanced'
    )
    model.fit(X_train_scaled, y_train)
    
    y_pred = model.predict(X_test_scaled)
    y_proba = model.predict_proba(X_test_scaled)[:, 1]
    
    metrics = {
        "accuracy": accuracy_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred, zero_division=0),
        "recall": recall_score(y_test, y_pred, zero_division=0),
        "f1_score": f1_score(y_test, y_pred, zero_division=0),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "feature_count": X.shape[1],
    }
    
    print(f"\nModel Performance:")
    print(f"  Accuracy:  {metrics['accuracy']:.4f}")
    print(f"  Precision: {metrics['precision']:.4f}")
    print(f"  Recall:    {metrics['recall']:.4f}")
    print(f"  F1 Score:  {metrics['f1_score']:.4f}")
    
    os.makedirs(os.path.dirname(model_path) if os.path.dirname(model_path) else ".", exist_ok=True)
    
    pipeline = {
        'model': model,
        'scaler': scaler,
        'feature_names': list(X.columns)
    }
    joblib.dump(pipeline, model_path)
    print(f"\nModel saved to: {model_path}")
    
    return {
        "success": True,
        "model_path": model_path,
        "metrics": metrics
    }


if __name__ == "__main__":
    bars_path = "storage/backtests/latest_bars.csv"
    
    if os.path.exists(bars_path):
        df = pd.read_csv(bars_path)
        result = train_lr_model(df)
        print(result)
    else:
        print(f"No training data found at {bars_path}")
        print("Run a backtest first to generate training data.")
