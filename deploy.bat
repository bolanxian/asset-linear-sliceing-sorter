cd dist

git init
git add -A
git commit -m 'deploy'

git push -f --progress "https://github.com/bolanxian/asset-linear-sliceing-sorter.git" master:gh-pages