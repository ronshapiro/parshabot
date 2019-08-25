#!/bin/bash

set -eu

BOOKS=(Genesis Exodus Leviticus Numbers Deuteronomy)

PREFIX="https://raw.githubusercontent.com/Sefaria/Sefaria-Export/master"

rm -rf sefaria-data

function mkdir_cd() {
  mkdir $1
  cd $1
}

mkdir_cd sefaria-data

########################
########################
########################

mkdir_cd schemas

for book in ${BOOKS[@]}; do
    wget -q "${PREFIX}/schemas/${book}.json"
done

cd ..

########################
########################
########################

mkdir_cd books

for book in ${BOOKS[@]}; do
    wget -q -O ${book}.json "${PREFIX}/json/Tanakh/Torah/${book}/English/The%20Koren%20Jerusalem%20Bible.json"
done

cd ..

########################
########################
########################

mkdir_cd books-he

for book in ${BOOKS[@]}; do
    wget -q -O ${book}.json "${PREFIX}/json/Tanakh/Torah/${book}/Hebrew/Tanach%20with%20Ta'amei%20Hamikra.json"
done

cd ..

########################
########################
########################

cd ..
