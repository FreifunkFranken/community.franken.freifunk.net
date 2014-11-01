#!/bin/bash

BASEDIR=$(dirname $0)

# update community repository
cd ${BASEDIR}/../freifunkfranken-community/
git pull

# get all nodes from netmon and update the community files
cd ${BASEDIR}
git config user.name "NetmonUpdateScript"
git pull
node create_community_files.js

# update the github repository with the new data
cd ${BASEDIR}/../freifunkfranken-community/
git commit -a -m "updated from netmon"
git push origin master

