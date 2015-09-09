var $http = require('http'),
    $server = $http.createServer(function(req, res) {
        
        res.setRequestHeader('Content-Type', 'text/html');
        res.end('Welcome to ang-google-maps package');
        
    });

$server.listen(8080, 'localhost');
console.log('Listening on port 8080');
