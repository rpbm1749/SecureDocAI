from google.cloud import vision

def extract_text_from_bytes(file_bytes):
    client = vision.ImageAnnotatorClient()

    image = vision.Image(content=file_bytes)
    response = client.text_detection(image=image)

    if response.error.message:
        raise Exception(response.error.message)

    texts = response.text_annotations
    if not texts:   
        return ""

    return texts[0].description

def extract_text_from_pdf_gcs(gcs_uri):
    client = vision.ImageAnnotatorClient()

    feature = vision.Feature(type_=vision.Feature.Type.DOCUMENT_TEXT_DETECTION)
    gcs_source = vision.GcsSource(uri=gcs_uri)
    input_config = vision.InputConfig(
        gcs_source=gcs_source,
        mime_type="application/pdf"
    )

    request = vision.AnnotateFileRequest(
        features=[feature],
        input_config=input_config
    )

    response = client.batch_annotate_files(requests=[request])

    text = ""
    for page in response.responses[0].responses:
        if page.full_text_annotation:
            text += page.full_text_annotation.text

    return text