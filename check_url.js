const https = require('https');
https.get('https://queue-management-system-teal.vercel.app', res => {
  let body = '';
  res.on('data', c => body+=c);
  res.on('end', () => {
    const match = body.match(/src="(.*?\.js)"/);
    if(match) {
      https.get('https://queue-management-system-teal.vercel.app' + match[1], res2 => {
        let js = '';
        res2.on('data', c => js+=c);
        res2.on('end', () => {
          const apiMatch = js.match(/https:\/\/[^\"]*onrender\.com/g);
          console.log('API URLs found in JS:', apiMatch ? [...new Set(apiMatch)] : null);
        });
      });
    }
  });
});
