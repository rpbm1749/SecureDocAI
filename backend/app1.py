import os
import sys
from google.cloud import storage

user_id = sys.argv[1]

client = storage.Client()
bucket = client.bucket("secure-docs-bucket")

for blob in bucket.list_blobs(prefix=f"documents/{user_id}/meta/"):
    blob.delete()
print(f"All metadata for user {user_id} has been deleted.")