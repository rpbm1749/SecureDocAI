import os
import joblib

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

DATA_DIR = "training_data"
MODEL_DIR = "models"

os.makedirs(MODEL_DIR, exist_ok=True)

texts = []
labels = []

for label in os.listdir(DATA_DIR):
    label_dir = os.path.join(DATA_DIR, label)
    if not os.path.isdir(label_dir):
        continue

    for file in os.listdir(label_dir):
        if not file.endswith(".txt"):
            continue

        with open(os.path.join(label_dir, file), "r", encoding="utf-8", errors="ignore") as f:
            texts.append(f.read())
            labels.append(label)

print(f"Loaded {len(texts)} documents")

vectorizer = TfidfVectorizer(
    max_features=5000,
    stop_words="english"
)

X = vectorizer.fit_transform(texts)

classifier = LogisticRegression(
    max_iter=1000,
    class_weight="balanced"
)

classifier.fit(X, labels)

joblib.dump(vectorizer, f"{MODEL_DIR}/tfidf_vectorizer.joblib")
joblib.dump(classifier, f"{MODEL_DIR}/doc_classifier.joblib")

print("Training complete. Models saved.")
