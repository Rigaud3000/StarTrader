import os
import numpy as np

try:
    import joblib
    JOBLIB_AVAILABLE = True
except ImportError:
    JOBLIB_AVAILABLE = False

class LRPredictor:
    """
    Logistic Regression predictor for trade confidence scoring.
    """
    
    def __init__(self, model_path: str = "storage/ml_lr_model.joblib"):
        self.model_path = model_path
        self.model = None
        self.is_loaded = False
    
    def load(self) -> bool:
        """Load the trained model from disk."""
        if not JOBLIB_AVAILABLE:
            print("Warning: joblib not installed. ML predictions disabled.")
            return False
            
        if not os.path.exists(self.model_path):
            print(f"Warning: Model file not found at {self.model_path}")
            return False
        
        try:
            self.model = joblib.load(self.model_path)
            self.is_loaded = True
            print(f"ML model loaded from {self.model_path}")
            return True
        except Exception as e:
            print(f"Error loading model: {e}")
            return False
    
    def predict_confidence(self, features: np.ndarray) -> float:
        """
        Predict confidence score for a trade.
        Returns probability of profitable trade (0.0 to 1.0).
        """
        if not self.is_loaded or self.model is None:
            return 0.5
        
        try:
            features = np.array(features).reshape(1, -1)
            
            if hasattr(self.model, 'predict_proba'):
                proba = self.model.predict_proba(features)
                confidence = proba[0][1]
            else:
                prediction = self.model.predict(features)
                confidence = float(prediction[0])
            
            return float(np.clip(confidence, 0.0, 1.0))
        except Exception as e:
            print(f"Prediction error: {e}")
            return 0.5
    
    def predict_direction(self, features: np.ndarray) -> str:
        """
        Predict trade direction based on confidence.
        """
        confidence = self.predict_confidence(features)
        
        if confidence > 0.6:
            return "bullish"
        elif confidence < 0.4:
            return "bearish"
        else:
            return "neutral"
