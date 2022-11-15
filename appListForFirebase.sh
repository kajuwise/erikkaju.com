echo "Generating /apps directory index page! (Needed for Firebase hosting)"
cd apps
node generateAppListForFirebase.js > index.html
cd ..