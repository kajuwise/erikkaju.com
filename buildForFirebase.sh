#!/bin/bash

cd apps
echo "generating /apps directory index file for Firebase"
cat > dirIndexForFirebase.js << 'EOF'

const { resolve } = require('path'), { readdir } = require('fs').promises;
const directory = ".";

async function getFiles(dir) {
    const dirents = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents
        .filter((dirent) => dirent.name.includes('.kajuapp'))
        .map((dirent) => {
            if (dirent.isDirectory()) {
                return getFiles(resolve(dirent.name));
            }
            let direntName = dirent.name;
            if (dir != directory) {
                direntName = direntName + "/" + direntName;
            }
            return direntName;
    }));
    return Array.prototype.concat(...files);
}


getFiles(directory).then(results => {
    let html = "<ul>"
        + results.map(fileOrDirectory => {
            return `<li><a href="${fileOrDirectory}">${fileOrDirectory}</a></li>`
        }).join("");
    html += '</ul>';
    process.stdout.write(html);
});

EOF

node dirIndexForFirebase.js > index.html
cd ..