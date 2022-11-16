#!/bin/bash

cd apps
echo "generating /apps directory index file for Firebase"
cat > dirIndexForFirebase.js << 'EOF'

const { resolve } = require('path'), { readdir } = require('fs').promises;

async function getFiles(dir) {
    const dirents = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map((dirent) => {
            return dirent.name;
    }));
    return Array.prototype.concat(...files);
}

const directory = ".";

getFiles(directory).then(results => {
    let html = "<ul>"
        + results.map(fileOrDirectory => {
            if (fileOrDirectory.includes('.kajuapp')) {
                return `<li><a href="${fileOrDirectory}">${fileOrDirectory}</a></li>`
            }
        }).join("");
    html += '</ul>';
    process.stdout.write(html);
});

EOF

node dirIndexForFirebase.js > index.html
cd ..