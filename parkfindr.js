var express = require('express'),                                                                                        
    http = require('http');                                                                                              
                                                                                                                         
var app = express();                                                                                                     
                                                                                                                         
app.engine('handlebars', require('express3-handlebars')({ defaultLayout: 'main' }));                                     
app.set('view engine', 'handlebars');                                                                                    
                                                                                                                         
app.use(require('morgan')('dev'));                                                                                       
                                                                                                                         
app.use(express.static(__dirname + '/public'));                                                                          

var getParks = (function(){
	var cache = {
		refreshed: 0,
		refreshInterval: 1000 * 60 * 60 * 24,  // 24 hours
		parks: [],
	};
	return function(cb){
		var now = Date.now();
		if( now > cache.refreshed + cache.refreshInterval ) {
			cache.refreshed = now;
			http.get('http://api.civicapps.org/parks/', function(res){
				var json = '';
				res.on('data', function(chunk){
					json += chunk;
				});
				res.on('end', function(){
					try {
						var parks = JSON.parse(json);
						if(parks.status !== 'ok') throw new Error('API failed with status "' + status + '".');
						var parksById = {};
						cache.parks = parks.results.map(function(park){
							park = {
								id: park.PropertyID,
								name: park.Property,
								amenities: park.amenities,
								loc: { lat: park.loc.lat, lng: park.loc.lon },
							};
							parksById[park.id] = park;
							return park;
						});
						cache.parks.byId = parksById;
						console.log(new Date() + ': parks cache refreshed.');
					} catch(err){
						console.error('Error refreshing parks cache: ' + err.stack);
					}
					cb(cache.parks);
				});
			});
		} else {
			cb(cache.parks);
		}
	};
})();
                                                                                                                         
app.get('/', function(req, res){                                                                                         
    res.render('home');                                                                                                  
});                                                                                                                      
                                                                                                                         
app.get('/error', function(req, res){                                                                                    
    throw new Error('Whoops!');                                                                                          
});                                                                                                                      
    
app.get('/api/parks/or/portland', function(req, res){                                                                    
    getParks(function(parks){                                                                                            
        res.json(parks);                                                                                                 
    });                                                                                                                  
});                                                                                                                      
                                                                                                                         
app.get('/partials/park-info/:id', function(req, res){                                                                   
    getParks(function(parks){                                                                                            
        res.render('partials/park-info', { park: parks.byId[req.params.id], layout: null });                             
    });                                                                                                                  
});                                                                                                                      
                                                                                                                         
app.use(function(req, res){                                                                                              
    res.render('404');                                                                                                   
});                                                                                                                      
                                                                                                                         
app.use(function(err, req, res, next){                                                                                   
    console.error('Server error: ' + err.stack);                                                                         
    res.render('500');                                                                                                   
});                                                                                                                      
                                                                                                                         
app.listen(3000, function(){                                                                                             
    console.log('listening on port 3000');                                                                               
});                                                                                                                      
        
