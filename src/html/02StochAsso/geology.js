/*!
	\file geology.js
	\author Gabriel Godefroy <gabriel.godefroy@hotmail.fr>
*/


/*! \var guiviewer */
var guiviewer ;

/************************************
*****		ObjectViewer		*****
*************************************/
// Default constructor
var ObjectViewer = function(canvas_id)
{
	this.canvas_id = canvas_id
	this.scene ;
	this.renderer;
	this.camera;
	this.pointlight;
	this.ambientlight;
	this.controls ;
	this.meshes=[];
	this.use_buffer_geometry_ = true ;
	this.initialize();
}
// Initialize everything
ObjectViewer.prototype.initialize = function()
{
	this.init_scene() ;
	this.init_renderer();
	this.init_camera();
	this.scene.add(this.camera);
	this.init_controls() ;
	this.init_lights();
	this.add_lights_to_scene()
}

// Generate the graphical interface if necessary 
ObjectViewer.prototype.generate_graphical_interface = function(text)
{
	
	guiviewer = new GUIViewer(this);
	this.gui = guiviewer;
	this.gui.initialize_interface(text);
	this.gui.create_buttons();
}




// Prepare camera place and resize scene
ObjectViewer.prototype.prepare = function()
{
	this.set_camera_place();
	this.resize();
}


ObjectViewer.prototype.append_mesh = function(mesh,name,numbers,type,color){
    mesh.property_names = [];
    mesh.properties = [];
    mesh.numbers = numbers;
    mesh.type = type ;
    mesh.name = name;
    mesh.color = color; 	// mesh.color is the color if no property
    						// is set
    this.meshes.push(mesh);
    this.scene.add(mesh) ;
	return mesh;
}

// Creates a THREE.Geometry or a THREE.BufferGeometry from the array 
// or number. Creates the THREE.Material from the given color.
// Creates the THREE.mesh and add it to this.meshes and this.scene
// Name should be different for each object
ObjectViewer.prototype.append_surface = function(numbers, color, name)
{
	
    var geometry = this.create_surface_geometry(numbers) ;
   	var material = this.create_surface_material(color);
   	var surface = new THREE.Mesh(geometry, material);
   	return this.append_mesh(surface,name,numbers,"Surface",color);
}



// Create points from a [x1,y1,z1, x2,y2,z2, ... xn,yz,zn] array
ObjectViewer.prototype.append_points = function(numbers, color, name)
{
	var geometry_points ;
	var geometry_points = this.create_points_geometry(numbers)
	var point_material = this.create_points_material(color)
	var points = new THREE.Points(geometry_points, point_material);
	return this.append_mesh(points,name,numbers, "Points",color)
}


// Create line from a [[x11,y11,z11, x12,y12,z12, ... x1n,y1z,z1n],...,
//	[x21,y21,z21, x22,y22,z22, ... x2n,y2z,z21]] array
ObjectViewer.prototype.append_lines = function(numbers, color, name)
{
	var material = this.create_line_material(color);
	var sub_number = [];
	for(var l_ind = 0 ; l_ind<numbers.length; ++l_ind){
		for(var p_ind = 0 ; p_ind<numbers[l_ind].length/3 - 1; ++p_ind){
			for(var i_ind = 0; i_ind < 6 ; ++i_ind){
				sub_number.push(numbers[l_ind][3*p_ind+i_ind]);
			}
		}
	}		
	var geometry_line = this.create_points_geometry(sub_number); 
	var line = new THREE.LineSegments( geometry_line, material );
	return this.append_mesh(line,name,numbers,"Line",color);		
}


ObjectViewer.prototype.create_points_geometry = function(
	numbers
)
{
	var geometry_points = new THREE.BufferGeometry();
	var vertices = new Float32Array(numbers.length);
	var color = new Float32Array(numbers.length);
	for(var p_ind = 0 ; p_ind < numbers.length ; ++p_ind)
	{
		vertices[p_ind] = numbers[p_ind];
		color[p_ind] = p_ind / numbers.length;
	}

	// itemSize = 3 because there are 3 values (components) per vertex
	geometry_points.addAttribute( 'position', 
		new THREE.BufferAttribute( vertices, 3 ) );
	geometry_points.addAttribute( 'color', 
		new THREE.BufferAttribute( color, 3 ) );
	geometry_points.computeVertexNormals();
	return geometry_points;
}


/*! \brief Calls either 
	* create_surface_material, 
	* create_points_material
	* create_line_material
	according to type
*/
ObjectViewer.prototype.create_material = function(color,type)
{

	if(type=="Surface") {
		return this.create_surface_material(color) ; 
	} else if (type == "Points") {
		return this.create_points_material(color) ; 
	} else if (type == "Line") {
		return this.create_line_material(color) ; 
	}	
}



ObjectViewer.prototype.create_line_material = function(color)
{
	return new THREE.LineBasicMaterial(
	{	color: color,
			linewidth:5	}
	);
}

ObjectViewer.prototype.create_points_material = function(color)
{
	var point_material = new THREE.PointsMaterial( { 
			size: 15., 
			sizeAttenuation:false,
			color:color
		} )
    return point_material ;
}


ObjectViewer.prototype.create_surface_material = function(color)
{
    return new THREE.MeshLambertMaterial({
    	side: THREE.DoubleSide,
   		color:color
    });
}

// Retourne une géometrie crée à partir du tableau donnée.
//    Le format du tableau doit être :
//      nombre_de_points,
//      nombre_de_triangle,
//      x1, y1, z1,
//      ...
//      xn, yn, zn,
//      index_point_a index_point_b index_point_c
//      ...
//      index_point_i index_point_j index_point_k
//
//      En fonction de la valeur de this.use_buffer_geometry_,
//      appelle this.create_surface_geometry_normal ou
//      this.create_surface_geometry_buffer
ObjectViewer.prototype.create_surface_geometry = function(numbers)
{
	if(!this.use_buffer_geometry_){
		return this.create_surface_geometry_normal(numbers)
	} else {
		return this.create_surface_geometry_buffer(numbers)
	}
} ;


// \return a THREE.Geometry built from \param number 
ObjectViewer.prototype.create_surface_geometry_normal
	= function(numbers)
{
	number_of_points = numbers[0];
	number_of_triangles = numbers[1];

	geometry = new THREE.Geometry();

	for (var p = 0; p < number_of_points; p++) {
		var v = new THREE.Vector3(
			numbers[2 + p * 3 + 0],
			numbers[2 + p * 3 + 1],
			numbers[2 + p * 3 + 2]
		);
		geometry.vertices.push(v)
	}

	var offset = 3 * number_of_points + 2;

	for (var t = 0; t < number_of_triangles; t++) {
		var f = new THREE.Face3(
			numbers[offset + t * 3 + 0],
			numbers[offset + t * 3 + 1],
			numbers[offset + t * 3 + 2]
		);
		geometry.faces.push(f);
	}

	geometry.computeFaceNormals();
	return geometry ;
}
// \return a THREE.BufferGeometry built from \param number 
ObjectViewer.prototype.create_surface_geometry_buffer
	= function(numbers)
{
	number_of_points = numbers[0];
	number_of_triangles = numbers[1];

	var geometry = new THREE.BufferGeometry();

	//vertex(x, y, z)
	var components_per_vertex = 3;
	//triangle(vertex0, vertex1, vertex2)
	var vertex_per_triangle = 3;

	var vertices = new Float32Array(
		number_of_triangles *
		components_per_vertex * vertex_per_triangle );

	// components of the position vector for each vertex are stored
	// contiguously in the buffer.
	var offset = 3 * number_of_points + 2;

	for ( var t = 0; t < number_of_triangles; t++ )
	{
		var ind0 = numbers[offset + t * vertex_per_triangle + 0] ;
		var ind1 = numbers[offset + t * vertex_per_triangle + 1] ;
		var ind2 = numbers[offset + t * vertex_per_triangle + 2] ;

		/* Each triangle need three vertices, with a total of 9 components per triangle */
		vertices[ t *components_per_vertex *vertex_per_triangle + 0 ] =
			numbers[components_per_vertex *ind0+2+0];
		vertices[ t *components_per_vertex *vertex_per_triangle + 1 ] =
			numbers[components_per_vertex *ind0+2+1];
		vertices[ t *components_per_vertex *vertex_per_triangle + 2 ] =
			numbers[components_per_vertex *ind0+2+2];

		vertices[ t *components_per_vertex *vertex_per_triangle + 3 ] =
			numbers[components_per_vertex *ind1+2+0];
		vertices[ t *components_per_vertex *vertex_per_triangle + 4 ] =
			numbers[components_per_vertex *ind1+2+1];
		vertices[ t *components_per_vertex *vertex_per_triangle + 5 ] =
			numbers[components_per_vertex *ind1+2+2];

		vertices[ t *components_per_vertex *vertex_per_triangle + 6 ] =
			numbers[components_per_vertex *ind2+2+0];
		vertices[ t *components_per_vertex *vertex_per_triangle + 7 ] =
			numbers[components_per_vertex *ind2+2+1];
		vertices[ t *components_per_vertex *vertex_per_triangle + 8 ] =
			numbers[components_per_vertex *ind2+2+2];
	}

	// itemSize = 3 because there are 3 values (components) per vertex
	geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, components_per_vertex ) );
	geometry.computeVertexNormals();

	return geometry ;
}

/*! Gère l'affichage.
	A chaque tour, place la lumière au niveau de la caméra.
	A chaque tour, met à jour this.controls.
*/
ObjectViewer.prototype.do_render = function(render)
{
	requestAnimationFrame(render);
	this.pointlight.position.set(
    	this.camera.position.x,
    	this.camera.position.y,
    	this.camera.position.z
    );
    this.renderer.render(this.scene, this.camera) ;
   	this.controls.update();
}
// Initialize the scene
ObjectViewer.prototype.init_scene = function()
{
	 this.scene = new THREE.Scene();
}
// Initialize the rendered
ObjectViewer.prototype.init_renderer = function()
{
	this.renderer = new THREE.WebGLRenderer({
        alpha: true,
        canvas: document.getElementById(this.canvas_id)
    });

    this.renderer.setPixelRatio( window.devicePixelRatio );
	this.renderer.setSize( window.innerWidth, window.innerHeight );

    this.renderer.setClearColor(0xffffff, 0.0);
}

// Initialize the camera
ObjectViewer.prototype.init_camera = function()
{
	this.camera = new THREE.PerspectiveCamera(
		40,
		window.innerWidth / window.innerHeight,
		0.1,
		100000
	);
}


// Initialize the light
ObjectViewer.prototype.init_lights = function() {
    this.ambientlight = new THREE.AmbientLight(0x404040);
    this.pointlight = new THREE.PointLight(0xfffaff, 0.8, 0);
	// light.position.set(camera.position.x, camera.position.y, camera.position.z);
};

// Add the lights to the scene
ObjectViewer.prototype.add_lights_to_scene = function() {
    this.scene.add(this.pointlight) ;
    this.scene.add(this.ambientlight);
};

// Initialize the controls
ObjectViewer.prototype.init_controls = function() {
    this.controls = new THREE.TrackballControls(
    	this.camera,
     	this.renderer.domElement
    );
    //this.controls.rotateSpeed *= 2.0;
    this.controls.zoomSpeed *= 2.0;
    //this.controls.panSpeed *= 2.0;
    this.controls.dynamicDampingFactor = 0.3 ;
};

/*! TODO */
ObjectViewer.prototype.get_bounding_box = function()
{
	bounding_box = new BoundingBox() ;

	this.meshes[0].geometry.computeBoundingBox();
	bounding_box.minX = this.meshes[0].geometry.boundingBox.min.x ;
	bounding_box.minX = this.meshes[0].geometry.boundingBox.min.x;
	bounding_box.maxX = this.meshes[0].geometry.boundingBox.max.x;
	bounding_box.minY = this.meshes[0].geometry.boundingBox.min.y;
	bounding_box.maxY = this.meshes[0].geometry.boundingBox.max.y;
	bounding_box.minZ = this.meshes[0].geometry.boundingBox.min.z;
	bounding_box.maxZ = this.meshes[0].geometry.boundingBox.max.z;

	for (obj = 0; obj < this.meshes.length; ++obj) {
	    if (this.meshes[obj].visible) {
	        mesh = this.meshes[obj];
	        mesh.geometry.computeBoundingBox();
	        box3 = mesh.geometry.boundingBox;
	        bounding_box.minX = Math.min(bounding_box.minX, box3.min.x);
	        bounding_box.minY = Math.min(bounding_box.minY, box3.min.y);
	        bounding_box.minZ = Math.min(bounding_box.minZ, box3.min.z);
	        bounding_box.maxX = Math.max(bounding_box.maxX, box3.max.x);
	        bounding_box.maxY = Math.max(bounding_box.maxY, box3.max.y);
	        bounding_box.maxZ = Math.max(bounding_box.maxZ, box3.max.z)
	    }
	}
	return bounding_box ;
}

// Set camera place according to object position
ObjectViewer.prototype.set_camera_place = function() {
    if (this.meshes.length == 0) { return ; }

	bounding_box = this.get_bounding_box() ;
	center = bounding_box.get_center();
	distance = bounding_box.get_distance() ;
	// L'utilisation des enfants de la scene est plus utiles que
	// seuleument les maillages car ainsi tout les objets sont
	// affectés, y compris les Points/Line qui n'ont pas de maillages...
	for (obj = 0; obj < this.scene.children.length; ++obj) {
	        this.scene.children[obj].translateX(-center.x);
	        this.scene.children[obj].translateY(-center.y);
	        this.scene.children[obj].translateZ(-center.z);
	}

	this.camera.up = new THREE.Vector3(0.0, 0.0, -1.0)
    this.camera.position.set(distance * 1.1 , -distance * 1.1 , -distance * 0.3 );
};


// Different color for object
ObjectViewer.prototype.random_color = function() {
	var colors = [];
	colors.push(new THREE.Color("rgb(153, 	0,		0)"));
	colors.push(new THREE.Color("rgb(204, 	102, 	0)"));
	colors.push(new THREE.Color("rgb(204, 	204, 	0)"));
	colors.push(new THREE.Color("rgb(127, 	255,	0)"));
	colors.push(new THREE.Color("rgb(0, 	255,	255)"));
	colors.push(new THREE.Color("rgb(0, 	102, 	204)"));
	colors.push(new THREE.Color("rgb(102, 	0, 		204)"));
	colors.push(new THREE.Color("rgb(192, 	192, 	192)"));
	
	for(var i = 0 ; i < this.meshes.length; ++i)
	{ 
		var cur_mesh = this.meshes[i];
		
		var color = colors[i%colors.length] ;
		cur_mesh.color = new THREE.Color(color) ;
		cur_mesh.material.color = cur_mesh.color;
	}


};

// Resize the renderer according to windows page
ObjectViewer.prototype.resize = function()
{
	this.camera.aspect = window.innerWidth / window.innerHeight;
	this.camera.updateProjectionMatrix();

	this.renderer.setSize( window.innerWidth, window.innerHeight );
}


ObjectViewer.prototype.add_property = function(
	prop_name, 
	prop_array
){
	var last_index = this.meshes.length - 1;
	ov.meshes[last_index].property_names.push(prop_name)
	ov.meshes[last_index].properties.push(prop_array)
}

ObjectViewer.prototype.load_property = function(
	mesh_index,
	property_array,
	numbers
)
{
	if (this.meshes[mesh_index].type == "Surface"){
		this.load_property_surface(mesh_index,property_array,numbers);
	} else if(this.meshes[mesh_index].type == "Points"){
		this.load_property_points(mesh_index,property_array);
	} else if(this.meshes[mesh_index].type == "Line"){
		this.load_property_lines(mesh_index,property_array,numbers);
	}


}


// Load property on a surface
ObjectViewer.prototype.load_property_surface = function(
	mesh_index, // index of the mesh in the array meshes
	property_array,
	surface_geometry_nb
){	
	var cur_mesh = this.meshes[mesh_index] ;
	cur_mesh.material = this.create_surface_material(0xffffff);
	cur_mesh.material.vertexColors = THREE.VertexColors;

	var lut = this.create_color_map(property_array);

	var lutColors = [];
	var offset = 3 * surface_geometry_nb[0] + 2;
	for ( var t = 0; t < surface_geometry_nb[1]; t++ ) {
		for(var p = 0 ; p < 3 ; p++){
			var ind = surface_geometry_nb[offset + t * 3 + p] ;
			var colorValue = property_array[ind] ;
			color = lut.getColor( colorValue );
			lutColors[ 3 * (3*t+p) + 0 ] = color.r;
			lutColors[ 3 * (3*t+p) + 1 ] = color.g;
			lutColors[ 3 * (3*t+p) + 2 ] = color.b;
		}
	}

	cur_mesh.geometry.addAttribute(
		'color',
		new THREE.BufferAttribute( new Float32Array( lutColors ), 3 )
	);

}

ObjectViewer.prototype.create_color_map = function(property_array)
{
	var colorMap = 'rainbow';
	var numberOfColors = 512;
	var lut = new THREE.Lut( colorMap, numberOfColors );
	var max_of_array = Math.max.apply(Math, property_array);
	var min_of_array = Math.min.apply(Math, property_array);
	lut.setMin( min_of_array );
	lut.setMax( max_of_array );
	return lut ;
}


ObjectViewer.prototype.load_property_points = function(
	mesh_index,
	property_array){
	
	var lut = this.create_color_map(property_array);
	var lutColors = [];
	for ( var p_ind = 0; p_ind < property_array.length; p_ind++ ) {
		var colorValue = property_array[p_ind] ;
		var color = lut.getColor( colorValue );
		lutColors[ 3 * p_ind + 0 ] = color.r;
		lutColors[ 3 * p_ind + 1 ] = color.g;
		lutColors[ 3 * p_ind + 2 ] = color.b;
	}
	var cur_mesh =  ov.meshes[mesh_index] ;
	cur_mesh.material = this.create_points_material( 0xffffff );
	cur_mesh.material.vertexColors = THREE.VertexColors;
	cur_mesh.geometry.addAttribute(
		'color',
		new THREE.BufferAttribute( new Float32Array( lutColors ), 3 )
	);
}

ObjectViewer.prototype.load_property_lines = function(
	mesh_index,
	property_array,
	numbers){
	
	var lut = this.create_color_map(property_array);
	var lutColors = [];
	
	for(var l_ind = 0 ; l_ind<numbers.length; ++l_ind){
		for(var p_ind = 0 ; p_ind<numbers[l_ind].length/3 - 1; ++p_ind){
			for(var i_ind = 0 ; i_ind < 2 ; ++i_ind){
				var colorValue = property_array[p_ind+i_ind] ;
				var color = lut.getColor( colorValue );
				lutColors.push(color.r);
				lutColors.push(color.g);
				lutColors.push(color.b);
			}
		}
	}	
	
	var cur_mesh =  ov.meshes[mesh_index] ;
	cur_mesh.material = this.create_line_material( 0xffffff );
	cur_mesh.material.vertexColors = THREE.VertexColors;
	cur_mesh.geometry.addAttribute(
		'color',
		new THREE.BufferAttribute( new Float32Array( lutColors ), 3 )
	);
}


ObjectViewer.prototype.shine = function (mesh)
	{	
		// document.getElementById(mesh.name).style.backgroundColor = "red"; 
		//Recupere l'ancien material avant la 
		// mesh.currentColor = mesh.material.color;
		mesh.material.color.multiplyScalar(2);
		
	}
ObjectViewer.prototype.shine_out = function (mesh)
	{
		// document.getElementById(mesh.name).style.backgroundColor = '#4CAF50';
		mesh.material.color.multiplyScalar(0.5);	
	}
/************************************
*****		  GUIViewer			*****
*************************************/
/*! 
	\class GUIViewer	
	\brief Add a graphical interface to the given Objectviewer
	\memberof GUIViewer
*/
var GUIViewer = function(ov)
{
	this.ov = ov;
	this.cur_index = 0;
}

/*! 
	\fn initialize_interface
	\brief Initialize all div for the graphical interface 
	\memberof GUIViewer
*/
GUIViewer.prototype.initialize_interface = function(text)
{	
	// Creates the left panel
	var div_panel = document.createElement("DIV");
	div_panel.id = "LeftPanel";
	document.body.appendChild(div_panel);

	// Add the text, if any
	if(text!=undefined)
	{
		var div_text = document.createElement("DIV");
		div_text.id = "id:ExplainingText";
		var p_text = this.create_p_text("prop",text)
		div_text.appendChild(p_text);
		document.getElementById("LeftPanel").appendChild(div_text);
	}
	
	// Creates the div for the buttons
	var div_button = this.create_header_1(
		"id:Objects", "Objects", document.getElementById("LeftPanel"));
	// Create the div for the graphical properties
	var div_properties = this.create_header_1(
		"id:Graphical", "Graphical", document.getElementById("LeftPanel"));
	
	// Init the buttons
	// Color button
	
	var this_gui = this ; // this_gui is GUIViewer
	var color_button = this.create_button(
		"colorButton",	"Pick color",	div_properties );
	color_button.setAttribute("textetest", "bla");
	color_button.setAttribute("class",
		"jscolor {valueElement:'chosen-value',onFineChange:'setColor(this)'}");

	// hide and show button
	var hide_show_button = this.create_button(
		"HideAndShow",	"Hide/Show",	div_properties );
	
	// event for hide and show button
	hide_show_button.addEventListener('click', function(){
		this_gui.hide_or_show(this_gui.cur_index)}
	);
	
	// Init the subdiv.
	var div_color = document.createElement("DIV");
	div_color.id = "Color";
	div_properties.appendChild(div_color);
	
	var div_wire = document.createElement("DIV");
	div_wire.id = "wire_div";
	div_properties.appendChild(div_wire);
	document.getElementById("wire_div").appendChild(
		document.createTextNode("Show/Hide Wireframe"));

	// Check box for wireframe or not
	var wire_check = document.createElement("INPUT");
	wire_check.setAttribute("type", "checkbox");
	wire_check.id = "wire_check";
	wire_check.name = "wire_checkbox";
	wire_check.checked = false; 
	document.getElementById("wire_div").appendChild(wire_check);
	wire_check.addEventListener('change', function(){
			this_gui.ov.meshes[this_gui.cur_index].material.wireframe = 
				wire_check.checked ;
	}
	);
	
	// Create the div for the properties
	this.create_header_1(
		"id:Properties", "Properties", document.getElementById("LeftPanel"));
}

GUIViewer.prototype.create_header_1 = function(
	id_name,
	text,
	inside_element)
{
	var div_properties = document.createElement("DIV");
	div_properties.id = id_name;
	var p_properties = this.create_p_text("prop",text)
	div_properties.appendChild(p_properties);
	inside_element.appendChild(div_properties);
	return div_properties ;
}

GUIViewer.prototype.create_p_text = function(
	id_name,
	text)
{
	var p_properties = document.createElement("P");
	p_properties.id = id_name
	p_properties.appendChild(document.createTextNode(text));
	return p_properties ;
}

GUIViewer.prototype.create_button = function(
	id_name,
	text,
	inside_element
)
{
	var button = document.createElement("BUTTON");
	button.id = id_name; 
	button.appendChild(document.createTextNode(text));
	inside_element.appendChild(button);
	return button;
}

var setColor = function(picker)
{
	var cur_mesh = guiviewer.ov.meshes[guiviewer.cur_index] ; 
	cur_mesh.color = new THREE.Color( picker.toRGBString() );
	cur_mesh.material.color = cur_mesh.color;
}

GUIViewer.prototype.hide_or_show = function(index)
{
	this.ov.meshes[index].visible = !this.ov.meshes[index].visible;
}

/// Removes all childs of an element
GUIViewer.prototype.remove_all_child = function(element)
{
	while (element.firstChild) {
 	   element.removeChild(element.firstChild);
	}
}

/// Called each time we click on a button
GUIViewer.prototype.update_panel =function() 
{	
	var cur_mesh = this.ov.meshes[this.cur_index];
	// Update color
	document.getElementById("colorButton").style.backgroundColor = 
		"#"+cur_mesh.material.color.getHexString ();
	// updating check box state
	wire_check.checked = cur_mesh.material.wireframe;
	
	// Remove all childs
	var graph_div = document.getElementById("id:Properties");
	this.remove_all_child(graph_div);
	
	// Re-create the property buttons
	var p_properties = this.create_p_text("prop","Properties")
	graph_div.appendChild(p_properties);
	document.getElementById("LeftPanel").appendChild(graph_div);
	
	// Create all buttons
	var prop_button = this.create_button(
		"id:no-prop-button", "NoProperty",graph_div);
	var this_gui = this;
	prop_button.addEventListener('click', function(){
	
	
	var colors = new THREE.Float32Attribute( 
		cur_mesh.geometry.attributes.color.count * 3, 3 );
	cur_mesh.geometry.attributes.color = colors
	cur_mesh.material = this_gui.ov.
	create_material(cur_mesh.color, cur_mesh.type);
	
	}
	)
		
	for(	var prop_ind = 0; 
			prop_ind < cur_mesh.property_names.length ; 
			++prop_ind)
	{
		var id = "id:prop_button_"+prop_ind+"_"+this.cur_index;
		var prop_button = this.create_button(
			id, cur_mesh.property_names[prop_ind], graph_div);
		prop_button.prop_index = prop_ind;
		
		prop_button.addEventListener('click', function(){
			this_gui.wire_check.checked = false; 
			this_gui.ov.load_property(
				this_gui.cur_index,
				cur_mesh.properties[this.prop_index],
				cur_mesh.numbers
			);
		}
		)
	}
}

/*! \fn create_buttons
	\brief Create the buttons for each object within the array this.ov.meshes
	\memberof GUIViewer
*/
GUIViewer.prototype.create_buttons =function() 
{
	//On recupere les divisions sur lesquelles on va travailler. 
	var first_div = document.getElementById("id:Objects");
	var btns = document.getElementById("HideAndShow");

	
	for (var object = 0; object < this.ov.meshes.length; ++object) {

		button_name_and_id = this.ov.meshes[object].name;
		btn = document.createElement("BUTTON");
		btn.setAttribute("id", button_name_and_id);
		btn.setAttribute("nb", object);
		
		text = document.createTextNode(button_name_and_id);
		btn.appendChild(text);
		first_div.appendChild(btn);
		
		var this_gui = this ; 	// \note this is the GUIViewer
		btn.addEventListener('click', function(){
			this_gui.cur_index = this.getAttribute('nb')
			// \note this is the button and this_gui is the GUIViewer
			this_gui.update_panel();
			// show thee panel if necessary
			document.getElementById("id:Graphical").style.visibility = "visible";
			document.getElementById("id:Properties").style.visibility = "visible";
		}
		)

		btn.addEventListener('mouseover',function(){
		// \note this is the button and this_gui is the GUIViewer
			this_gui.ov.shine(
				this_gui.ov.meshes[this.getAttribute('nb')]
			);
		}
		)

		btn.addEventListener('mouseout', function(){
			// \note this is the button and this_gui is the GUIViewer
			this_gui.ov.shine_out(
				this_gui.ov.meshes[this.getAttribute('nb')]);
		}
		)
	}
	document.getElementById("id:Graphical").style.visibility = "hidden";
	document.getElementById("id:Properties").style.visibility = "hidden";


}


/************************************
*****		BoundingBox			*****
*************************************/
var BoundingBox = function()
{
	this.minX ;
	this.minY ;
	this.minZ ;
	this.maxX ;
	this.maxY ;
	this.maxZ ;
}


BoundingBox.prototype.get_center = function()
{
	v = new THREE.Vector3(
		(this.minX + this.maxX) * 0.5, (this.minY + this.maxY) * 0.5, (this.minZ + this.maxZ) * 0.5);
	return v ;
}

BoundingBox.prototype.get_distance = function()
{
	return Math.sqrt((this.maxX - this.minX) * (this.maxX - this.minX) + (this.maxY - this.minY) * (this.maxY - this.minY) + (this.maxZ - this.minZ) * (this.maxZ - this.minZ));
}

