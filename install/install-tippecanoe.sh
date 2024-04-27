#!/bin/bash
# source : https://github.com/tebben/overture-maps/blob/main/scripts/install/install_tippecanoe.sh

sudo apt-get install -y software-properties-common build-essential libsqlite3-dev zlib1g-dev make

git clone https://github.com/felt/tippecanoe.git -b 2.53.0
cd tippecanoe
make
sudo make install
sudo mv tippecanoe /usr/local/bin/
cd ..
sudo rm -rf ./tippecanoe