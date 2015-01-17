"use strict";

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var light = new THREE.PointLight( 0xffffff, 8, 100 );
light.position.set( 50, 50, 50 );
scene.add( light );

camera.position.z = 200;

var M_BALL_WORKING_AREA = 60;

// var point_energy = new Array();
// for (var x = -M_BALL_WORKING_AREA; x <= M_BALL_WORKING_AREA; x++) {
//     point_energy[x] = new Array();
//     for (var y = -M_BALL_WORKING_AREA; y <= M_BALL_WORKING_AREA; y++) {
// 	point_energy[x][y] = new Array();
//     }
// }

// var point_visited = new Array();
// for (var x = -M_BALL_WORKING_AREA; x <= M_BALL_WORKING_AREA; x++) {
//     point_visited[x] = new Array();
//     for (var y = -M_BALL_WORKING_AREA; y <= M_BALL_WORKING_AREA; y++) {
// 	point_visited[x][y] = new Array();
//     }
// }

var draw_points = [];

var STATUS = {
    'ALL_IN': 0,
    'ALL_OUT': 1,
    'MIXED': 2
}

var CUTOFF = 0.0071;

var neighbor_diffs = [
    [1, 1, 1],
    [1, 1, 0],
    [1, 1, -1],
    [1, 0, 1],
    [1, 0, 0],
    [1, 0, -1],
    [1, -1, 1],
    [1, -1, 0],
    [1, -1, -1],
    [0, 1, 1],
    [0, 1, 0],
    [0, 1, -1],
    [0, 0, 1],
    [0, 0, -1],
    [0, -1, 1],
    [0, -1, 0],
    [0, -1, -1],
    [-1, 1, 1],
    [-1, 1, 0],
    [-1, 1, -1],
    [-1, 0, 1],
    [-1, 0, 0],
    [-1, 0, -1],
    [-1, -1, 1],
    [-1, -1, 0],
    [-1, -1, -1],
]


function generatePointCloudGeometry(color){

    var geometry = new THREE.BufferGeometry();

    var _side_length = (M_BALL_WORKING_AREA * 2 + 1);

    var numPoints = _side_length * _side_length * _side_length;

    var positions = new Float32Array( numPoints*3 );
    var colors = new Float32Array( numPoints*3 );

    var k = 0;

    for (var x = -M_BALL_WORKING_AREA; x <= M_BALL_WORKING_AREA; x++) {
	for (var y = -M_BALL_WORKING_AREA; y <= M_BALL_WORKING_AREA; y++) {
	    for (var z = -M_BALL_WORKING_AREA; z <= M_BALL_WORKING_AREA; z++) {
		positions[ 3 * k ] = x;
		positions[ 3 * k + 1 ] = y;
		positions[ 3 * k + 2 ] = z;

		var intensity = 255;
		colors[ 3 * k ] = color.r * intensity;
		colors[ 3 * k + 1 ] = color.g * intensity;
		colors[ 3 * k + 2 ] = color.b * intensity;

		k++;
	    }
	}
    }

    geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
    geometry.computeBoundingBox();

    return geometry;
}

function generatePointcloud(color) {

    var pointSize = 0.05;

    var geometry = generatePointCloudGeometry(color);

    // var material = new THREE.PointCloudMaterial( { size: pointSize, vertexColors: THREE.VertexColors } );

    var uniforms = {
	myColor: { type: "c", value: new THREE.Color( 0xffffff ) },
    };

    var attributes = {
	size: { type: 'f', value: [] },
    };

    // Recomputing this BAD
    var _side_length = (M_BALL_WORKING_AREA * 2 + 1);
    var numPoints = _side_length * _side_length * _side_length;

    for (var i=0; i < numPoints; i++) {
	attributes.size.value[i] = 5 + Math.floor(Math.random() * 10);
    }

    var material = new THREE.ShaderMaterial({
	uniforms: uniforms,
	attributes: attributes,
	vertexShader: $('#vertexShader').text(),
	fragmentShader: $('#fragmentShader').text()
    });

    var pointcloud = new THREE.PointCloud( geometry, material );

    return pointcloud;
}





function draw_box(x, y, z, scene) {
    var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    var material = new THREE.MeshLambertMaterial({
	color: 0x00ff00
    });
    var cube = new THREE.Mesh( geometry, material );
    cube.position.x = x;
    cube.position.y = y;
    cube.position.z = z;
    scene.add( cube );
    return cube;
}

function score(x1, y1, z1, x2, y2, z2) {
    var x_d = Math.abs(x1 - x2);
    var y_d = Math.abs(y1 - y2);
    var z_d = Math.abs(z1 - x2);

    return 1.0 / (x_d * x_d + y_d * y_d + z_d * z_d);
}


function compute_neighbors(x, y, z, point_energy) {

    var all_in = true;
    var all_out = true;

    for (var i = 0; i < neighbor_diffs.length; i++) {
	var t_x = x + neighbor_diffs[i][0];
	var t_y = y + neighbor_diffs[i][1];
	var t_z = z + neighbor_diffs[i][2];

	if (point_energy[t_x][t_y][t_z] == undefined) {
	    point_energy[t_x][t_y][t_z] = score(t_x, t_y, t_z, 0, 0, 0);
	}

	if (point_energy[t_x][t_y][t_z] >= CUTOFF) {
	    all_out = false;
	} else {
	    all_in = false;
	}
    }

    if (all_out == true) {
	return STATUS['ALL_OUT'];
    } else if (all_in == true) {
	return STATUS['ALL_IN'];
    } else {
	return STATUS['MIXED'];
    }
}


function do_edges(x, y, z, scene, point_energy) {
    point_visited[x][y][z] = true;

    var point_status = compute_neighbors(x, y, z, point_energy);

    if (point_status == STATUS['MIXED']) {
	draw_points.push(draw_box(x, y, z, scene));

	for (var i = 0; i < neighbor_diffs.length; i++) {
	    var t_x = x + neighbor_diffs[i][0];
	    var t_y = y + neighbor_diffs[i][1];
	    var t_z = z + neighbor_diffs[i][2];

	    if (point_visited[t_x][t_y][t_z] == undefined) {
		do_edges(t_x, t_y, t_z, scene, point_energy);
	    }
	}
    }
}


function strategy_2() {
    // Find first outside point
    for (var x = 0; x <= 1000; x++) {
	var s = score(x, 0, 0, 0, 0, 0);
	if (s < CUTOFF) {
	    do_edges(x, 0, 0, scene, point_energy);
	    break;
	}
    }
}

var render = function () {
    // requestAnimationFrame( render );

    // remove_boxes(scene, draw_points);

    // cube.rotation.x += 0.1;
    // cube.rotation.y += 0.1;

    var pcBuffer = generatePointcloud( new THREE.Color( 1,0,0 ));
    // pcBuffer.scale.set( 10,10,10 );
    // pcBuffer.position.set( -5,0,5 );
    scene.add( pcBuffer );

    // strategy_2();

    renderer.render(scene, camera);
};

// render();

$(function() {
    $.get( "js/vertex_shader.glsl", function( data ) {
	$("#vertexShader").text(data);
    });
    $.get( "js/fragment_shader.glsl", function( data ) {
	$("#fragmentShader").text(data);
    });

    $('#submit').click(function() {
	console.log('render');
	render();
	console.log('done!');
    })
});
