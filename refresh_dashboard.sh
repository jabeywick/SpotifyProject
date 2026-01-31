#!/bin/bash

cd /home/janitha/SpotifyProject

UPDATE_OUTPUT=$(/usr/bin/git pull origin main)

if [[ "$UPDATE_OUTPUT" != *"Already up to date"* ]]; then
	/usr/bin/pm2 restart Spotify
	sleep 10
fi

/usr/bin/curl -s http://localhost:8080/api/refresh-ui

/home/janitha/.virtualenvs/pimoroni/bin/python3 displayDriver.py