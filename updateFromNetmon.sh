#!/bin/bash

# update all repositories
cd ../freifunkfranken-community/
git pull
cd ../community.franken.freifunk.net/
git pull

# get all nodes from netmon and update the community files
node ./create_community_files.js

# update the github repository with the new data
cd ../freifunkfranken-community/
git pull
git commit -a -m "updated from netmon"
git push origin master