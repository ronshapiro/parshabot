set -eu

BOOKS=(Genesis Exodus Leviticus Numbers Deuteronomy)

rm -rf sefaria-data

function mkdir_cd() {
  mkdir $1
  cd $1
}

mkdir_cd sefaria-data
mkdir_cd schemas

for book in ${BOOKS[@]}; do
    wget -q "https://raw.githubusercontent.com/Sefaria/Sefaria-Export/master/schemas/${book}.json"
done

cd ..

mkdir_cd books

for book in ${BOOKS[@]}; do
    wget -q -O ${book}.json "https://raw.githubusercontent.com/Sefaria/Sefaria-Export/master/json/Tanakh/Torah/${book}/English/The%20Koren%20Jerusalem%20Bible.json"
done

cd ../..
