import numpy as np
from PIL import Image, ImageOps
from tensorflow.keras.models import load_model
from collections import Counter

def crop_segements(image, num_crops=4):
    """
    Simple approach: crop image into overlapping squares
    num_crops: how many random crops to take
    """
    img_array = np.array(image)
    h, w = img_array.shape[:2]
    
    # Crop size - aim for ~70% of smallest dimension  
    crop_size = int(min(h, w) * 0.7)
    
    segments = []
    
    for i in range(num_crops):
        # Random position for crop
        max_x = w - crop_size
        max_y = h - crop_size
        
        if max_x <= 0 or max_y <= 0:
            # Image too small, just use center crop
            start_x = max(0, (w - crop_size) // 2)
            start_y = max(0, (h - crop_size) // 2)
        else:
            start_x = np.random.randint(0, max_x)
            start_y = np.random.randint(0, max_y)
        
        # Extract crop
        crop = img_array[start_y:start_y+crop_size, start_x:start_x+crop_size]
        
        # Convert to PIL and resize
        crop_pil = Image.fromarray(crop)
        crop_resized = ImageOps.fit(crop_pil, (224, 224), Image.Resampling.LANCZOS)
        
        segments.append(crop_resized)
    
    return segments

def predict(image_path, model, labels, num_crops=4):
    """
    Simple voting: take multiple crops and use majority vote
    """
    # Load image
    image = Image.open(image_path).convert("RGB")
    
    # Get segments
    segments = crop_segements(image, num_crops)
    
    # Predict each segment
    predictions = []
    confidences = []
    
    for segment in segments:
        # Preprocess
        segment_array = np.asarray(segment).astype(np.float32) / 255.0
        segment_array = np.expand_dims(segment_array, axis=0)
        
        # Predict
        pred = model.predict(segment_array, verbose=0)
        class_idx = np.argmax(pred)
        confidence = pred[0][class_idx]
        label = labels[class_idx]
        
        predictions.append(label)
        confidences.append(confidence)
    
    # Simple majority vote
    vote_counts = Counter(predictions)
    winner = vote_counts.most_common(1)[0][0]
    
    # Average confidence of winning predictions
    winning_confidences = [conf for pred, conf in zip(predictions, confidences) if pred == winner]
    avg_confidence = np.mean(winning_confidences)
    
    return winner, avg_confidence, predictions, confidences

# Usage example
if __name__ == "__main__":
    labels = {
        0: "black_scorch", 
        1: "fusarium_wilt", 
        2: "healthy",
        3: "leaf_spots", 
        4: "magnesium_deficiency", 
        5: "manganese_deficiency", 
        6: "parlatoria_blanchardi", 
        7: "potassium_deficiency", 
        8: "rachis_blight",
        9: "unknown"
    }
    
    # Load your model
    model = load_model("palm_disease_model.keras")
    
    # Test
    prediction, confidence, all_preds, all_confs = predict(
        "test_image.jpg", 
        model, 
        labels, 
        num_crops=5
    )
    
    print(f"Final prediction: {prediction}")
    print(f"Average confidence: {confidence:.3f}")
    print(f"Individual predictions: {all_preds}")
    print(f"Individual confidences: {[f'{c:.3f}' for c in all_confs]}")