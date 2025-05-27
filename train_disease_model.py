from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from sklearn.utils.class_weight import compute_class_weight
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.models import Model
import numpy as np


# Image settings
IMG_SIZE = 224
BATCH_SIZE = 32


train_datagen = ImageDataGenerator(rescale=1./255)
val_datagen = ImageDataGenerator(rescale=1./255)

train_generator = train_datagen.flow_from_directory(
    'dataset/train',
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=True
)

val_generator = val_datagen.flow_from_directory(
    'dataset/val',
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=False
)

# create callbacks
callbacks = [
    EarlyStopping(
        monitor="val_loss", 
        patience=5, 
        restore_best_weights=True
    ),
    ModelCheckpoint(
        "best_model.keras", 
        monitor="val_accuracy", 
        save_best_only=True, verbose=1
    ),
    ReduceLROnPlateau(
        monitor="val_loss", 
        factor=0.5, patience=3, 
        verbose=1
    )
]

# Create class weights
labels = train_generator.classes 

class_weights = compute_class_weight(
    class_weight='balanced',
    classes=np.unique(labels),
    y=labels
)

class_weights = dict(enumerate(class_weights))

# Load MobileNetV2
base_model = MobileNetV2(weights="imagenet", include_top=False, input_shape=(IMG_SIZE, IMG_SIZE, 3))

# Add classification layers
x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(128, activation="relu")(x)
predictions = Dense(train_generator.num_classes, activation="softmax")(x)

model = Model(inputs=base_model.input, outputs=predictions)


# Phase 1
base_model.trainable = False
model.compile(Adam(1e-4), loss="categorical_crossentropy", metrics=["accuracy"])
model.fit(
    train_generator, 
    validation_data=val_generator, 
    epochs=10,
    callbacks=callbacks,
    class_weight=class_weights
)


# Phase 2
base_model.trainable = True
for layer in base_model.layers[:-20]:
    layer.trainable = False  # Only unfreeze last 20 layers
model.compile(Adam(1e-5), loss="categorical_crossentropy", metrics=["accuracy"])
model.fit(
    train_generator, 
    validation_data=val_generator, 
    epochs=25,
    callbacks=callbacks,
    class_weight=class_weights
)


model.save("palm_disease_model.keras")