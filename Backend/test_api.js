const http = require('http');
http.get('http://localhost:5000/api/branches/6a0b141f0bba437a15e0978e/display', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => { console.log(JSON.stringify(JSON.parse(data), null, 2)); });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
