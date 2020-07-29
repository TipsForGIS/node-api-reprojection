var proj4 = require('proj4');
var is_numeric = require('fast-isnumeric');
var round_to = require('round-to');

var generate_JSON_error = function(error_type, error_details){
    return {
        'error_type': error_type,
        'error_details': error_details
    };

}

var assign_in_proj = function(out_proj){

    // UTM27N
    var UTM37N_proj_def = proj4.Proj('PROJCS["WGS 84 / UTM zone 37N",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",39],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["Easting",EAST],AXIS["Northing",NORTH],AUTHORITY["EPSG","32637"]]');
    // Web mercator
    var web_mercator_proj_def = proj4.Proj('PROJCS["WGS 84 / Pseudo-Mercator",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],PROJECTION["Mercator_1SP"],PARAMETER["central_meridian",0],PARAMETER["scale_factor",1],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["X",EAST],AXIS["Y",NORTH],EXTENSION["PROJ4","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs"],AUTHORITY["EPSG","3857"]]');

    var result = {};

    if (out_proj.toUpperCase() === 'WEB_MERCATOR'){
        result.out_proj_def = web_mercator_proj_def;
        result.out_proj_name = 'WEB_MERCATOR';
        result.out_proj_code = 3857;
    }
    else if(out_proj.toUpperCase() === 'UTM37N'){
        result.out_proj_def = UTM37N_proj_def;
        result.out_proj_name = 'UTM37N';
        result.out_proj_code = 32637;
    }
    else{
        result.out_proj_name = undefined;
    }

    return result;

}

var project = function(req,res){

    if(req.query.lon === undefined || req.query.lat === undefined || req.query.out_proj === undefined){
        res.status(400);
        res.setHeader('Content-Type', 'application/json');
        res.send(generate_JSON_error('Missing one or more of the params', ['The parameters are lat, lon, and out_roj','lon and lat parameters should be numeric','Use decimal format (-)xx.xxxxxxx','Valid longitudes range from -180 to 180','Valid latitudes range from -90 to 90','Output projection options: WEB_MERCATOR, UTM37N, and NAD27']));
        return;
    }
    
    var input_lon = req.query.lon;
    var input_lat = req.query.lat;

    // Check if both longitude and latitude are wrong or out of range

    if ((!is_numeric(input_lon) || -180 > input_lon || input_lon > 180) && (!is_numeric(input_lat) || -90 > input_lat || input_lat > 90)){ 
        res.status(400);
        res.setHeader('Content-Type', 'application/json');
        res.send(generate_JSON_error('Longitude and latitude error', ['lon and lat parameters not numeric or out of range','Use decimal format (-)xx.xxxxxxx','Valid longitudes range from -180 to 180','Valid latitudes range from -90 to 90']));
        
        return;
    }


    // Check if the longitude is wrong or out of range
    if (!is_numeric(input_lon) || -180 > input_lon || input_lon > 180){
        res.status(400);
        res.setHeader('Content-Type', 'application/json');
        res.send(generate_JSON_error('Longitude error', ['lon parameter not numeric or out of range','Use decimal format (-)xx.xxxxxxx','Valid longitudes range from -180 to 180']));
        
        return;
    }

    // Check if the latitude is wrong or not supported
    if (!is_numeric(input_lat) || -90 > input_lat || input_lat > 90){
        res.status(400);
        res.setHeader('Content-Type', 'application/json');
        res.send(generate_JSON_error('Latitude error', ['lat parameter not numeric or out of range','Use decimal format (-)xx.xxxxxxx','Valid Latitudes range from -90 to 90']));
        
        return;
    }

    var out_proj = req.query.out_proj;
    
    var proj_assgn_res = assign_in_proj(out_proj);

    // Check if output projection is wrong or not supported
    if (proj_assgn_res.out_proj_code === undefined){
        res.status(400);
        res.setHeader('Content-Type', 'application/json');
        res.send(generate_JSON_error('Output projections invalid', ['out_proj prameter not in proper format or not supported by this API','Supported projections are: ','ESPG 3857, type in URL --> WEB_MERCATOR','ESPG 32637, type in URL --> UTM37N']));
        return;
    }

    // The following code will create the output results if there are no errors
    input_lon = round_to(parseFloat(req.query.lon),7);
    input_lat = round_to(parseFloat(req.query.lat),7);
    

    output_coords = proj4(proj_assgn_res.out_proj_def,[input_lon,input_lat]);

    // The params is the object to be displayed as JSON
    var params = {
        'input':
                {
                    'lon': parseFloat(input_lon),
                    'lat': parseFloat(input_lat),
                    'projection': 'WGS84'
                },
        
                'output':
                {
                    'lon': output_coords[0],
                    'lat': output_coords[1],
                    'projection': proj_assgn_res.out_proj_name
                }
            };
            
    res.status(200);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(params));          

};

module.exports.project = project;