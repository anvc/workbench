$(document).ready(function() {
	set_collections();
	set_events();
});
$(window).load(function() {
	set_sheet();
});

/**
 * Show or hide the loading dialog
 * @param bool whether to turn off or on
 * @param archive_title title of the archive be added to the list
 * @return null
 */
function loading(bool, archive_title) {
	var $loading = $('#loading');
	if (bool) {
		if ('undefined'!=typeof(archive_title)) $loading.children(':first').append('<div class="a" title="'+archive_title+'">'+archive_title+'</div>');
		$loading.show();
	} else {
		if ('undefined'!=typeof(archive_title)) $loading.find('.a[title="'+archive_title+'"]').remove();
		if (!$loading.find('.a').length) $loading.hide();
	}
}

/**
 * Set UI for the left-side search area
 * @return null
 */
function set_collections() {

	$('input[name="color"]').spectrum({
	    color: "#9999ff"
	});
	$('#create_collection').find('button:last').click(function() {
		$('#create_collection').submit();
	});
	$('#create_collection').submit(function() {
		var $this = $(this);
		var obj = {};
		obj.title = $this.find('[name="title"]').val();
		obj.description = $this.find('[name="description"]').val();
		obj.color = '#'+$this.find('input[name="color"]').spectrum("get").toHex();
		if (!obj.title.length) {
			alert('Please enter a title for the collection');
		} else {
			$('body').trigger("collection_add_node", [ obj ] );
			$this.find('[name="title"]').val('');
			$this.find('[name="description"]').val('');
			$this.modal('hide');
		}
		return false;
	});
	$('#collection_view').find('button').click(function() {
		ui(ui.collection, null, $(this).val());
	});
	$('#delete_collection_link').click(function() {
		if (confirm('Are you sure you wish to delete this collection?')) {
			$('body').trigger("collection_remove_node", [ ui.collection ] );
		}
	});
	
	ui();
	
}

/**
 * Set the UI for search results in one of many possible views
 * @view str optional view to set 
 * @return null
 */
function ui(collection, view, col_view) {
	
	var collections = get_collections();
	if ('undefined'==typeof(collection)) collection = null;
	ui.collection = collection;
	if ('undefined'==typeof(view) || null==view) view = $('.view-buttons').find('button[class*="btn-primary"]').attr('id');
	var $collection_bar = $('#collection_bar');
	var $collection_view = $('#collection_view');
	var $collections_form = $('#collections_form');
	var $delete_collection_link = $('#delete_collection_link');

	// Collection view
	var col_view = ('undefined'==typeof(col_view)) ? $collection_view.find('.btn-primary:first').val() : col_view;
	ui.col_view = col_view;
	$collection_view.find('button').removeClass('btn-primary').addClass('btn-default');
	$collection_view.find('button[value="'+col_view+'"]').removeClass('btn-default').addClass('btn-primary');
	
	// Collections
	$collections_form.children('.all').removeClass('clicked').click(function() { ui(); });
	$collections_form.children(':not(.notice, .all)').remove();
	for (var j in collections) {
		var $collection = $('<div class="collection'+((j==collection)?' clicked':'')+'"></div>');
		$collection.append('<div class="color" style="background-color:'+collections[j].color+';"></div>');
		$collection.append('<h5>'+collections[j].title+'</h5>');
	    $collection.append('<div class="desc">'+collections[j].description+'</div>');
	    $collections_form.append($collection);
	    $collection.data('collections_index', j)
	    $collection.click(function() {
	    	var index = $(this).data('collections_index');
	    	ui(index);
	    });
	}
	
	// Current collection
	var results = {};
	var check = {};
	if (null==collection) {
		if ('edit'==col_view) {
			results = check = get_imported();
		} else {
			results = get_imported();
		}
		$collection_bar.find('.m').html('All imported media');
		$('#spreadsheet_gradient').css('background', '');
		$collections_form.find('.all').addClass('clicked');
		$delete_collection_link.hide();
	} else {
		if ('undefined'==typeof(collections[collection])) {
			alert('There was a problem trying to find the collection.  Please try again.');
			return;
		}
		if ('edit'==col_view) {
			results = get_imported();
			check = collections[collection];			
		} else {
			results = collections[collection].items;
		}
		$collection_bar.find('.m').html(collections[collection].title);
		$('#spreadsheet_gradient').css('background', 'linear-gradient(to bottom, '+convertHex(collections[collection].color,50)+', white)' );
		$('#delete_collection_link').show();
	}

	// Load current view
	if (view == ui.view) {
		$('#spreadsheet_content').spreadsheet_view({rows:results,check:check,num_archives:2});
	} else {
		var view_path = $('link#base_url').attr('href')+'application/views/templates/jquery.'+view+'.js';
		$.getScript(view_path, function() {
			ui.view = view;
			$('#spreadsheet_content').spreadsheet_view({rows:results,check:check,num_archives:2});
		});
	}
	
}

/**
 * Set event handlers for import 
 * @return null
 */
function set_events() {
	
	if ('undefined'==typeof(ns)) ns = $.initNamespaceStorage('tensor_ns');  // global
	if ('undefined'==typeof(storage)) storage = ns.localStorage;  // global
	
	var imported = ('undefined'!=typeof(storage.get('imported'))) ? storage.get('imported') : {};
	$('.num_imported').html( $.map(imported, function(n, i) { return i; }).length );
	
	$("body").on( "import_add_node", function( event, uri, values ) {
		var imported = storage.get('imported');
		if ('undefined'==typeof(imported)) imported = {};
		imported[uri] = values;
		storage.set('imported', imported);
		$('.num_imported').html( $.map(storage.get('imported'), function(n, i) { return i; }).length );
	});	
	$("body").on( "import_remove_node", function( event, uri, values ) {
		var imported = storage.get('imported');
		if ('undefined'==typeof(imported)) imported = {};
		if ('undefined'!=typeof(imported[uri])) delete imported[uri];
		storage.set('imported', imported);	
		$('.num_imported').html( $.map(storage.get('imported'), function(n, i) { return i; }).length );
	});		
	
	$("body").on( "collection_add_node", function( event, obj ) {
		var collections = storage.get('collections');
		if ('undefined'==typeof(collections)) collections = [];
		obj.items = {};
		collections.push(obj);
		storage.set('collections', collections);
		ui((collections.length-1));
	});	
	$("body").on( "collection_remove_node", function( event, index ) {
		var collections = storage.get('collections');
		if ('undefined'==typeof(collections)) collections = [];
		if ('undefined'!=typeof(collections[index])) collections.splice(index, 1);
		storage.set('collections', collections);
		ui();
	});		
	
}

/**
 * Get the imported object from localStorage
 * @return obj imported items
 */
function get_imported() {
	
	if ('undefined'==typeof(ns)) ns = $.initNamespaceStorage('tensor_ns');  // global
	if ('undefined'==typeof(storage)) storage = ns.localStorage;  // global
	var obj = storage.get('imported');
	if ('undefined'==typeof(obj)) obj = {};
	return obj
	
}

/**
 * Get the collections object from localStorage
 * @return obj imported items
 */
function get_collections() {
	
	if ('undefined'==typeof(ns)) ns = $.initNamespaceStorage('tensor_ns');  // global
	if ('undefined'==typeof(storage)) storage = ns.localStorage;  // global
	var arr = storage.get('collections');
	if ('undefined'==typeof(arr)) arr = [];
	return arr;
	
}

function set_sheet() {

	var $spreadsheet = $('#spreadsheet');

	// Buttons
	$('#pegboard_link').click(function() {
		document.location.href = 'pegboard';
	});	
	// Set sheet height
	set_sheet_height();

	// View buttons
	$('.view-buttons').find('button').click(function() {
		var $clicked = $(this);
		$clicked.blur();
		$clicked.siblings(':not(.page)').addClass('btn-default').removeClass('btn-primary');
		$clicked.addClass('btn-primary').removeClass('btn-default');
		ui(ui.collection, $clicked.attr('id'), ui.col_view);
	});
	
}

function set_sheet_height() {
	var $collections = $('.collections');
	var $spreadsheet = $('#spreadsheet');
	var $footer = $('#footer');
	var h = parseInt($(window).height()) - parseInt($footer.outerHeight());
	$collections.css('min-height',h);
	$spreadsheet.css('min-height',h);
}

//http://jsfiddle.net/ekinertac/3Evx5/1/
function convertHex(hex,opacity){
    hex = hex.replace('#','');
    r = parseInt(hex.substring(0,2), 16);
    g = parseInt(hex.substring(2,4), 16);
    b = parseInt(hex.substring(4,6), 16);

    result = 'rgba('+r+','+g+','+b+','+opacity/100+')';
    return result;
}

function sort_rdfjson_by_prop(obj, p) {
	
    ps = [];
    for (var k in obj) {
    	ps.push(obj[k][p][0].value.toLowerCase());
	}
    ps.sort();
	
    var results = {};
    for (var j = 0; j < ps.length; j++) {
    	pv = ps[j];
    	for (var key in obj) {
    		if (obj[key][p][0].value.toLowerCase() == pv) {
    			results[key] = obj[key];
    			continue;
    		}
    	}
    }
    
    return results;

}