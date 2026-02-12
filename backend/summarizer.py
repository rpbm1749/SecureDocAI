import re
from collections import defaultdict


def split_sentences(text: str):
    """
    Simple and robust sentence splitter.
    """
    return re.split(r'(?<=[.!?])\s+', text.strip())


def is_redundant(sentence: str, selected_sentences: list) -> bool:
    """
    Checks if a sentence is too similar to already selected sentences.
    """
    sent_words = set(sentence.lower().split())

    for s in selected_sentences:
        overlap = sent_words & set(s.lower().split())
        if sent_words and (len(overlap) / len(sent_words)) > 0.6:
            return True

    return False


def summarize_text(text: str, max_sentences: int = 3) -> str:
    """
    Extractive summarization using word frequency + position bias + redundancy removal.

    Returns a shortened version of the document using the most informative sentences.
    """

    if not text or len(text) < 100:
        return text

    sentences = split_sentences(text)

    if len(sentences) <= max_sentences:
        return text

    # -----------------------------
    # 1️⃣ Word frequency analysis
    # -----------------------------
    word_freq = defaultdict(int)

    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    for word in words:
        word_freq[word] += 1

    if not word_freq:
        return text

    max_freq = max(word_freq.values())
    for word in word_freq:
        word_freq[word] /= max_freq

    # -----------------------------
    # 2️⃣ Sentence scoring
    # -----------------------------
    sentence_scores = {}

    for idx, sentence in enumerate(sentences):
        sentence_words = re.findall(r'\b[a-zA-Z]{3,}\b', sentence.lower())
        if not sentence_words:
            continue

        word_score = sum(word_freq.get(word, 0) for word in sentence_words)
        avg_word_score = word_score / len(sentence_words)

        # Position bias (earlier sentences are more important)
        position_weight = 1 / (idx + 1)

        sentence_scores[sentence] = avg_word_score + position_weight

    if not sentence_scores:
        return text

    # -----------------------------
    # 3️⃣ Rank sentences
    # -----------------------------
    ranked_sentences = sorted(
        sentence_scores,
        key=sentence_scores.get,
        reverse=True
    )

    # -----------------------------
    # 4️⃣ Select non-redundant sentences
    # -----------------------------
    selected = []

    for sent in ranked_sentences:
        if not is_redundant(sent, selected):
            selected.append(sent)
        if len(selected) == max_sentences:
            break

    # Preserve original document order
    summary = " ".join(s for s in sentences if s in selected)

    return summary
