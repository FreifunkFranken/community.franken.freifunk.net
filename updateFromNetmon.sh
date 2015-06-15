#!/bin/sh

#get BASEDIR properly for cron (http://stackoverflow.com/questions/59895/can-a-bash-script-tell-what-directory-its-stored-in)
SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
BASEDIR=$DIR

# update community repository
COMMUNITYDIR=$( dirname $BASEDIR )
COMMUNITYDIR="${COMMUNITYDIR}/freifunkfranken-community/"
cd ${COMMUNITYDIR}
git pull

# get all nodes from netmon and update the community files
cd ${BASEDIR}
git pull
CREATEFILE="${BASEDIR}/create_community_files.js"
node ${CREATEFILE}

# update the github repository with the new data
cd ${COMMUNITYDIR}
git config user.name "NetmonUpdateScript"
git commit -a -m "updated from netmon"
git push origin master
