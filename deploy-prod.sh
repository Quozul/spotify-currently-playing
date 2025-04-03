#!/bin/sh

docker compose --file docker-compose.prod.yml build $@
docker compose --file docker-compose.prod.yml push $@
docker stack deploy -d --compose-file docker-compose.prod.yml --with-registry-auth spotify_currently_playing
