#!/bin/bash
cd /home/z/my-project/mini-services/tts-service
./venv/bin/python index.py >> /tmp/tts-service.log 2>&1
