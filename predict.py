import numpy as np
from tensorflow.keras.models import load_model
from PIL import Image, ImageOps
from os import listdir

model = load_model([i for i in listdir(".") if i.endswith(".keras")][0]) # funny line hehe

labels = {
    0:"black_scorch", 
    1:"fusarium_wilt", 
    2:"healthy",
    3:"leaf_spots", 
    4:"magnesium_deficiency", 
    5:"manganese_deficiency", 
    6:"parlatoria_blanchardi", 
    7:"potassium_deficiency", 
    8:"rachis_blight",
    9:"unknown"
}

def preprocess_image(image):
    image = Image.open(image).convert("RGB")
    image = ImageOps.fit(image, (224, 224), Image.Resampling.LANCZOS)
    image_array = np.asarray(image).astype(np.float32) / 255.0  # Normalize
    image_array = np.expand_dims(image_array, axis=0)  # Shape: (1, 224, 224, 3)
    return image_array

def predict(image_data):
    predictions = model.predict(image_data)
    predicted_class_index = np.argmax(predictions)

    confidence = predictions[0][predicted_class_index]
    labeled_prediction = labels[predicted_class_index]
    
    print(f"prediction: {labeled_prediction}  confidence: {confidence:.2f}")
    return confidence, labeled_prediction

def get_all_predictions(image_data):
    """Get all predictions sorted by confidence"""
    predictions = model.predict(image_data)
    
    # Create list of all predictions with their labels and confidence scores
    all_predictions = []
    for class_index, confidence in enumerate(predictions[0]):
        disease_name = labels[class_index]
        all_predictions.append({
            'disease': disease_name,
            'confidence': float(confidence),
            'class_index': class_index
        })
    
    # Sort by confidence in descending order
    all_predictions.sort(key=lambda x: x['confidence'], reverse=True)
    
    return all_predictions

def get_prediction_summary(image_data, threshold=0.1):
    """Get a summary of predictions above a certain threshold"""
    all_preds = get_all_predictions(image_data)
    
    # Filter predictions above threshold
    significant_predictions = [
        pred for pred in all_preds 
        if pred['confidence'] >= threshold
    ]
    
    # Get top prediction
    top_prediction = all_preds[0]
    
    return {
        'top_prediction': {
            'disease': top_prediction['disease'],
            'confidence': top_prediction['confidence']
        },
        'all_predictions': all_preds,
        'significant_predictions': significant_predictions,
        'prediction_count': len(significant_predictions)
    }