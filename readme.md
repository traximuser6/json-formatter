
simply create a file log.txt adjacent to the ts file





```js


import * as fs from 'fs';
import * as path from 'path';


const logFilePath = path.join(__dirname, 'log.txt');

function logToFile(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const content = `[${timestamp}] ${message}\n${data ? JSON.stringify(data, null, 2) : ''}\n\n`;
  fs.appendFile(logFilePath, content, (err) => {
    if (err) console.error('Failed to write log:', err);
  });
}


```

