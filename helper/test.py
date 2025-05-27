import os
import random
import shutil
from PIL import Image
from zipfile import ZipFile

# === CONFIG ===
SOURCE_DIR       = 'dataset'            # root folder containing 'train' & 'val'
SPLITS           = ['train', 'val']     # which subfolders to sample from
OUTPUT_DIR       = 'sampled_dataset'    
ZIP_NAME         = 'palm_sample.zip'
SAMPLES_PER_CLASS = 10                  # per class per split

# === CLEANUP & PREP ===
if os.path.exists(OUTPUT_DIR):
    shutil.rmtree(OUTPUT_DIR)
os.makedirs(OUTPUT_DIR, exist_ok=True)

total_selected = 0

# === SAMPLE PROCESS ===
for split in SPLITS:
    split_src = os.path.join(SOURCE_DIR, split)
    if not os.path.isdir(split_src):
        print(f"⚠️  Missing split folder: {split_src}, skipping")
        continue

    for class_name in os.listdir(split_src):
        class_src = os.path.join(split_src, class_name)
        if not os.path.isdir(class_src):
            continue

        images = [f for f in os.listdir(class_src)
                  if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        print(f"[{split}/{class_name}] found {len(images)} images")

        if not images:
            print(f"  ⚠️ no images in {class_src}, skipping")
            continue

        n_pick = min(SAMPLES_PER_CLASS, len(images))
        if len(images) < SAMPLES_PER_CLASS:
            print(f"  ⚠️ only {len(images)} available, sampling all")

        sampled = random.sample(images, n_pick)
        dest_folder = os.path.join(OUTPUT_DIR, split, class_name)
        os.makedirs(dest_folder, exist_ok=True)

        for img_name in sampled:
            src_path = os.path.join(class_src, img_name)
            dst_path = os.path.join(dest_folder, os.path.splitext(img_name)[0] + '.jpg')
            with Image.open(src_path) as img:
                img.convert('RGB').save(dst_path, 'JPEG', quality=90)
            total_selected += 1

# === CREATE ZIP ===
if total_selected == 0:
    print("❌ No images selected—check your SOURCE_DIR and extensions.")
else:
    with ZipFile(ZIP_NAME, 'w') as zf:
        for root, _, files in os.walk(OUTPUT_DIR):
            for file in files:
                full = os.path.join(root, file)
                arc = os.path.relpath(full, OUTPUT_DIR)
                zf.write(full, arc)
    print(f"✅ Packed {total_selected} images into '{ZIP_NAME}'")
