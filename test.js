const fs = require('fs');
console.log(fs.readFileSync('src/context/AppContext.tsx', 'utf8').substring(30000, 31000));
