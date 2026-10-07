#!/bin/bash
set -e
cd /home/ubuntu/handleliste_web
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
set -a; source .env; set +a
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart handleliste
echo "Utrulling ferdig: $(date)"
