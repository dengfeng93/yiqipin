#!/usr/bin/env python3
"""Upload backup file to Tencent Cloud COS."""

import os
import sys
from qcloud_cos import CosConfig, CosS3Client

BUCKET = os.environ.get('COS_BUCKET', '')
REGION = os.environ.get('COS_REGION', 'ap-guangzhou')
SECRET_ID = os.environ.get('COS_SECRET_ID', '')
SECRET_KEY = os.environ.get('COS_SECRET_KEY', '')


def main():
    if len(sys.argv) < 2:
        print('Usage: upload_to_cos.py <file_path>')
        sys.exit(1)

    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(f'File not found: {file_path}')
        sys.exit(1)

    if not all([BUCKET, SECRET_ID, SECRET_KEY]):
        print('COS credentials not configured. Set COS_BUCKET, COS_SECRET_ID, COS_SECRET_KEY env vars.')
        sys.exit(1)

    config = CosConfig(Region=REGION, SecretId=SECRET_ID, SecretKey=SECRET_KEY)
    client = CosS3Client(config)

    filename = os.path.basename(file_path)
    key = f'backups/{filename}'

    client.upload_file(
        Bucket=BUCKET,
        Key=key,
        LocalFilePath=file_path,
    )

    print(f'Uploaded to COS: {BUCKET}/{key}')


if __name__ == '__main__':
    main()
