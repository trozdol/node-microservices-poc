#!/bin/sh

# nodemon index.js
# nodemon registry/service.registry.js;
# nodemon auth/service.auth.js;
# nodemon admin/service.admin.js;
services=(
    registry # :3001
    api      # :3000
    auth     # :*
    admin    # :*
)

service_root=$(pwd);

echo "service root: "$service_root;

for service in ${services[@]}; do
    osascript -e 'tell application "Terminal" to do script "cd '$service_root/$service' && nodemon index" '
done;
